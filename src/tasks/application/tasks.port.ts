/**
 * ============================================
 * TASKS PORT - Application Layer (Hexagonal)
 * ============================================
 * Defines the interface (port) that any
 * infrastructure adapter must implement for
 * task data persistence.
 * ============================================
 */

import type { Task, TaskStatus } from "@/src/tasks/domain/task.entity"

export interface TasksPort {
  getAllTasks(): Task[]
  getTaskById(id: string): Task | undefined
  addTask(task: Task): Task
  updateTask(id: string, updates: Partial<Task>): Task | undefined
  deleteTask(id: string): boolean
  getTasksByStatus(status: TaskStatus): Task[]
  getTasksByCategory(categoryId: string): Task[]
  getTasksByDate(date: string): Task[]
  completeTask(id: string): Task | undefined
}
