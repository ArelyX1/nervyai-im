/**
 * ============================================
 * GOALS SCREEN - Presentation Layer
 * ============================================
 * Displays goals as cards (NOT countable grids).
 * Each card shows:
 * - Title, daily action, progress bar
 * - Current streak counter
 * - 7-day heatmap (weekly dots)
 * - Info that daily logging is in Calendar
 *
 * Users can add/delete goals from here.
 * ============================================
 */

"use client"

import { useState } from "react"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { getCategoryColor } from "@/src/shared/presentation/category-colors"
import {
  getCompletedDays,
  getProgressPercent,
  getCurrentStreak,
  getWeekHeatmap,
} from "@/src/goals/domain/goal.entity"
import { Plus, Trash2, Flame, CalendarDays, Target } from "lucide-react"

export function GoalsGridScreen() {
  const { goals, addGoal, deleteGoal, skills } = useApp()
  const [showForm, setShowForm] = useState(false)

  const activeGoals = goals.filter((g) => g.status === "active")

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
            Objetivos
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {activeGoals.length} objetivos activos
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-neon-cyan/10 px-3 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/20"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </button>
      </header>

      {/* Tip: register from calendar */}
      <div className="flex items-center gap-2 rounded-lg border border-neon-cyan/15 bg-neon-cyan/5 px-3 py-2">
        <CalendarDays className="h-4 w-4 text-neon-cyan shrink-0" />
        <p className="font-mono text-[10px] text-muted-foreground">
          Registra tu progreso diario desde la seccion <span className="text-neon-cyan font-semibold">Calendario</span> usando el boton +
        </p>
      </div>

      {showForm && (
        <AddGoalForm
          categories={skills.categories.map((c) => ({ id: c.id, label: c.name }))}
          onSubmit={(data) => {
            addGoal(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        {activeGoals.map((goal) => {
          const colors = getCategoryColor(goal.categoryId)
          const progress = getProgressPercent(goal)
          const completed = getCompletedDays(goal)
          const streak = getCurrentStreak(goal)
          const heatmap = getWeekHeatmap(goal)
          const isComplete = progress >= 100

          return (
            <NeonCard key={goal.id} glowColor={colors.glow}>
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-mono text-sm font-bold ${colors.text}`}>
                    {goal.title}
                  </h3>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {goal.description}
                  </p>
                  {goal.dailyAction && (
                    <p className="mt-1 font-mono text-[10px] text-foreground/70">
                      Diario: {goal.dailyAction}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
                  aria-label={`Eliminar objetivo ${goal.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Stats row */}
              <div className="mb-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {completed}/{goal.targetDays} dias
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "text-neon-orange" : "text-muted-foreground"}`} />
                  <span className={`font-mono text-[10px] font-semibold ${streak > 0 ? "text-neon-orange" : "text-muted-foreground"}`}>
                    {streak} racha
                  </span>
                </div>
                <span className={`ml-auto font-mono text-xs font-bold ${isComplete ? "text-neon-lime" : colors.text}`}>
                  {progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: isComplete ? "#AAFF00" : colors.hex,
                  }}
                />
              </div>

              {/* Weekly heatmap (7 dots) */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-muted-foreground">Esta semana</span>
                <div className="flex gap-1.5">
                  {heatmap.map((day) => (
                    <div
                      key={day.date}
                      className={`h-3.5 w-3.5 rounded-full transition-all ${
                        day.completed
                          ? "animate-grid-fill"
                          : "bg-surface-3 border border-border/40"
                      }`}
                      style={day.completed ? { backgroundColor: colors.hex } : undefined}
                      title={day.date}
                    />
                  ))}
                </div>
              </div>
            </NeonCard>
          )
        })}
      </div>

      {activeGoals.length === 0 && (
        <NeonCard glowColor="cyan">
          <p className="py-8 text-center font-mono text-xs text-muted-foreground">
            No tienes objetivos activos. Crea uno para comenzar tu racha.
          </p>
        </NeonCard>
      )}
    </div>
  )
}

// ─── ADD GOAL FORM ─────────────────────────────

function AddGoalForm({
  categories,
  onSubmit,
  onCancel,
}: {
  categories: { id: string; label: string }[]
  onSubmit: (data: { title: string; description: string; dailyAction: string; targetDays: number; categoryId: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dailyAction, setDailyAction] = useState("")
  const [targetDays, setTargetDays] = useState(30)
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title, description, dailyAction, targetDays, categoryId })
  }

  return (
    <NeonCard glowColor="cyan">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h3 className="font-mono text-sm font-semibold text-neon-cyan">Nuevo Objetivo</h3>

        <input
          type="text"
          placeholder="Titulo del objetivo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          required
        />
        <textarea
          placeholder="Descripcion (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan resize-none"
        />
        <input
          type="text"
          placeholder="Accion diaria (ej: Leer 20 paginas)"
          value={dailyAction}
          onChange={(e) => setDailyAction(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
              Meta (dias)
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-neon-cyan/15 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/25"
          >
            Crear Objetivo
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-surface-2 px-4 py-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </NeonCard>
  )
}
