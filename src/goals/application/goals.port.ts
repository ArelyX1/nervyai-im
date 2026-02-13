/**
 * ============================================
 * GOALS PORT - Application Layer (Hexagonal)
 * ============================================
 * Defines the interface (port) for goal data
 * persistence. Goals use DailyEntry-based
 * progress tracking instead of countable grids.
 * ============================================
 */

import type { Goal } from "@/src/goals/domain/goal.entity"

export interface GoalsPort {
  getAllGoals(): Goal[]
  getGoalById(id: string): Goal | undefined
  addGoal(goal: Goal): Goal
  updateGoal(id: string, updates: Partial<Goal>): Goal | undefined
  deleteGoal(id: string): boolean

  /** Toggle a daily entry for a goal on a given date */
  logDailyProgress(goalId: string, date: string, note?: string): Goal | undefined
}
