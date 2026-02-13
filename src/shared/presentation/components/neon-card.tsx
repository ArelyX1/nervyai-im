/**
 * ============================================
 * NEON CARD - Shared UI Component
 * ============================================
 * Reusable card with cyberpunk neon glow border.
 * Supports different glow color variants.
 * ============================================
 */

"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface NeonCardProps {
  children: ReactNode
  className?: string
  glowColor?: "cyan" | "magenta" | "lime" | "orange"
  interactive?: boolean
  onClick?: () => void
}

const glowMap = {
  cyan: "glow-cyan neon-border",
  magenta: "glow-magenta neon-border-magenta",
  lime: "glow-lime border-neon-lime/25",
  orange: "glow-orange border-neon-orange/25",
} as const

export function NeonCard({
  children,
  className,
  glowColor = "cyan",
  interactive = false,
  onClick,
}: NeonCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick() } : undefined}
      className={cn(
        "rounded-lg bg-card p-4",
        glowMap[glowColor],
        interactive && "cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  )
}
