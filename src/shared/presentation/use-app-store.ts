/**
 * ============================================
 * APP STORE - Presentation Layer (React State)
 * ============================================
 * Global state management bridging hexagonal
 * architecture adapters with the React component
 * tree. Includes actions for:
 * - Dynamic skill category & node CRUD
 * - Daily goal progress logging
 * - User profile (with avatar) management
 * - Task management with XP rewards
 * ============================================
 */

"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { skillsAdapter, tasksAdapter, goalsAdapter } from "@/src/shared/infrastructure/container"
import type { SkillRadarData, SkillCategory } from "@/src/skills/domain/skill.entity"
import { findNode } from "@/src/skills/domain/skill.entity"
import type { Task } from "@/src/tasks/domain/task.entity"
import type { Goal } from "@/src/goals/domain/goal.entity"
import type { UserProfile, UserSettings } from "@/src/user/domain/user.entity"
import { createDefaultUser, createDefaultSettings } from "@/src/user/domain/user.entity"
import { createTask, calculateXpWithStreak } from "@/src/tasks/domain/task.entity"
import { createGoal } from "@/src/goals/domain/goal.entity"

/** Hook return type */
export interface AppStore {
  // State
  skills: SkillRadarData
  tasks: Task[]
  goals: Goal[]
  user: UserProfile
  settings: UserSettings

  // Task actions
  addTask: (data: Partial<Task> & Pick<Task, "title" | "skillCategoryId">) => void
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void

  // Goal actions
  addGoal: (data: Partial<Goal> & Pick<Goal, "title" | "targetDays" | "categoryId">) => void
  deleteGoal: (id: string) => void
  logDailyGoalProgress: (goalId: string, date: string, note?: string) => void

  // Skill CRUD actions
  addCategory: (name: string, icon: string, color: string) => void
  removeCategory: (categoryId: string) => void
  addSkillNode: (categoryId: string, parentNodeId: string | null, name: string) => SkillRadarData
  removeSkillNode: (categoryId: string, nodeId: string) => SkillRadarData
  distributeTransitionXp: (categoryId: string, parentNodeId: string, allocations: { nodeId: string; xp: number }[]) => SkillRadarData
  distributeTransitionEqually: (categoryId: string, parentNodeId: string | null) => SkillRadarData

  // User actions
  updateUser: (updates: Partial<UserProfile>) => void
  updateSettings: (updates: Partial<UserSettings>) => void

  // Account (simple username + 4-digit PIN). mode: 'login' | 'create' | undefined (auto)
  loginAccount: (username: string, pin: string, mode?: 'login' | 'create') => Promise<{ ok: boolean; found?: boolean; created?: boolean; error?: string }>
  logoutAccount: () => void
  accountId: string | null

  // Refresh state
  refresh: () => void
  // Force save now to backend (immediate full-state push)
  saveNow: () => Promise<void>
  // Reset everything to first-time state
  resetAll: () => void
}

/** Main application store hook */
export function useAppStore(): AppStore {
  // Try to hydrate from localStorage first (client-only)
  const storageKey = "nervyai-app-state"

  function loadFromStorage(): {
    skills?: SkillRadarData
    tasks?: Task[]
    goals?: Goal[]
    user?: UserProfile
    settings?: UserSettings
  } | null {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      return JSON.parse(raw)
    } catch (e) {
      console.warn("Failed to parse stored state", e)
      return null
    }
  }

  // IMPORTANT: do NOT read `localStorage` during render/SSR — hydrate client-side only
  const [skills, setSkills] = useState<SkillRadarData>(skillsAdapter.getSkillRadar())
  const [tasks, setTasks] = useState<Task[]>(tasksAdapter.getAllTasks())
  const [goals, setGoals] = useState<Goal[]>(goalsAdapter.getAllGoals())
  const [user, setUser] = useState<UserProfile>(createDefaultUser())
  const [settings, setSettings] = useState<UserSettings>(createDefaultSettings())
  const [accountId, setAccountId] = useState<string | null>(null)
  const stateRef = useRef({ skills, tasks, goals, user, settings })
  stateRef.current = { skills, tasks, goals, user, settings }

  function saveToStorage(state: { skills: SkillRadarData; tasks: Task[]; goals: Goal[]; user: UserProfile; settings: UserSettings }) {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (e) {
      console.warn("Failed to save state", e)
    }
  }

  // Backend sync helpers (optional)
  function getDefaultBackendUrl(): string | null {
    if (typeof window === "undefined") return null
    const hostname = window.location?.hostname
    console.debug('[CLIENT] getDefaultBackendUrl: hostname=', hostname)

    // Check if it's localhost or a local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalNetwork = hostname === "localhost" ||
                          hostname?.startsWith("192.168.") ||
                          hostname?.startsWith("10.") ||
                          (hostname?.startsWith("172.") && parseInt(hostname.split(".")[1]) >= 16 && parseInt(hostname.split(".")[1]) <= 31)

    if (isLocalNetwork) {
      const backendUrl = `http://${hostname}:4001/api`
      console.debug('[CLIENT] getDefaultBackendUrl: using backend URL=', backendUrl)
      return backendUrl
    }

    console.debug('[CLIENT] getDefaultBackendUrl: using Next.js API routes')
    return "/api"
  }

  function getBackendUrl(): string {
    if (typeof window === "undefined") return "/api"
    const stored = localStorage.getItem("backendUrl")
    if (stored && stored.trim().length > 0) return stored
    const def = getDefaultBackendUrl()
    return def || "/api"
  }

  function useBackendEnabled() {
    if (typeof window === "undefined") return false
    // Si el usuario lo forzó, respétalo
    const explicit = localStorage.getItem("useBackend")
    if (explicit === "true") return true
    if (explicit === "false") return false
    // Si hay URL explícita o una URL por defecto, usamos backend
    const hasUrl = !!(localStorage.getItem("backendUrl") || getDefaultBackendUrl())
    console.debug('[CLIENT] useBackendEnabled:', hasUrl, 'backendUrl:', getBackendUrl())
    return hasUrl
  }

  async function fetchFromServer() {
    try {
      const url = getBackendUrl()
      // If an account is selected, fetch its state from accounts collection
      const acct = typeof window !== 'undefined' ? localStorage.getItem('accountId') : null
      const endpoint = acct ? `${url}/collections/accounts/${encodeURIComponent(acct)}` : `${url}/state`
      console.debug('[CLIENT] fetchFromServer ->', endpoint)
      const res = await fetch(endpoint)
      if (!res.ok) return null
      const json = await res.json()
      console.debug('[CLIENT] fetchFromServer response', json)
      // if endpoint returned account wrapper, extract .state
      if (json && json.state) return json.state
      return json
    } catch (e) {
      console.warn('fetchFromServer failed', e)
      return null
    }
  }

  async function saveToServer(state: { skills: SkillRadarData; tasks: Task[]; goals: Goal[]; user: UserProfile; settings: UserSettings }) {
    try {
      const url = getBackendUrl()
      const acct = typeof window !== 'undefined' ? localStorage.getItem('accountId') : null
      if (acct) {
        // upsert account with its state (don't send pin on every autosave - only send it if changing)
        console.debug('[CLIENT] saveToServer -> upsert account', acct, 'with state')
        const response = await fetch(`${url}/collections/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: acct, state }),
        })
        if (!response.ok) {
          console.warn('[CLIENT] saveToServer account failed:', response.status, response.statusText)
          return false
        }
        console.debug('[CLIENT] saveToServer account success')
        return true
      }
      console.debug('[CLIENT] saveToServer -> saving state to', `${url}/state`)
      const response = await fetch(`${url}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
      if (!response.ok) {
        console.warn('[CLIENT] saveToServer state failed:', response.status, response.statusText)
        return false
      }
      console.debug('[CLIENT] saveToServer state success')
      return true
    } catch (e) {
      console.warn('[CLIENT] saveToServer error:', e)
      return false
    }
  }

    // Exposed immediate save helper — use current React state so saved data is correct
    async function saveNow() {
      try {
        const state = stateRef.current
        console.debug('[CLIENT] saveNow triggered', state)
        if (useBackendEnabled()) {
          const result = await saveToServer(state)
          if (!result) {
            console.warn('[CLIENT] saveNow: backend save failed, trying localStorage fallback')
          }
        }
        try { saveToStorage(state) } catch (_) {}
        toast.success("Guardado", { description: "Datos guardados correctamente." })
      } catch (e) {
        console.error('[CLIENT] saveNow failed', e)
        toast.error("Error al guardar")
      }
    }

  // Account login/logout helpers. mode: 'login' = must exist; 'create' = must not exist
  async function loginAccount(username: string, pin: string, mode?: 'login' | 'create') {
    const backendUrl = typeof window !== 'undefined' ? getBackendUrl() : null
    const nid = String(username || '').trim().toLowerCase()
    if (backendUrl) {
      try {
        const url = backendUrl.replace(/\/$/, '') // strip trailing slash
        const state = { skills: skillsAdapter.getSkillRadar(), tasks: tasksAdapter.getAllTasks(), goals: goalsAdapter.getAllGoals(), user, settings }
        console.debug('[CLIENT] loginAccount -> POST', `${url}/accounts/login`, ' id=', username, ' mode=', mode)
        const res = await fetch(`${url}/accounts/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: username, pin, state, mode }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          console.warn('[CLIENT] loginAccount failed response:', json)
          return { ok: false, error: json.error || 'login_failed' }
        }
        const json = await res.json()
        console.debug('[CLIENT] loginAccount response', json)
        if (json && json.ok) {
          // apply returned state and sync to adapters so save/refresh use correct data
          if (json.state) {
            console.debug('[CLIENT] loginAccount: applying returned state', json.state)
            if (json.state.skills) {
              setSkills(json.state.skills)
              ;(skillsAdapter as any).loadSkillRadar?.(json.state.skills)
            }
            if (json.state.tasks) {
              setTasks(json.state.tasks)
              ;(tasksAdapter as any).loadTasks?.(json.state.tasks)
            }
            if (json.state.goals) {
              setGoals(json.state.goals)
              ;(goalsAdapter as any).loadGoals?.(json.state.goals)
            }
            if (json.state.user) setUser(json.state.user)
            if (json.state.settings) setSettings(json.state.settings)
            try { saveToStorage(json.state) } catch (_) {}
          }
          // store normalized account id locally so subsequent calls match server
          localStorage.setItem('accountId', nid)
          localStorage.setItem('accountPin', pin)
          setAccountId(nid)
          console.debug('[CLIENT] loginAccount -> stored accountId=', nid)
          return { ok: true, found: !!json.found, created: !!json.created }
        }
        console.warn('[CLIENT] loginAccount: ok was false in response')
        return { ok: false }
      } catch (e) {
        console.warn('[CLIENT] loginAccount failed (backend)', e)
        // fallthrough to local account fallback if backend fails
      }
    }

    // Fallback: local-only account stored in device localStorage
    try {
      const key = `local_account_${nid}`
      const state = { skills: skillsAdapter.getSkillRadar(), tasks: tasksAdapter.getAllTasks(), goals: goalsAdapter.getAllGoals(), user, settings }
      const payload = { id: username, pin, state }
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(payload))
      localStorage.setItem('accountId', nid)
      localStorage.setItem('accountPin', pin)
      setAccountId(nid)
      console.debug('[CLIENT] loginAccount -> created local account key=', key)
      return { ok: true, found: false, created: true }
    } catch (e) {
      console.warn('loginAccount local failed', e)
      return { ok: false }
    }
  }

  function logoutAccount() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accountId')
      localStorage.removeItem('accountPin')
    }
    setAccountId(null)
  }

  // On mount, hydrate state from backend (if enabled) or from localStorage.
  useEffect(() => {
    let mounted = true
    let autosaveTimer: NodeJS.Timeout | null = null
    
    async function hydrate() {
      if (typeof window !== 'undefined') {
        const acct = localStorage.getItem('accountId')
        if (acct === 'simuser') {
          localStorage.removeItem('accountId')
          localStorage.removeItem('accountPin')
          localStorage.removeItem('nervyai-app-state')
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith('local_account_')) localStorage.removeItem(key)
          }
          setAccountId(null)
          return
        }
      }
      if (useBackendEnabled()) {
        const acct = typeof window !== 'undefined' ? localStorage.getItem('accountId') : null
        const json = await fetchFromServer()
        if (!mounted) return
        if (json) {
          if (json.skills) {
            setSkills(json.skills)
            ;(skillsAdapter as any).loadSkillRadar?.(json.skills)
          }
          if (json.tasks) {
            setTasks(json.tasks)
            ;(tasksAdapter as any).loadTasks?.(json.tasks)
          }
          if (json.goals) {
            setGoals(json.goals)
            ;(goalsAdapter as any).loadGoals?.(json.goals)
          }
          if (json.user) setUser(json.user)
          if (json.settings) setSettings(json.settings)
          try { saveToStorage(json) } catch (_) {}
        }
        if (acct && acct !== 'simuser') setAccountId(acct)
        return
      }

      // hydrate from localStorage (client-only) — do not run during SSR
      try {
        const raw = loadFromStorage()
        if (!raw || !mounted) return
        if (raw.skills) {
          setSkills(raw.skills)
          ;(skillsAdapter as any).loadSkillRadar?.(raw.skills)
        }
        if (raw.tasks) {
          setTasks(raw.tasks)
          ;(tasksAdapter as any).loadTasks?.(raw.tasks)
        }
        if (raw.goals) {
          setGoals(raw.goals)
          ;(goalsAdapter as any).loadGoals?.(raw.goals)
        }
        if (raw.user) setUser(raw.user)
        if (raw.settings) setSettings(raw.settings)
        // restore last logged account if any (skip simuser - invalid)
        if (typeof window !== 'undefined') {
          const acct = localStorage.getItem('accountId')
          if (acct && acct !== 'simuser') setAccountId(acct)
        }
        // If there's a local account saved (backend disabled), load it
        if (typeof window !== 'undefined') {
          const acct = localStorage.getItem('accountId')
          if (acct && !useBackendEnabled()) {
            try {
              const key = `local_account_${acct}`
              const rawAcct = localStorage.getItem(key)
              if (rawAcct) {
                const parsed = JSON.parse(rawAcct)
                if (parsed.state) {
                  if (parsed.state.skills) {
                    setSkills(parsed.state.skills)
                    ;(skillsAdapter as any).loadSkillRadar?.(parsed.state.skills)
                  }
                  if (parsed.state.tasks) {
                    setTasks(parsed.state.tasks)
                    ;(tasksAdapter as any).loadTasks?.(parsed.state.tasks)
                  }
                  if (parsed.state.goals) {
                    setGoals(parsed.state.goals)
                    ;(goalsAdapter as any).loadGoals?.(parsed.state.goals)
                  }
                  if (parsed.state.user) setUser(parsed.state.user)
                  if (parsed.state.settings) setSettings(parsed.state.settings)
                }
                setAccountId(acct)
              }
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    
    hydrate()
    
    // Autosave interval: when a backendUrl exists, periodically push current state
    try {
      if (typeof window !== 'undefined' && useBackendEnabled()) {
        console.debug('[useAppStore] setting up autosave every 20s, backend URL:', getBackendUrl())
        autosaveTimer = setInterval(() => {
          if (mounted) {
            const s = stateRef.current
            console.debug('[useAppStore] autosave firing, state.user.totalXp:', s.user?.totalXp)
            saveToServer(s)
            try { saveToStorage(s) } catch (_) {}
          }
        }, 20000) // every 20s
      }
    } catch (e) {
      console.warn('[useAppStore] autosave setup failed', e)
    }
    
    return () => {
      mounted = false
      if (autosaveTimer) clearInterval(autosaveTimer)
    }
  }, [])

  const refresh = useCallback(() => {
    setSkills(skillsAdapter.getSkillRadar())
    setTasks(tasksAdapter.getAllTasks())
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  // ─── TASK ACTIONS ──────────────────────────

  const addTask = useCallback((data: Partial<Task> & Pick<Task, "title" | "skillCategoryId">) => {
    const task = createTask(data)
    tasksAdapter.addTask(task)
    const t = tasksAdapter.getAllTasks()
    setTasks(t)
    const state = { skills, tasks: t, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  const completeTask = useCallback((id: string) => {
    const task = tasksAdapter.getTaskById(id)
    if (!task) return
    tasksAdapter.completeTask(id)
    const xp = calculateXpWithStreak(task)

    // Award XP to appropriate node. If user selected a parent that now has children,
    // prefer a 'transition' child (created when we moved existing XP into children).
    const cat = skillsAdapter.getCategory(task.skillCategoryId)
    if (cat && cat.children.length > 0) {
      let targetNodeId: string
      if (task.subSkillId) {
        const node = findNode(cat.children, task.subSkillId)
        if (node) {
          if (node.children.length > 0) {
            const trans = node.children.find((c) => c.id.startsWith("trans-") || /general/i.test(c.name))
            targetNodeId = trans ? trans.id : task.subSkillId
          } else {
            targetNodeId = task.subSkillId
          }
        } else {
          targetNodeId = cat.children[0].id
        }
      } else {
        targetNodeId = cat.children[0].id
      }
      skillsAdapter.updateNodeXp(task.skillCategoryId, targetNodeId, xp)
    }

    // Update user XP
    const newSkills = skillsAdapter.getSkillRadar()
    const newUser: UserProfile = {
      ...user,
      totalXp: user.totalXp + xp,
      currentStreak: user.currentStreak + 1,
      longestStreak: Math.max(user.longestStreak, user.currentStreak + 1),
    }
    setUser(newUser)
    setSkills(newSkills)
    refresh()
    
    // IMMEDIATELY SAVE
    const state = { skills: newSkills, tasks: tasksAdapter.getAllTasks(), goals: goalsAdapter.getAllGoals(), user: newUser, settings }
    try { saveToStorage(state) } catch (_) {}
    if (useBackendEnabled()) saveToServer(state)
  }, [settings])

  const deleteTask = useCallback((id: string) => {
    tasksAdapter.deleteTask(id)
    const t = tasksAdapter.getAllTasks()
    setTasks(t)
    const state = { skills, tasks: t, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    tasksAdapter.updateTask(id, updates)
    const t = tasksAdapter.getAllTasks()
    setTasks(t)
    const state = { skills, tasks: t, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  // ─── GOAL ACTIONS ──────────────────────────

  const addGoal = useCallback((data: Partial<Goal> & Pick<Goal, "title" | "targetDays" | "categoryId">) => {
    const goal = createGoal(data)
    goalsAdapter.addGoal(goal)
    const g = goalsAdapter.getAllGoals()
    setGoals(g)
    const state = { skills, tasks, goals: g, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
    toast.success("Objetivo agregado", { description: data.title })
  }, [])

  const deleteGoal = useCallback((id: string) => {
    goalsAdapter.deleteGoal(id)
    const g = goalsAdapter.getAllGoals()
    setGoals(g)
    const state = { skills, tasks, goals: g, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  const logDailyGoalProgress = useCallback((goalId: string, date: string, note?: string) => {
    // log progress and get the updated goal back
    const updated = goalsAdapter.logDailyProgress(goalId, date, note)
    const g = goalsAdapter.getAllGoals()
    setGoals(g)

    // If the action resulted in a newly completed entry (not toggled off), award XP
    let finalUser: UserProfile | undefined = undefined
    try {
      if (updated) {
        const entry = updated.entries.find((e) => e.date === date)
        if (entry && entry.completed) {
          // XP for goal daily completion: use goal.xpPerDay if provided
          const xpForGoal = typeof updated.xpPerDay === 'number' ? updated.xpPerDay : 15
          const cat = skillsAdapter.getCategory(updated.categoryId)
          if (cat && cat.children.length > 0) {
            // Determine target node: prefer explicit goal.subSkillId, else prefer transition child anywhere, else first child
            let targetNodeId: string | null = null
            if (updated.subSkillId) {
              const node = findNode(cat.children, updated.subSkillId)
              if (node) targetNodeId = updated.subSkillId
            }

            if (!targetNodeId) {
              function findTransition(nodes: any[]): any | null {
                for (const n of nodes) {
                  if (n.id && String(n.id).startsWith("trans-")) return n
                  if (n.name && /general/i.test(n.name)) return n
                  if (n.children && n.children.length > 0) {
                    const found = findTransition(n.children)
                    if (found) return found
                  }
                }
                return null
              }
              const trans = findTransition(cat.children)
              targetNodeId = trans ? trans.id : (cat.children[0] ? cat.children[0].id : null)
            }

            if (targetNodeId) {
              skillsAdapter.updateNodeXp(updated.categoryId, targetNodeId, xpForGoal)
              const snap = skillsAdapter.getSkillRadar()
              setSkills(snap)
              // increment user's total XP using functional update to avoid stale closures
              setUser((prev) => {
                const updatedUser = { ...prev, totalXp: prev.totalXp + xpForGoal }
                finalUser = updatedUser
                return updatedUser
              })
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to award XP for goal entry', e)
    }

    // use the updated snapshots if we modified them
    const finalSkills = skillsAdapter.getSkillRadar()
    const finalStateUser = typeof finalUser !== 'undefined' ? finalUser : user
    const state = { skills: finalSkills, tasks, goals: g, user: finalStateUser, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  // ─── SKILL CRUD ACTIONS ────────────────────

  const addCategory = useCallback((name: string, icon: string, color: string) => {
    const snap = skillsAdapter.addCategory(name, icon, color)
    setSkills(snap)
    const state = { skills: snap, tasks, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  const removeCategory = useCallback((categoryId: string) => {
    const snap = skillsAdapter.removeCategory(categoryId)
    setSkills(snap)
    const state = { skills: snap, tasks, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
  }, [])

  const addSkillNode = useCallback((categoryId: string, parentNodeId: string | null, name: string) => {
    const snapshot = skillsAdapter.addSkillNode(categoryId, parentNodeId, name)
    setSkills(snapshot)
    const state = { skills: snapshot, tasks, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
    return snapshot
  }, [])

  const removeSkillNode = useCallback((categoryId: string, nodeId: string) => {
    const snapshot = skillsAdapter.removeSkillNode(categoryId, nodeId)
    setSkills(snapshot)
    const state = { skills: snapshot, tasks, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
    return snapshot
  }, [])

  const distributeTransitionXp = useCallback((categoryId: string, parentNodeId: string, allocations: { nodeId: string; xp: number }[]) => {
    const snapshot = skillsAdapter.distributeTransitionXp(categoryId, parentNodeId, allocations)
    setSkills(snapshot)
    const state = { skills: snapshot, tasks, goals, user, settings }
    saveToStorage(state)
    if (useBackendEnabled()) saveToServer(state)
    return snapshot
  }, [])
  
    const distributeTransitionEqually = useCallback((categoryId: string, parentNodeId: string | null) => {
      // Calls adapter helper to distribute transition XP equally across children
        const snapshot = (skillsAdapter as any).distributeTransitionEqually(categoryId, parentNodeId)
        setSkills(snapshot)
        const state = { skills: snapshot, tasks, goals, user, settings }
        saveToStorage(state)
        if (useBackendEnabled()) saveToServer(state)
        return snapshot
    }, [])

    // Reset everything to an initial-first-run state (zero progress, empty lists)
    const resetAll = useCallback(() => {
      // If backend is enabled, call the server reset endpoint and hydrate from returned seed
      if (useBackendEnabled()) {
        (async () => {
          try {
            const url = getBackendUrl()
            const res = await fetch(`${url}/reset`, { method: 'POST' })
            if (!res.ok) throw new Error('reset failed')
            const body = await res.json()
            const seed = body.seed || body
            if (seed.skills) setSkills(seed.skills)
            if (seed.tasks) setTasks(seed.tasks)
            if (seed.goals) setGoals(seed.goals)
            if (seed.user) setUser(seed.user)
            if (seed.settings) setSettings(seed.settings)
            try { saveToStorage(seed) } catch (_) {}
          } catch (e) {
            // Fallback local reset
            const sk = (skillsAdapter as any).resetProgress() as SkillRadarData
            const t = (tasksAdapter as any).resetTasks() as Task[]
            const g = (goalsAdapter as any).resetGoals() as Goal[]
            const u = createDefaultUser()
            const s = createDefaultSettings()
            setSkills(sk)
            setTasks(t)
            setGoals(g)
            setUser(u)
            setSettings(s)
            saveToStorage({ skills: sk, tasks: t, goals: g, user: u, settings: s })
          }
        })()
        return
      }

      const sk = (skillsAdapter as any).resetProgress() as SkillRadarData
      const t = (tasksAdapter as any).resetTasks() as Task[]
      const g = (goalsAdapter as any).resetGoals() as Goal[]
      const u = createDefaultUser()
      const s = createDefaultSettings()

      setSkills(sk)
      setTasks(t)
      setGoals(g)
      setUser(u)
      setSettings(s)

      saveToStorage({ skills: sk, tasks: t, goals: g, user: u, settings: s })
    }, [])

  // ─── USER ACTIONS ──────────────────────────

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  return {
    skills, tasks, goals, user, settings,
    addTask, completeTask, deleteTask, updateTask,
    addGoal, deleteGoal, logDailyGoalProgress,
    addCategory, removeCategory, addSkillNode, removeSkillNode,
      distributeTransitionXp, distributeTransitionEqually,
        updateUser, updateSettings, refresh, resetAll,
    // account helpers
    loginAccount, logoutAccount, accountId,
    saveNow,
  }
}
