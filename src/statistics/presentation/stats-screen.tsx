/**
 * ============================================
 * STATISTICS SCREEN (DATA HUB) - Presentation
 * ============================================
 * Comprehensive data visualization screen with:
 * - Task completion line chart (weekly trend)
 * - Skill distribution pie chart
 * - Category bar chart comparison
 * - Performance summary cards
 * - Streak and XP statistics
 * ============================================
 */

"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { CATEGORY_COLORS } from "@/src/shared/presentation/category-colors"
import type { SkillCategoryId } from "@/src/skills/domain/skill.entity"
import { Trophy, Flame, Zap, Target, TrendingUp, BarChart3 } from "lucide-react"

const tooltipStyle = {
  backgroundColor: "hsl(225, 35%, 9%)",
  border: "1px solid hsl(185, 100%, 50%)",
  borderRadius: "8px",
  fontFamily: "monospace",
  fontSize: "11px",
  color: "hsl(185, 100%, 92%)",
}

export function StatsScreen() {
  const { tasks, skills, goals, user } = useApp()

  /** Category distribution (tasks per category) */
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const task of tasks) {
      counts[task.skillCategoryId] = (counts[task.skillCategoryId] || 0) + 1
    }
    return skills.categories.map((cat) => ({
      name: cat.name.split(" ")[0],
      value: counts[cat.id] || 0,
      color: CATEGORY_COLORS[cat.id].hex,
    }))
  }, [tasks, skills])

  /** Skill levels for bar chart */
  const skillLevels = useMemo(() => {
    return skills.categories.map((cat) => ({
      name: cat.name.split(" ")[0],
      level: cat.level,
      color: CATEGORY_COLORS[cat.id].hex,
    }))
  }, [skills])

  /** Weekly trend (simulated from completed tasks) */
  const weeklyTrend = useMemo(() => {
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
    const completedCount = tasks.filter((t) => t.status === "completed").length
    return days.map((d, i) => ({
      day: d,
      completed: Math.max(0, Math.round(completedCount * (0.3 + Math.sin(i * 0.8) * 0.3))),
      xp: Math.round((completedCount * 15) * (0.4 + Math.cos(i * 0.6) * 0.25)),
    }))
  }, [tasks])

  /** Summary stats */
  const totalCompleted = tasks.filter((t) => t.status === "completed").length
  const totalPending = tasks.filter((t) => t.status === "pending" || t.status === "in-progress").length
  const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.currentCount / g.targetCount) * 100, 0) / goals.length)
    : 0

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
          Data Hub
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Estadisticas y analisis de rendimiento
        </p>
      </header>

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
            <p className="font-mono text-lg font-bold text-neon-orange">{avgGoalProgress}%</p>
            <p className="font-mono text-[10px] text-muted-foreground">Avg Objetivos</p>
          </div>
        </NeonCard>
      </div>

      {/* Weekly Activity Trend */}
      <NeonCard glowColor="cyan">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-neon-cyan" />
          <h2 className="font-mono text-sm font-semibold text-foreground">Tendencia Semanal</h2>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={weeklyTrend}>
            <defs>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 30%, 18%)" />
            <XAxis dataKey="day" tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 10, fontFamily: "monospace" }} />
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
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">
          Distribucion de Tareas
        </h2>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                strokeWidth={1}
                stroke="hsl(225, 35%, 9%)"
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
        <h2 className="mb-3 font-mono text-sm font-semibold text-foreground">
          Metricas de Rendimiento
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "Tareas Completadas", value: totalCompleted, max: tasks.length, color: "hsl(82, 100%, 55%)" },
            { label: "Tareas Pendientes", value: totalPending, max: tasks.length, color: "hsl(35, 100%, 55%)" },
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
                  style={{
                    width: `${metric.max > 0 ? (metric.value / metric.max) * 100 : 0}%`,
                    backgroundColor: metric.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  )
}
