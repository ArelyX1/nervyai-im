/**
 * ============================================
 * TASKS MEMORY ADAPTER - Infrastructure Layer
 * ============================================
 * In-memory implementation of TasksPort.
 * Provides CRUD operations for tasks with
 * seed data for demonstration.
 * ============================================
 */

import type { TasksPort } from "@/src/tasks/application/tasks.port"
import { type Task, type TaskStatus, createTask } from "@/src/tasks/domain/task.entity"

/** Seed tasks for demonstration (empty for fresh installs) */
const SEED_TASKS: Task[] = []

export function createTasksMemoryAdapter(): TasksPort {
  let tasks: Task[] = [...SEED_TASKS]

  return {
    getAllTasks: () => [...tasks],

    /** Replace in-memory tasks with loaded data (sync after login/fetch) */
    loadTasks(newTasks: Task[]) {
      tasks = Array.isArray(newTasks) ? [...newTasks] : []
      return [...tasks]
    },

    getTaskById: (id) => tasks.find((t) => t.id === id),

    addTask(task: Task) {
      tasks = [...tasks, task]
      return task
    },

    updateTask(id, updates) {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx === -1) return undefined
      tasks[idx] = { ...tasks[idx], ...updates }
      return tasks[idx]
    },

    deleteTask(id) {
      const len = tasks.length
      tasks = tasks.filter((t) => t.id !== id)
      return tasks.length < len
    },

    getTasksByStatus: (status: TaskStatus) => tasks.filter((t) => t.status === status),

    getTasksByCategory: (categoryId) => tasks.filter((t) => t.skillCategoryId === categoryId),

    getTasksByDate(date: string) {
      return tasks.filter((t) => t.dueDate === date)
    },

    completeTask(id) {
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx === -1) return undefined
      tasks[idx] = {
        ...tasks[idx],
        status: "completed",
        completedAt: new Date().toISOString(),
        streak: tasks[idx].streak + 1,
      }
      return tasks[idx]
    },

    // Reset tasks to an empty list (simulate first-time use)
    resetTasks() {
      tasks = []
      return [...tasks]
    },
  }
}
