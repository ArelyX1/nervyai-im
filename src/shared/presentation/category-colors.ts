/**
 * ============================================
 * CATEGORY COLORS - Shared Presentation Config
 * ============================================
 * Maps each skill category to its neon color
 * for consistent theming across the app.
 * ============================================
 */

import type { SkillCategoryId } from "@/src/skills/domain/skill.entity"

export interface CategoryColorConfig {
  bg: string
  text: string
  glow: "cyan" | "magenta" | "lime" | "orange"
  hex: string
  bgFaded: string
  border: string
}

export const CATEGORY_COLORS: Record<SkillCategoryId, CategoryColorConfig> = {
  intellect: {
    bg: "bg-neon-cyan/15",
    text: "text-neon-cyan",
    glow: "cyan",
    hex: "#00FFFF",
    bgFaded: "bg-neon-cyan/5",
    border: "border-neon-cyan/30",
  },
  wellness: {
    bg: "bg-neon-magenta/15",
    text: "text-neon-magenta",
    glow: "magenta",
    hex: "#FF00FF",
    bgFaded: "bg-neon-magenta/5",
    border: "border-neon-magenta/30",
  },
  humanities: {
    bg: "bg-neon-lime/15",
    text: "text-neon-lime",
    glow: "lime",
    hex: "#AAFF00",
    bgFaded: "bg-neon-lime/5",
    border: "border-neon-lime/30",
  },
  creativity: {
    bg: "bg-neon-orange/15",
    text: "text-neon-orange",
    glow: "orange",
    hex: "#FF8C00",
    bgFaded: "bg-neon-orange/5",
    border: "border-neon-orange/30",
  },
  personal: {
    bg: "bg-neon-yellow/15",
    text: "text-neon-yellow",
    glow: "cyan",
    hex: "#FFFF00",
    bgFaded: "bg-neon-yellow/5",
    border: "border-neon-yellow/30",
  },
  finance: {
    bg: "bg-neon-blue/15",
    text: "text-neon-blue",
    glow: "cyan",
    hex: "#3B82F6",
    bgFaded: "bg-neon-blue/5",
    border: "border-neon-blue/30",
  },
}
