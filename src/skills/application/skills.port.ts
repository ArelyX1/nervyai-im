/**
 * ============================================
 * SKILLS PORT - Application Layer (Hexagonal)
 * ============================================
 * Defines the interface (port) for skill data
 * persistence. Supports dynamic categories and
 * recursive skill node CRUD operations.
 * ============================================
 */

import type { SkillCategory, SkillNode, SkillRadarData } from "@/src/skills/domain/skill.entity"

export interface SkillsPort {
  getSkillRadar(): SkillRadarData
  getCategory(categoryId: string): SkillCategory | undefined

  // Category CRUD
  addCategory(name: string, icon: string, color: string): SkillRadarData
  removeCategory(categoryId: string): SkillRadarData
  updateCategory(categoryId: string, updates: Partial<Pick<SkillCategory, "name" | "icon" | "color">>): SkillRadarData

  // Recursive skill node CRUD
  addSkillNode(categoryId: string, parentNodeId: string | null, name: string): SkillRadarData
  removeSkillNode(categoryId: string, nodeId: string): SkillRadarData
  updateNodeXp(categoryId: string, nodeId: string, xpGained: number): SkillRadarData
  // Distribute XP from a transition node into its sibling children
  distributeTransitionXp(categoryId: string, parentNodeId: string, allocations: { nodeId: string; xp: number }[]): SkillRadarData
  // Distribute all XP from transition child equally among sibling children
  distributeTransitionEqually(categoryId: string, parentNodeId: string | null): SkillRadarData
  // Reset all progress (set xpCurrent and levels to 0 across all categories)
  resetProgress(): SkillRadarData
}
