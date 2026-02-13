/**
 * ============================================
 * SKILLS MEMORY ADAPTER - Infrastructure Layer
 * ============================================
 * In-memory implementation of the SkillsPort.
 * Provides seed data for the 6 radar categories
 * with their respective sub-skills.
 *
 * This adapter can be swapped for a database
 * adapter without changing the application layer.
 * ============================================
 */

import type { SkillsPort } from "@/src/skills/application/skills.port"
import {
  type SkillCategory,
  type SkillRadarData,
  type SubSkill,
  computeCategoryLevel,
  computeOverallLevel,
} from "@/src/skills/domain/skill.entity"

/** Seed data with the 6 main skill categories */
const SEED_CATEGORIES: SkillCategory[] = [
  {
    id: "intellect",
    name: "Intelecto & Ciencia",
    icon: "Brain",
    color: "hsl(185, 100%, 50%)",
    level: 0,
    subSkills: [
      { id: "physics", name: "Fisica", level: 15, xpRequired: 1000, xpCurrent: 150 },
      { id: "math", name: "Matematicas", level: 22, xpRequired: 1000, xpCurrent: 220 },
      { id: "programming", name: "Programacion", level: 45, xpRequired: 1000, xpCurrent: 450 },
      { id: "networking", name: "Redes", level: 12, xpRequired: 1000, xpCurrent: 120 },
      { id: "ai", name: "IA & ML", level: 30, xpRequired: 1000, xpCurrent: 300 },
    ],
  },
  {
    id: "wellness",
    name: "Bienestar & Salud",
    icon: "Heart",
    color: "hsl(300, 100%, 50%)",
    level: 0,
    subSkills: [
      { id: "health", name: "Salud General", level: 35, xpRequired: 1000, xpCurrent: 350 },
      { id: "exercise", name: "Ejercicio", level: 40, xpRequired: 1000, xpCurrent: 400 },
      { id: "nutrition", name: "Nutricion", level: 28, xpRequired: 1000, xpCurrent: 280 },
      { id: "meditation", name: "Meditacion", level: 18, xpRequired: 1000, xpCurrent: 180 },
      { id: "sleep", name: "Sueño", level: 50, xpRequired: 1000, xpCurrent: 500 },
    ],
  },
  {
    id: "humanities",
    name: "Humanidades & Sociedad",
    icon: "BookOpen",
    color: "hsl(82, 100%, 55%)",
    level: 0,
    subSkills: [
      { id: "sociology", name: "Sociologia", level: 10, xpRequired: 1000, xpCurrent: 100 },
      { id: "history", name: "Historia", level: 20, xpRequired: 1000, xpCurrent: 200 },
      { id: "philosophy", name: "Filosofia", level: 25, xpRequired: 1000, xpCurrent: 250 },
      { id: "languages", name: "Bilingue", level: 35, xpRequired: 1000, xpCurrent: 350 },
      { id: "communication", name: "Comunicacion", level: 30, xpRequired: 1000, xpCurrent: 300 },
    ],
  },
  {
    id: "creativity",
    name: "Creatividad & Arte",
    icon: "Palette",
    color: "hsl(35, 100%, 55%)",
    level: 0,
    subSkills: [
      { id: "visual-art", name: "Arte Visual", level: 18, xpRequired: 1000, xpCurrent: 180 },
      { id: "music", name: "Musica", level: 22, xpRequired: 1000, xpCurrent: 220 },
      { id: "design", name: "Diseño", level: 38, xpRequired: 1000, xpCurrent: 380 },
      { id: "writing", name: "Escritura", level: 28, xpRequired: 1000, xpCurrent: 280 },
    ],
  },
  {
    id: "personal",
    name: "Desarrollo Personal",
    icon: "Target",
    color: "hsl(55, 100%, 55%)",
    level: 0,
    subSkills: [
      { id: "responsibility", name: "Responsabilidad", level: 42, xpRequired: 1000, xpCurrent: 420 },
      { id: "discipline", name: "Disciplina", level: 35, xpRequired: 1000, xpCurrent: 350 },
      { id: "productivity", name: "Productividad", level: 38, xpRequired: 1000, xpCurrent: 380 },
      { id: "leadership", name: "Liderazgo", level: 20, xpRequired: 1000, xpCurrent: 200 },
    ],
  },
  {
    id: "finance",
    name: "Finanzas & Exito",
    icon: "TrendingUp",
    color: "hsl(220, 100%, 60%)",
    level: 0,
    subSkills: [
      { id: "savings", name: "Ahorro", level: 30, xpRequired: 1000, xpCurrent: 300 },
      { id: "investments", name: "Inversiones", level: 15, xpRequired: 1000, xpCurrent: 150 },
      { id: "business", name: "Negocios", level: 20, xpRequired: 1000, xpCurrent: 200 },
      { id: "income", name: "Ingresos", level: 25, xpRequired: 1000, xpCurrent: 250 },
    ],
  },
]

/** Recalculate levels from sub-skills */
function recalculate(categories: SkillCategory[]): SkillCategory[] {
  return categories.map((cat) => ({
    ...cat,
    level: computeCategoryLevel(cat.subSkills),
  }))
}

export function createSkillsMemoryAdapter(): SkillsPort {
  let categories = recalculate([...SEED_CATEGORIES])

  return {
    getSkillRadar(): SkillRadarData {
      return {
        categories,
        overallLevel: computeOverallLevel(categories),
      }
    },

    updateSubSkillXp(categoryId: string, subSkillId: string, xpGained: number): SkillRadarData {
      categories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        const updatedSubs: SubSkill[] = cat.subSkills.map((s) => {
          if (s.id !== subSkillId) return s
          const newXp = Math.min(s.xpCurrent + xpGained, s.xpRequired)
          const newLevel = Math.round((newXp / s.xpRequired) * 100)
          return { ...s, xpCurrent: newXp, level: newLevel }
        })
        return { ...cat, subSkills: updatedSubs, level: computeCategoryLevel(updatedSubs) }
      })
      return { categories, overallLevel: computeOverallLevel(categories) }
    },

    getCategory(categoryId: string) {
      return categories.find((c) => c.id === categoryId)
    },
  }
}
