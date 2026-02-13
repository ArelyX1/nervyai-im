/**
 * ============================================
 * CATEGORY COLORS - Dynamic Color System
 * ============================================
 * Provides neon color configs for skill categories.
 * Supports both default (known) categories and
 * dynamically-created ones with cyclic fallback.
 * ============================================
 */

export interface CategoryColorConfig {
  bg: string
  text: string
  glow: "cyan" | "magenta" | "lime" | "orange"
  hex: string
  bgFaded: string
  border: string
}

/** Known category color presets */
const KNOWN_COLORS: Record<string, CategoryColorConfig> = {
  intellect: {
    bg: "bg-neon-cyan/15", text: "text-neon-cyan", glow: "cyan",
    hex: "#00FFFF", bgFaded: "bg-neon-cyan/5", border: "border-neon-cyan/30",
  },
  wellness: {
    bg: "bg-neon-magenta/15", text: "text-neon-magenta", glow: "magenta",
    hex: "#FF00FF", bgFaded: "bg-neon-magenta/5", border: "border-neon-magenta/30",
  },
  humanities: {
    bg: "bg-neon-lime/15", text: "text-neon-lime", glow: "lime",
    hex: "#AAFF00", bgFaded: "bg-neon-lime/5", border: "border-neon-lime/30",
  },
  creativity: {
    bg: "bg-neon-orange/15", text: "text-neon-orange", glow: "orange",
    hex: "#FF8C00", bgFaded: "bg-neon-orange/5", border: "border-neon-orange/30",
  },
  personal: {
    bg: "bg-neon-yellow/15", text: "text-neon-yellow", glow: "cyan",
    hex: "#FFFF00", bgFaded: "bg-neon-yellow/5", border: "border-neon-yellow/30",
  },
  finance: {
    bg: "bg-neon-blue/15", text: "text-neon-blue", glow: "cyan",
    hex: "#3B82F6", bgFaded: "bg-neon-blue/5", border: "border-neon-blue/30",
  },
}

/** Cyclic fallback palette for dynamically-created categories */
const NEON_CYCLE: CategoryColorConfig[] = [
  KNOWN_COLORS.intellect,
  KNOWN_COLORS.wellness,
  KNOWN_COLORS.humanities,
  KNOWN_COLORS.creativity,
  KNOWN_COLORS.personal,
  KNOWN_COLORS.finance,
]

/**
 * Get color config for any category ID.
 * Returns a known preset if it exists, otherwise
 * cycles through the neon palette deterministically
 * based on a hash of the ID.
 */
export function getCategoryColor(categoryId: string): CategoryColorConfig {
  if (KNOWN_COLORS[categoryId]) return KNOWN_COLORS[categoryId]

  // Simple hash for deterministic cycling
  let hash = 0
  for (let i = 0; i < categoryId.length; i++) {
    hash = ((hash << 5) - hash + categoryId.charCodeAt(i)) | 0
  }
  return NEON_CYCLE[Math.abs(hash) % NEON_CYCLE.length]
}

/** Re-export for backward compat in existing components */
export const CATEGORY_COLORS = new Proxy({} as Record<string, CategoryColorConfig>, {
  get(_, key: string) {
    return getCategoryColor(key)
  },
})
