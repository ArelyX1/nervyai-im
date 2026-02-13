/**
 * ============================================
 * APP STORE - Presentation Layer (React State)
 * ============================================
 * Global state management using React context.
 * Bridges the hexagonal architecture adapters
 * with the React component tree.
 *
 * Uses useSyncExternalStore pattern for optimal
 * re-render control.
 * ============================================
 */

"use client"

import { useState, useCallback } from "react"
import { skillsAdapter, tasksAdapter, goalsAdapter } from "@/src/shared/infrastructure/container"
import type { SkillRadarData } from "@/src/skills/domain/skill.entity"
import type { Task } from "@/src/tasks/domain/task.entity"
import type { Goal } from "@/src/goals/domain/goal.entity"
import type { UserProfile, UserSettings } from "@/src/user/domain/user.entity"
import { createDefaultUser, createDefaultSettings } from "@/src/user/domain/user.entity"
import { createTask } from "@/src/tasks/domain/task.entity"
import { createGoal } from "@/src/goals/domain/goal.entity"
import { calculateXpWithStreak } from "@/src/tasks/domain/task.entity"

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
  addGoal: (data: Partial<Goal> & Pick<Goal, "title" | "targetCount" | "categoryId">) => void
  incrementGoal: (id: string) => void
  deleteGoal: (id: string) => void

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

    // Award XP to corresponding skill
    if (task.subSkillId) {
      skillsAdapter.updateSubSkillXp(task.skillCategoryId, task.subSkillId, xp)
    }

    // Update user XP
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

  const addGoal = useCallback((data: Partial<Goal> & Pick<Goal, "title" | "targetCount" | "categoryId">) => {
    const goal = createGoal(data)
    goalsAdapter.addGoal(goal)
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  const incrementGoal = useCallback((id: string) => {
    const goal = goalsAdapter.getGoalById(id)
    if (!goal) return
    goalsAdapter.incrementGoalProgress(id, goal.categoryId)
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  const deleteGoal = useCallback((id: string) => {
    goalsAdapter.deleteGoal(id)
    setGoals(goalsAdapter.getAllGoals())
  }, [])

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  return {
    skills, tasks, goals, user, settings,
    addTask, completeTask, deleteTask, updateTask,
    addGoal, incrementGoal, deleteGoal,
    updateUser, updateSettings,
    refresh,
  }
}
