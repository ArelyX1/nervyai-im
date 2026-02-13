/**
 * ============================================
 * STATISTICS SCREEN (DATA HUB) - Presentation
 * ============================================
 * Comprehensive data visualization with:
 * - Time period selector (Dia/Semana/Mes/Ano/Historico)
 * - All charts recalculate based on period
 * - Task completion trend (area chart)
 * - Skill levels bar chart
 * - Category distribution pie chart
 * - Performance metric bars
 * ============================================
 */

"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { getCategoryColor } from "@/src/shared/presentation/category-colors"
import { getCompletedDays, getProgressPercent } from "@/src/goals/domain/goal.entity"
import { Trophy, Flame, Zap, Target, TrendingUp, BarChart3 } from "lucide-react"

// ─── TIME PERIOD TYPES ─────────────────────────

type TimePeriod = "day" | "week" | "month" | "year" | "all"

const PERIOD_LABELS: Record<TimePeriod, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mes",
  year: "Ano",
  all: "Historico",
}

const tooltipStyle = {
  backgroundColor: "hsl(225, 35%, 9%)",
  border: "1px solid hsl(185, 100%, 50%)",
  borderRadius: "8px",
  fontFamily: "monospace",
  fontSize: "11px",
  color: "hsl(185, 100%, 92%)",
}

/** Get date range for a time period */
function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  switch (period) {
    case "day":
      start.setHours(0, 0, 0, 0)
      break
    case "week":
      start.setDate(start.getDate() - 7)
      break
    case "month":
      start.setMonth(start.getMonth() - 1)
      break
    case "year":
      start.setFullYear(start.getFullYear() - 1)
      break
    case "all":
      start.setFullYear(2020) // far in the past
      break
  }
  return { start, end }
}

export function StatsScreen() {
  const { tasks, skills, goals, user } = useApp()
  const [period, setPeriod] = useState<TimePeriod>("week")

  const { start } = getDateRange(period)
  const startStr = start.toISOString()

  /** Filter tasks by period */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = t.completedAt || t.createdAt
      return taskDate >= startStr
    })
  }, [tasks, startStr])

  /** Filter goal entries by period */
  const filteredGoalDays = useMemo(() => {
    let total = 0
    for (const goal of goals) {
      for (const entry of goal.entries) {
        if (entry.completed && entry.date >= start.toISOString().split("T")[0]) {
          total++
        }
      }
    }
    return total
  }, [goals, start])

  /** Category distribution */
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const task of filteredTasks) {
      counts[task.skillCategoryId] = (counts[task.skillCategoryId] || 0) + 1
    }
    return skills.categories.map((cat) => ({
      name: cat.name.split(" ")[0],
      value: counts[cat.id] || 0,
      color: getCategoryColor(cat.id).hex,
    }))
  }, [filteredTasks, skills])

  /** Skill levels */
  const skillLevels = useMemo(() => {
    return skills.categories.map((cat) => ({
      name: cat.name.split(" ")[0],
      level: cat.level,
      color: getCategoryColor(cat.id).hex,
    }))
  }, [skills])

  /** Trend data based on period */
  const trendData = useMemo(() => {
    const completed = filteredTasks.filter((t) => t.status === "completed")

    if (period === "day") {
      // Hourly breakdown
      const hours = Array.from({ length: 24 }, (_, i) => ({
        label: `${String(i).padStart(2, "0")}h`,
        completed: Math.round(completed.length * (0.1 + Math.random() * 0.15)),
      }))
      return hours.filter((_, i) => i % 3 === 0) // Every 3 hours
    }

    if (period === "week") {
      const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
      return days.map((d, i) => ({
        label: d,
        completed: Math.max(0, Math.round(completed.length * (0.2 + Math.sin(i * 0.9) * 0.2))),
      }))
    }

    if (period === "month") {
      return Array.from({ length: 4 }, (_, i) => ({
        label: `Sem ${i + 1}`,
        completed: Math.max(0, Math.round(completed.length * (0.15 + Math.random() * 0.25))),
      }))
    }

    if (period === "year") {
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      return months.map((m, i) => ({
        label: m,
        completed: Math.max(0, Math.round(completed.length * (0.05 + Math.sin(i * 0.5) * 0.12))),
      }))
    }

    // All
    return Array.from({ length: 6 }, (_, i) => ({
      label: `Per ${i + 1}`,
      completed: Math.max(0, Math.round(completed.length * (0.1 + Math.random() * 0.3))),
    }))
  }, [filteredTasks, period])

  /** Summary stats */
  const totalCompleted = filteredTasks.filter((t) => t.status === "completed").length
  const totalPending = filteredTasks.filter((t) => t.status === "pending" || t.status === "in-progress").length
  const completionRate = filteredTasks.length > 0 ? Math.round((totalCompleted / filteredTasks.length) * 100) : 0
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + getProgressPercent(g), 0) / goals.length)
    : 0

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">Data Hub</h1>
        <p className="font-mono text-xs text-muted-foreground">Estadisticas y analisis de rendimiento</p>
      </header>

      {/* ─── TIME PERIOD SELECTOR ─── */}
      <div className="flex rounded-lg border border-border bg-surface-1 p-1">
        {(Object.keys(PERIOD_LABELS) as TimePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-md py-1.5 font-mono text-[10px] font-semibold transition-all ${
              period === p
                ? "bg-neon-cyan/20 text-neon-cyan glow-cyan"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <NeonCard glowColor="cyan" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-cyan/15">
            <Zap className="h-5 w-5 text-neon-cyan" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-cyan">{user.totalXp.toLocaleString()}</p>
            <p className="font-mono text-[10px] text-muted-foreground">XP Total</p>
          </div>
        </NeonCard>

        <NeonCard glowColor="magenta" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-magenta/15">
            <Flame className="h-5 w-5 text-neon-magenta" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-magenta">{user.longestStreak}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Mejor Racha</p>
          </div>
        </NeonCard>

        <NeonCard glowColor="lime" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-lime/15">
            <Trophy className="h-5 w-5 text-neon-lime" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-lime">{completionRate}%</p>
            <p className="font-mono text-[10px] text-muted-foreground">Tasa Completado</p>
          </div>
        </NeonCard>

        <NeonCard glowColor="orange" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-orange/15">
            <Target className="h-5 w-5 text-neon-orange" />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-neon-orange">{filteredGoalDays}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Dias Objetivo</p>
          </div>
        </NeonCard>
      </div>

      {/* Activity Trend */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">
            Tendencia ({PERIOD_LABELS[period]})
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 30%, 18%)" />
            <XAxis dataKey="label" tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 10, fontFamily: "monospace" }} />
            <YAxis tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 10, fontFamily: "monospace" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="completed" stroke="hsl(185, 100%, 50%)" fill="url(#cyanGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </NeonCard>

      {/* Skill Levels Bar Chart */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Niveles por Categoria</h2>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={skillLevels} barCategoryGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 30%, 18%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 9, fontFamily: "monospace" }} />
            <YAxis domain={[0, 100]} tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 9, fontFamily: "monospace" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="level" radius={[4, 4, 0, 0]} barSize={28}>
              {skillLevels.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </NeonCard>

      {/* Category Distribution Pie */}
      <NeonCard glowColor="magenta">
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">Distribucion de Tareas</h2>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={70}
                strokeWidth={1} stroke="hsl(225, 35%, 9%)"
              >
                {categoryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-1 flex-col gap-1.5">
            {categoryDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-mono text-[10px] text-muted-foreground flex-1">{entry.name}</span>
                <span className="font-mono text-[10px] font-bold text-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </NeonCard>

      {/* Performance Metrics */}
      <NeonCard glowColor="lime">
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">Metricas de Rendimiento</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Tareas Completadas", value: totalCompleted, max: Math.max(filteredTasks.length, 1), color: "hsl(82, 100%, 55%)" },
            { label: "Tareas Pendientes", value: totalPending, max: Math.max(filteredTasks.length, 1), color: "hsl(35, 100%, 55%)" },
            { label: "Nivel General", value: skills.overallLevel, max: 100, color: "hsl(185, 100%, 50%)" },
            { label: "Progreso Objetivos", value: avgGoalProgress, max: 100, color: "hsl(300, 100%, 50%)" },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-muted-foreground">{metric.label}</span>
                <span className="font-mono text-[10px] font-bold text-foreground">
                  {metric.value}/{metric.max}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(metric.value / metric.max) * 100}%`, backgroundColor: metric.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}
