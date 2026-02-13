/**
 * ============================================
 * TASK ENTITY - Domain Layer
 * ============================================
 * Core domain model for activities and tasks
 * in the NervyAI personal development tracker.
 *
 * Tasks are the atomic unit of progress. Each
 * task maps to a skill category and contributes
 * XP upon completion and validation.
 * ============================================
 */

import type { SkillCategoryId } from "@/src/skills/domain/skill.entity"

/** How often a task repeats */
export type TaskFrequency =
  | "daily"
  | "every-other-day"
  | "weekly"
  | "monthly"
  | "one-time"
  | "custom"

/** Priority levels for task ordering */
export type TaskPriority = "low" | "medium" | "high" | "critical"

/** Current lifecycle state of a task */
export type TaskStatus = "pending" | "in-progress" | "completed" | "failed" | "skipped"

/** Proof types required for task validation */
export type ValidationRule =
  | "none"
  | "minimum-time"
  | "photo-proof"
  | "location-check"
  | "manual-confirm"

/** Full task definition */
export interface Task {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly skillCategoryId: SkillCategoryId
  readonly subSkillId?: string
  readonly frequency: TaskFrequency
  readonly priority: TaskPriority
  readonly status: TaskStatus
  readonly validationRule: ValidationRule
  readonly xpReward: number
  readonly dueDate?: string // ISO date
  readonly completedAt?: string // ISO datetime
  readonly createdAt: string // ISO datetime
  readonly tags: string[]
  /** For custom frequency: cron-like pattern or specific days */
  readonly customSchedule?: string
  /** Minimum minutes required for time-based validation */
  readonly minimumMinutes?: number
  /** Streak count for consecutive completions */
  readonly streak: number
}

/** Create a new task with defaults */
export function createTask(partial: Partial<Task> & Pick<Task, "title" | "skillCategoryId">): Task {
  return {
    id: crypto.randomUUID(),
    description: "",
    frequency: "daily",
    priority: "medium",
    status: "pending",
    validationRule: "manual-confirm",
    xpReward: 10,
    createdAt: new Date().toISOString(),
    tags: [],
    streak: 0,
    ...partial,
  }
}

/** Check if a task is overdue */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "completed") return false
  return new Date(task.dueDate) < new Date()
}

/** Calculate XP with streak bonus */
export function calculateXpWithStreak(task: Task): number {
  const streakMultiplier = 1 + Math.min(task.streak * 0.05, 0.5) // Max 50% bonus
  return Math.round(task.xpReward * streakMultiplier)
}
