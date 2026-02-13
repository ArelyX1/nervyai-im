/**
 * ============================================
 * SKILLS PORT - Application Layer (Hexagonal)
 * ============================================
 * Defines the interface (port) that any
 * infrastructure adapter must implement to
 * provide skill data persistence.
 * ============================================
 */

import type { SkillCategory, SkillRadarData } from "@/src/skills/domain/skill.entity"

export interface SkillsPort {
  getSkillRadar(): SkillRadarData
  updateSubSkillXp(categoryId: string, subSkillId: string, xpGained: number): SkillRadarData
  getCategory(categoryId: string): SkillCategory | undefined
}
