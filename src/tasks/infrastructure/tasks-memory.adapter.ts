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

/** Seed tasks for demonstration */
const SEED_TASKS: Task[] = [
  createTask({
    title: "Estudiar calculo diferencial",
    description: "Resolver 20 ejercicios del capitulo 5",
    skillCategoryId: "intellect",
    subSkillId: "math",
    frequency: "daily",
    priority: "high",
    xpReward: 25,
    dueDate: new Date().toISOString().split("T")[0],
    tags: ["estudio", "matematicas"],
    streak: 5,
  }),
  createTask({
    title: "Entrenamiento de fuerza",
    description: "Rutina de pecho y espalda en el gym",
    skillCategoryId: "wellness",
    subSkillId: "exercise",
    frequency: "every-other-day",
    priority: "high",
    xpReward: 30,
    validationRule: "minimum-time",
    minimumMinutes: 45,
    dueDate: new Date().toISOString().split("T")[0],
    tags: ["gym", "fuerza"],
    streak: 12,
  }),
  createTask({
    title: "Leer 30 paginas de Filosofia",
    description: "Continuar con 'Meditaciones' de Marco Aurelio",
    skillCategoryId: "humanities",
    subSkillId: "philosophy",
    frequency: "daily",
    priority: "medium",
    xpReward: 15,
    dueDate: new Date().toISOString().split("T")[0],
    tags: ["lectura", "filosofia"],
    streak: 8,
  }),
  createTask({
    title: "Practicar guitarra",
    description: "Escala pentatonica y 2 canciones nuevas",
    skillCategoryId: "creativity",
    subSkillId: "music",
    frequency: "daily",
    priority: "medium",
    xpReward: 20,
    validationRule: "minimum-time",
    minimumMinutes: 30,
    tags: ["musica", "practica"],
    streak: 3,
  }),
  createTask({
    title: "Revisar portafolio de inversiones",
    description: "Analizar rendimiento mensual y rebalancear",
    skillCategoryId: "finance",
    subSkillId: "investments",
    frequency: "monthly",
    priority: "high",
    xpReward: 40,
    tags: ["finanzas", "inversiones"],
    streak: 2,
  }),
  createTask({
    title: "Codificar proyecto personal",
    description: "Avanzar con el modulo de autenticacion",
    skillCategoryId: "intellect",
    subSkillId: "programming",
    frequency: "daily",
    priority: "critical",
    xpReward: 35,
    dueDate: new Date().toISOString().split("T")[0],
    tags: ["programacion", "proyecto"],
    streak: 15,
    status: "in-progress",
  }),
  createTask({
    title: "Meditar 15 minutos",
    description: "Sesion guiada de mindfulness",
    skillCategoryId: "wellness",
    subSkillId: "meditation",
    frequency: "daily",
    priority: "medium",
    xpReward: 10,
    validationRule: "minimum-time",
    minimumMinutes: 15,
    tags: ["meditacion", "bienestar"],
    streak: 20,
    status: "completed",
    completedAt: new Date().toISOString(),
  }),
  createTask({
    title: "Escribir entrada de diario",
    description: "Reflexion diaria sobre logros y aprendizajes",
    skillCategoryId: "personal",
    subSkillId: "discipline",
    frequency: "daily",
    priority: "low",
    xpReward: 10,
    tags: ["escritura", "reflexion"],
    streak: 30,
    status: "completed",
    completedAt: new Date().toISOString(),
  }),
]

export function createTasksMemoryAdapter(): TasksPort {
  let tasks: Task[] = [...SEED_TASKS]

  return {
    getAllTasks: () => [...tasks],

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
  }
}
