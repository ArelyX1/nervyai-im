/**
 * ============================================
 * BOTTOM NAVIGATION - Shared UI Component
 * ============================================
 * Futuristic control-panel style bottom nav.
 * Provides navigation between the main screens:
 * Dashboard, Goals, Radar, Tasks, Calendar, Stats, Settings.
 * ============================================
 */

"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Grid3X3,
  Radar,
  ListChecks,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react"

export type NavTab =
  | "dashboard"
  | "goals"
  | "radar"
  | "tasks"
  | "calendar"
  | "stats"
  | "settings"

interface BottomNavProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "goals", label: "Grid", icon: Grid3X3 },
  { id: "radar", label: "Radar", icon: Radar },
  { id: "tasks", label: "Tareas", icon: ListChecks },
  { id: "calendar", label: "Agenda", icon: CalendarDays },
  { id: "stats", label: "Data", icon: BarChart3 },
  { id: "settings", label: "Config", icon: Settings },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Navegacion principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neon-cyan/10 bg-background/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-mono transition-all duration-200",
                isActive
                  ? "text-neon-cyan text-glow-cyan"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative rounded-md p-1.5 transition-all",
                isActive && "bg-neon-cyan/10"
              )}>
                <Icon className="h-4 w-4" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-neon-cyan" />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
