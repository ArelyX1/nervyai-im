/**
 * ============================================
 * GOAL ENTITY - Domain Layer (Daily Entries)
 * ============================================
 * Goals are NOT grids of countable squares.
 * Instead, each goal represents a big objective
 * broken into daily micro-actions. Progress is
 * tracked via DailyEntry records, one per day.
 *
 * The UI shows: progress bar, streak counter,
 * weekly heatmap (7 dots for current week).
 * Daily registration happens from Calendar/Agenda.
 * ============================================
 */

import { generateUUID } from "@/src/tasks/domain/task.entity"

/** Single daily check-in for a goal */
export interface DailyEntry {
  readonly date: string      // YYYY-MM-DD
  readonly completed: boolean
  readonly note?: string
}

/** Goal status */
export type GoalStatus = "active" | "completed" | "paused"

/** Full goal model */
export interface Goal {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly dailyAction: string      // "Hacer 30 min de ejercicio"
  readonly targetDays: number       // e.g. 30 days
  readonly categoryId: string       // dynamic - matches any SkillCategory id
  readonly subSkillId?: string      // optional specific sub-skill to award XP to
  readonly xpPerDay?: number        // XP awarded per completed daily entry
  readonly entries: DailyEntry[]
  readonly createdAt: string        // ISO
  readonly status: GoalStatus
}

// ─── DOMAIN FUNCTIONS ───────────────────────────

/** Get total completed days */
export function getCompletedDays(goal: Goal): number {
  return goal.entries.filter((e) => e.completed).length
}

/** Get progress percentage (0-100+) */
export function getProgressPercent(goal: Goal): number {
  if (goal.targetDays === 0) return 0
  return Math.round((getCompletedDays(goal) / goal.targetDays) * 100)
}

/** Get current streak (consecutive days from today backwards) */
export function getCurrentStreak(goal: Goal): number {
  const sorted = [...goal.entries]
    .filter((e) => e.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
  if (sorted.length === 0) return 0

  let streak = 0
  const today = new Date()
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  for (let i = 0; i < sorted.length; i++) {
    const checkDate = new Date(currentDate)
    checkDate.setDate(checkDate.getDate() - i)
    const checkKey = toDateKey(checkDate)

    if (sorted.some((e) => e.date === checkKey)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/** Check whether an entry exists for a given date */
export function hasEntryForDate(goal: Goal, date: string): boolean {
  return goal.entries.some((e) => e.date === date && e.completed)
}

/** Get the last 7 days' completion status */
export function getWeekHeatmap(goal: Goal): { date: string; completed: boolean }[] {
  const result: { date: string; completed: boolean }[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = toDateKey(d)
    result.push({
      date: key,
      completed: goal.entries.some((e) => e.date === key && e.completed),
    })
  }
  return result
}

/** Create a new goal with defaults */
export function createGoal(
  partial: Partial<Goal> & Pick<Goal, "title" | "targetDays" | "categoryId">
): Goal {
  return {
    id: generateUUID(),
    description: "",
    dailyAction: "",
    entries: [],
    createdAt: new Date().toISOString(),
    status: "active",
    xpPerDay: 15,
    ...partial,
  }
}

/** Helper: date to YYYY-MM-DD key */
export function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0]
}
