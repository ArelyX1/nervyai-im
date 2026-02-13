/**
 * ============================================
 * GOALS PORT - Application Layer (Hexagonal)
 * ============================================
 * Defines the interface (port) for goal
 * data persistence adapters.
 * ============================================
 */

import type { Goal } from "@/src/goals/domain/goal.entity"

export interface GoalsPort {
  getAllGoals(): Goal[]
  getGoalById(id: string): Goal | undefined
  addGoal(goal: Goal): Goal
  updateGoal(id: string, updates: Partial<Goal>): Goal | undefined
  deleteGoal(id: string): boolean
  incrementGoalProgress(id: string, categoryId: string): Goal | undefined
}
