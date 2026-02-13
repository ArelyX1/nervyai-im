/**
 * ============================================
 * GOALS MEMORY ADAPTER - Infrastructure Layer
 * ============================================
 * In-memory implementation of GoalsPort.
 * Manages the goals grid with cell illumination
 * logic and overachievement detection.
 * ============================================
 */

import type { GoalsPort } from "@/src/goals/application/goals.port"
import { type Goal, createGoal, isGoalOverachieved } from "@/src/goals/domain/goal.entity"
import type { SkillCategoryId } from "@/src/skills/domain/skill.entity"

const SEED_GOALS: Goal[] = [
  createGoal({
    title: "Dominar Algoritmos",
    description: "Completar 50 problemas de algoritmos",
    targetCount: 50,
    categoryId: "intellect",
    currentCount: 32,
    cells: Array.from({ length: 50 }, (_, i) => ({
      index: i,
      filled: i < 32,
      categoryId: i < 32 ? "intellect" as SkillCategoryId : null,
      ...(i < 32 ? { filledAt: new Date(Date.now() - (32 - i) * 86400000).toISOString() } : {}),
    })),
  }),
  createGoal({
    title: "Racha de Ejercicio",
    description: "Entrenar 30 dias consecutivos",
    targetCount: 30,
    categoryId: "wellness",
    currentCount: 18,
    cells: Array.from({ length: 30 }, (_, i) => ({
      index: i,
      filled: i < 18,
      categoryId: i < 18 ? "wellness" as SkillCategoryId : null,
      ...(i < 18 ? { filledAt: new Date(Date.now() - (18 - i) * 86400000).toISOString() } : {}),
    })),
  }),
  createGoal({
    title: "Leer 12 Libros",
    description: "Un libro por mes durante todo el año",
    targetCount: 12,
    categoryId: "humanities",
    currentCount: 5,
    cells: Array.from({ length: 12 }, (_, i) => ({
      index: i,
      filled: i < 5,
      categoryId: i < 5 ? "humanities" as SkillCategoryId : null,
      ...(i < 5 ? { filledAt: new Date(Date.now() - (5 - i) * 2592000000).toISOString() } : {}),
    })),
  }),
  createGoal({
    title: "Portfolio Creativo",
    description: "Crear 20 piezas de arte digital",
    targetCount: 20,
    categoryId: "creativity",
    currentCount: 8,
    cells: Array.from({ length: 20 }, (_, i) => ({
      index: i,
      filled: i < 8,
      categoryId: i < 8 ? "creativity" as SkillCategoryId : null,
    })),
  }),
]

export function createGoalsMemoryAdapter(): GoalsPort {
  let goals: Goal[] = [...SEED_GOALS]

  return {
    getAllGoals: () => [...goals],

    getGoalById: (id) => goals.find((g) => g.id === id),

    addGoal(goal: Goal) {
      goals = [...goals, goal]
      return goal
    },

    updateGoal(id, updates) {
      const idx = goals.findIndex((g) => g.id === id)
      if (idx === -1) return undefined
      goals[idx] = { ...goals[idx], ...updates }
      return goals[idx]
    },

    deleteGoal(id) {
      const len = goals.length
      goals = goals.filter((g) => g.id !== id)
      return goals.length < len
    },

    incrementGoalProgress(id, categoryId) {
      const idx = goals.findIndex((g) => g.id === id)
      if (idx === -1) return undefined

      const goal = goals[idx]
      const newCount = goal.currentCount + 1
      const updatedCells = [...goal.cells]

      // Fill the next empty cell
      const emptyIdx = updatedCells.findIndex((c) => !c.filled)
      if (emptyIdx !== -1) {
        updatedCells[emptyIdx] = {
          ...updatedCells[emptyIdx],
          filled: true,
          categoryId: categoryId as SkillCategoryId,
          filledAt: new Date().toISOString(),
        }
      } else {
        // Overachieved: expand grid
        updatedCells.push({
          index: updatedCells.length,
          filled: true,
          categoryId: categoryId as SkillCategoryId,
          filledAt: new Date().toISOString(),
        })
      }

      goals[idx] = {
        ...goal,
        currentCount: newCount,
        cells: updatedCells,
        isOverachieved: isGoalOverachieved({ ...goal, currentCount: newCount }),
      }

      return goals[idx]
    },
  }
}
