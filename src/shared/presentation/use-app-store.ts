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

import { useState, useCallback } from "react"
import { skillsAdapter, tasksAdapter, goalsAdapter } from "@/src/shared/infrastructure/container"
import type { SkillRadarData, SkillCategory } from "@/src/skills/domain/skill.entity"
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
  addSkillNode: (categoryId: string, parentNodeId: string | null, name: string) => void
  removeSkillNode: (categoryId: string, nodeId: string) => void

  // User actions
  updateUser: (updates: Partial<UserProfile>) => void
  updateSettings: (updates: Partial<UserSettings>) => void

  // Refresh state
  refresh: () => void
}

/** Main application store hook */
export function useAppStore(): AppStore {
  const [skills, setSkills] = useState<SkillRadarData>(skillsAdapter.getSkillRadar())
  const [tasks, setTasks] = useState<Task[]>(tasksAdapter.getAllTasks())
  const [goals, setGoals] = useState<Goal[]>(goalsAdapter.getAllGoals())
  const [user, setUser] = useState<UserProfile>(createDefaultUser())
  const [settings, setSettings] = useState<UserSettings>(createDefaultSettings())

  const refresh = useCallback(() => {
    setSkills(skillsAdapter.getSkillRadar())
    setTasks(tasksAdapter.getAllTasks())
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  // ─── TASK ACTIONS ──────────────────────────

  const addTask = useCallback((data: Partial<Task> & Pick<Task, "title" | "skillCategoryId">) => {
    const task = createTask(data)
    tasksAdapter.addTask(task)
    setTasks(tasksAdapter.getAllTasks())
  }, [])

  const completeTask = useCallback((id: string) => {
    const task = tasksAdapter.getTaskById(id)
    if (!task) return
    tasksAdapter.completeTask(id)
    const xp = calculateXpWithStreak(task)

    // Award XP to first child node of matching category
    const cat = skillsAdapter.getCategory(task.skillCategoryId)
    if (cat && cat.children.length > 0) {
      const targetNode = task.subSkillId
        ? task.subSkillId
        : cat.children[0].id
      skillsAdapter.updateNodeXp(task.skillCategoryId, targetNode, xp)
    }

    setUser((prev) => ({
      ...prev,
      totalXp: prev.totalXp + xp,
      currentStreak: prev.currentStreak + 1,
      longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
    }))
    refresh()
  }, [refresh])

  const deleteTask = useCallback((id: string) => {
    tasksAdapter.deleteTask(id)
    setTasks(tasksAdapter.getAllTasks())
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    tasksAdapter.updateTask(id, updates)
    setTasks(tasksAdapter.getAllTasks())
  }, [])

  // ─── GOAL ACTIONS ──────────────────────────

  const addGoal = useCallback((data: Partial<Goal> & Pick<Goal, "title" | "targetDays" | "categoryId">) => {
    const goal = createGoal(data)
    goalsAdapter.addGoal(goal)
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  const deleteGoal = useCallback((id: string) => {
    goalsAdapter.deleteGoal(id)
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  const logDailyGoalProgress = useCallback((goalId: string, date: string, note?: string) => {
    goalsAdapter.logDailyProgress(goalId, date, note)
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  // ─── SKILL CRUD ACTIONS ────────────────────

  const addCategory = useCallback((name: string, icon: string, color: string) => {
    setSkills(skillsAdapter.addCategory(name, icon, color))
  }, [])

  const removeCategory = useCallback((categoryId: string) => {
    setSkills(skillsAdapter.removeCategory(categoryId))
  }, [])

  const addSkillNode = useCallback((categoryId: string, parentNodeId: string | null, name: string) => {
    setSkills(skillsAdapter.addSkillNode(categoryId, parentNodeId, name))
  }, [])

  const removeSkillNode = useCallback((categoryId: string, nodeId: string) => {
    setSkills(skillsAdapter.removeSkillNode(categoryId, nodeId))
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
    updateUser, updateSettings, refresh,
  }
}
