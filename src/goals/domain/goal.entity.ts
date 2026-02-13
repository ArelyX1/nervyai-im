/**
 * ============================================
 * GOAL ENTITY - Domain Layer
 * ============================================
 * Goals are collections of tasks organized in
 * a visual grid. Each cell in the grid lights
 * up as tasks are completed.
 *
 * The "Overachieved" state triggers when the
 * user exceeds the target task count.
 * ============================================
 */

import type { SkillCategoryId } from "@/src/skills/domain/skill.entity"

/** Single cell in the goals grid */
export interface GoalGridCell {
  readonly index: number
  readonly filled: boolean
  readonly categoryId: SkillCategoryId | null
  readonly filledAt?: string
}

/** Full goal with its progress grid */
export interface Goal {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly targetCount: number
  readonly currentCount: number
  readonly cells: GoalGridCell[]
  readonly isOverachieved: boolean
  readonly createdAt: string
  readonly deadline?: string
  readonly categoryId: SkillCategoryId
}

/** Check whether a goal has been overachieved */
export function isGoalOverachieved(goal: Goal): boolean {
  return goal.currentCount > goal.targetCount
}

/** Calculate goal completion percentage (can exceed 100%) */
export function goalProgress(goal: Goal): number {
  if (goal.targetCount === 0) return 0
  return Math.round((goal.currentCount / goal.targetCount) * 100)
}

/** Create empty grid cells for a new goal */
export function createGoalGrid(targetCount: number): GoalGridCell[] {
  return Array.from({ length: targetCount }, (_, i) => ({
    index: i,
    filled: false,
    categoryId: null,
  }))
}

/** Create a new goal with defaults */
export function createGoal(
  partial: Partial<Goal> & Pick<Goal, "title" | "targetCount" | "categoryId">
): Goal {
  return {
    id: crypto.randomUUID(),
    description: "",
    currentCount: 0,
    cells: createGoalGrid(partial.targetCount),
    isOverachieved: false,
    createdAt: new Date().toISOString(),
    ...partial,
  }
}
