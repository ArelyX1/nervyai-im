/**
 * ============================================
 * GOALS MEMORY ADAPTER - Infrastructure Layer
 * ============================================
 * In-memory implementation of GoalsPort.
 * Uses DailyEntry-based tracking. Each goal
 * tracks daily completions instead of grid cells.
 * ============================================
 */

import type { GoalsPort } from "@/src/goals/application/goals.port"
import { type Goal, type DailyEntry, createGoal, toDateKey } from "@/src/goals/domain/goal.entity"

// ─── SEED DATA ─────────────────────────────────

function generatePastEntries(daysBack: number, completedCount: number): DailyEntry[] {
  const entries: DailyEntry[] = []
  const today = new Date()
  for (let i = daysBack; i > 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (entries.filter((e) => e.completed).length < completedCount) {
      entries.push({ date: toDateKey(d), completed: Math.random() > 0.25 })
    }
  }
  // Ensure we hit the completed count
  const completedEntries = entries.filter((e) => e.completed).length
  if (completedEntries < completedCount) {
    for (let i = 0; i < entries.length && entries.filter((e) => e.completed).length < completedCount; i++) {
      if (!entries[i].completed) {
        entries[i] = { ...entries[i], completed: true }
      }
    }
  }
  return entries
}

const SEED_GOALS: Goal[] = [
  createGoal({
    title: "Dominar Algoritmos",
    description: "Resolver un problema de algoritmos cada dia",
    dailyAction: "Resolver 1 problema en LeetCode",
    targetDays: 50,
    categoryId: "intellect",
    entries: generatePastEntries(40, 32),
  }),
  createGoal({
    title: "Racha de Ejercicio",
    description: "Entrenar 30 dias consecutivos",
    dailyAction: "Entrenar minimo 30 minutos",
    targetDays: 30,
    categoryId: "wellness",
    entries: generatePastEntries(25, 18),
  }),
  createGoal({
    title: "Leer Cada Dia",
    description: "Leer al menos 20 paginas diarias",
    dailyAction: "Leer 20 paginas de un libro",
    targetDays: 60,
    categoryId: "humanities",
    entries: generatePastEntries(15, 10),
  }),
  createGoal({
    title: "Portfolio Creativo",
    description: "Crear una pieza de arte digital cada dia",
    dailyAction: "Crear 1 pieza de arte/diseno",
    targetDays: 30,
    categoryId: "creativity",
    entries: generatePastEntries(12, 8),
  }),
]

// ─── ADAPTER FACTORY ───────────────────────────

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

    logDailyProgress(goalId, date, note) {
      const idx = goals.findIndex((g) => g.id === goalId)
      if (idx === -1) return undefined

      const goal = goals[idx]
      const existingIdx = goal.entries.findIndex((e) => e.date === date)

      let newEntries: DailyEntry[]
      if (existingIdx >= 0) {
        // Toggle: if already completed, uncomplete
        newEntries = [...goal.entries]
        newEntries[existingIdx] = {
          ...newEntries[existingIdx],
          completed: !newEntries[existingIdx].completed,
          note: note || newEntries[existingIdx].note,
        }
      } else {
        // New entry
        newEntries = [...goal.entries, { date, completed: true, note }]
      }

      goals[idx] = { ...goal, entries: newEntries }
      return goals[idx]
    },
  }
}
