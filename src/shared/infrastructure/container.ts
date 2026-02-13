/**
 * ============================================
 * DEPENDENCY INJECTION CONTAINER
 * ============================================
 * Hexagonal Architecture: This is the composition
 * root where ports are wired to their adapters.
 *
 * To swap implementations (e.g., from memory to
 * a real database), only change this file.
 * ============================================
 */

import { createSkillsMemoryAdapter } from "@/src/skills/infrastructure/skills-memory.adapter"
import { createTasksMemoryAdapter } from "@/src/tasks/infrastructure/tasks-memory.adapter"
import { createGoalsMemoryAdapter } from "@/src/goals/infrastructure/goals-memory.adapter"

/** Singleton adapters - created once, reused everywhere */
export const skillsAdapter = createSkillsMemoryAdapter()
export const tasksAdapter = createTasksMemoryAdapter()
export const goalsAdapter = createGoalsMemoryAdapter()
