/**
 * ============================================
 * USER ENTITY - Domain Layer
 * ============================================
 * Represents the user profile with their avatar,
 * nickname, and aggregate statistics.
 * ============================================
 */

import { generateUUID } from "@/src/tasks/domain/task.entity"

/** User profile information */
export interface UserProfile {
  readonly id: string
  readonly nickname: string
  readonly avatarUrl: string | null
  readonly level: number
  readonly totalXp: number
  readonly joinedAt: string
  readonly currentStreak: number
  readonly longestStreak: number
}

/** Settings preferences */
export interface UserSettings {
  readonly theme: "cyberpunk" | "neon-blue" | "neon-magenta"
  readonly notificationsEnabled: boolean
  readonly dailyReminderTime: string // HH:mm
  readonly strictValidation: boolean
  readonly language: "es" | "en"
}

/** Default user profile for initial state */
export function createDefaultUser(): UserProfile {
  return {
    id: generateUUID(),
    nickname: "CyberRunner",
    avatarUrl: null,
    level: 1,
    totalXp: 0,
    joinedAt: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 0,
  }
}

/** Default settings */
export function createDefaultSettings(): UserSettings {
  return {
    theme: "cyberpunk",
    notificationsEnabled: true,
    dailyReminderTime: "08:00",
    strictValidation: true,
    language: "es",
  }
}
