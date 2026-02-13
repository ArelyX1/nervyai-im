/**
 * ============================================
 * DASHBOARD SCREEN - Presentation Layer
 * ============================================
 * The main home screen showing:
 * - User profile card with neon avatar frame
 * - Mini radar chart (progress overview)
 * - Quick stat cards
 * - Quick action buttons
 * - Recent activity feed
 * ============================================
 */

"use client"

import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { CATEGORY_COLORS } from "@/src/shared/presentation/category-colors"
import { MiniRadarChart } from "./mini-radar-chart"
import { User, Flame, Zap, Trophy, Grid3X3, CalendarDays, ListChecks, Radar } from "lucide-react"
import type { NavTab } from "@/src/shared/presentation/components/bottom-nav"

interface DashboardScreenProps {
  onNavigate: (tab: NavTab) => void
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { user, skills, tasks, goals } = useApp()

  const completedToday = tasks.filter((t) => t.status === "completed").length
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in-progress").length
  const totalGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.currentCount / g.targetCount) * 100, 0) / goals.length)
    : 0

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full neon-border bg-surface-2 glow-cyan">
            <User className="h-8 w-8 text-neon-cyan" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-neon-cyan text-[10px] font-mono font-bold text-background">
            {user.level}
          </span>
        </div>
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
            {user.nickname}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {user.totalXp.toLocaleString()} XP Total
          </p>
        </div>
      </header>

      {/* Radar Preview */}
      <NeonCard glowColor="cyan" className="overflow-hidden">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold text-neon-cyan">Radar de Habilidades</h2>
          <button
            onClick={() => onNavigate("radar")}
            className="font-mono text-[10px] text-muted-foreground hover:text-neon-cyan transition-colors"
          >
            Ver detalle
          </button>
        </div>
        <div className="flex justify-center">
          <MiniRadarChart categories={skills.categories} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {skills.categories.map((cat) => {
            const colors = CATEGORY_COLORS[cat.id]
            return (
              <div key={cat.id} className={`flex items-center gap-1.5 rounded-md ${colors.bgFaded} px-2 py-1`}>
                <span className={`h-2 w-2 rounded-full`} style={{ backgroundColor: colors.hex }} />
                <span className="font-mono text-[9px] text-muted-foreground truncate">{cat.name.split(" ")[0]}</span>
                <span className={`ml-auto font-mono text-[10px] font-bold ${colors.text}`}>{cat.level}</span>
              </div>
            )
          })}
        </div>
      </NeonCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <NeonCard glowColor="magenta" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-magenta/15">
            <Flame className="h-5 w-5 text-neon-magenta" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-magenta">{user.currentStreak}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Racha Actual</p>
          </div>
        </NeonCard>

        <NeonCard glowColor="lime" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-lime/15">
            <Zap className="h-5 w-5 text-neon-lime" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-lime">{completedToday}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Completadas</p>
          </div>
        </NeonCard>

        <NeonCard glowColor="orange" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-orange/15">
            <ListChecks className="h-5 w-5 text-neon-orange" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-orange">{pendingTasks}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Pendientes</p>
          </div>
        </NeonCard>

        <NeonCard glowColor="cyan" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/15">
            <Trophy className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-cyan">{totalGoalProgress}%</p>
            <p className="font-mono text-[10px] text-muted-foreground">Objetivos</p>
          </div>
        </NeonCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">Accesos Rapidos</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "goals" as NavTab, label: "Grid", icon: Grid3X3, color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
            { id: "calendar" as NavTab, label: "Agenda", icon: CalendarDays, color: "text-neon-magenta", bg: "bg-neon-magenta/10" },
            { id: "tasks" as NavTab, label: "Tareas", icon: ListChecks, color: "text-neon-lime", bg: "bg-neon-lime/10" },
            { id: "radar" as NavTab, label: "Radar", icon: Radar, color: "text-neon-orange", bg: "bg-neon-orange/10" },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface-1 p-3 transition-all hover:scale-105 active:scale-95"
            >
              <div className={`rounded-md ${action.bg} p-2`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">Actividad Reciente</h2>
        <div className="flex flex-col gap-2">
          {tasks.slice(0, 5).map((task) => {
            const colors = CATEGORY_COLORS[task.skillCategoryId]
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-lg border ${colors.border} ${colors.bgFaded} px-3 py-2`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: colors.hex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-foreground truncate">{task.title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    +{task.xpReward} XP | Racha: {task.streak}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold ${
                  task.status === "completed"
                    ? "bg-neon-lime/20 text-neon-lime"
                    : task.status === "in-progress"
                      ? "bg-neon-cyan/20 text-neon-cyan"
                      : "bg-neon-orange/20 text-neon-orange"
                }`}>
                  {task.status === "completed" ? "OK" : task.status === "in-progress" ? "EN PROG" : "PEND"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
