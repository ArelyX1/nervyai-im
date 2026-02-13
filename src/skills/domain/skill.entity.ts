/**
 * ============================================
 * SKILL ENTITY - Domain Layer
 * ============================================
 * Represents a skill category and its sub-skills
 * in the NervyAI personal development radar.
 *
 * Each skill belongs to a category and has a
 * numeric level (0-100) representing mastery.
 * ============================================
 */

/** Skill category identifiers matching the radar axes */
export type SkillCategoryId =
  | "intellect"
  | "wellness"
  | "humanities"
  | "creativity"
  | "personal"
  | "finance"

/** Individual sub-skill within a category */
export interface SubSkill {
  readonly id: string
  readonly name: string
  readonly level: number // 0-100
  readonly xpRequired: number
  readonly xpCurrent: number
}

/** Top-level skill category for the radar chart */
export interface SkillCategory {
  readonly id: SkillCategoryId
  readonly name: string
  readonly icon: string
  readonly color: string
  readonly level: number // 0-100 aggregated from sub-skills
  readonly subSkills: SubSkill[]
}

/** Full snapshot of the user's skill state */
export interface SkillRadarData {
  readonly categories: SkillCategory[]
  readonly overallLevel: number
}

/** Calculate the aggregate level for a category based on sub-skills */
export function computeCategoryLevel(subSkills: SubSkill[]): number {
  if (subSkills.length === 0) return 0
  const total = subSkills.reduce((sum, s) => sum + s.level, 0)
  return Math.round(total / subSkills.length)
}

/** Calculate overall level across all categories */
export function computeOverallLevel(categories: SkillCategory[]): number {
  if (categories.length === 0) return 0
  const total = categories.reduce((sum, c) => sum + c.level, 0)
  return Math.round(total / categories.length)
}
