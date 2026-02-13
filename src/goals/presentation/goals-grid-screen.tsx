/**
 * ============================================
 * GOALS GRID SCREEN - Presentation Layer
 * ============================================
 * The central tracker view with:
 * - Add new goal form
 * - Goals as neon-lit grid cards
 * - Each cell lights up with category color
 * - Overachieved animation and grid expansion
 * ============================================
 */

"use client"

import { useState } from "react"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { CATEGORY_COLORS } from "@/src/shared/presentation/category-colors"
import { goalProgress } from "@/src/goals/domain/goal.entity"
import type { SkillCategoryId } from "@/src/skills/domain/skill.entity"
import { Plus, Trash2, Zap, Trophy } from "lucide-react"

export function GoalsGridScreen() {
  const { goals, addGoal, incrementGoal, deleteGoal } = useApp()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
            Grid de Objetivos
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {goals.length} objetivos activos
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

      {showForm && (
        <AddGoalForm
          onSubmit={(data) => {
            addGoal(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex flex-col gap-4">
        {goals.map((goal) => {
          const colors = CATEGORY_COLORS[goal.categoryId]
          const progress = goalProgress(goal)
          const gridCols = goal.targetCount <= 12 ? "grid-cols-6" :
            goal.targetCount <= 25 ? "grid-cols-5" :
            goal.targetCount <= 50 ? "grid-cols-10" : "grid-cols-10"

          return (
            <NeonCard key={goal.id} glowColor={colors.glow}>
              {/* Goal Header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className={`font-mono text-sm font-bold ${colors.text}`}>
                    {goal.title}
                  </h3>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {goal.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {goal.isOverachieved && (
                    <span className="flex items-center gap-1 rounded-full bg-neon-lime/20 px-2 py-0.5 font-mono text-[9px] font-bold text-neon-lime animate-neon-pulse">
                      <Trophy className="h-3 w-3" />
                      OVERACHIEVED
                    </span>
                  )}
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Eliminar objetivo ${goal.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {goal.currentCount}/{goal.targetCount}
                </span>
                <span className={`font-mono text-xs font-bold ${progress >= 100 ? "text-neon-lime" : colors.text}`}>
                  {progress}%
                </span>
              </div>
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: progress >= 100 ? "#AAFF00" : colors.hex,
                  }}
                />
              </div>

              {/* Grid Cells */}
              <div className={`grid ${gridCols} gap-1`}>
                {goal.cells.map((cell) => {
                  const cellColor = cell.filled && cell.categoryId
                    ? CATEGORY_COLORS[cell.categoryId].hex
                    : undefined

                  return (
                    <div
                      key={cell.index}
                      className={`aspect-square rounded-sm transition-all duration-300 ${
                        cell.filled
                          ? "animate-grid-fill"
                          : "bg-surface-3 border border-border/40"
                      }`}
                      style={cell.filled ? { backgroundColor: cellColor, opacity: 0.85 } : undefined}
                    />
                  )
                })}
              </div>

              {/* Increment Button */}
              <button
                onClick={() => incrementGoal(goal.id)}
                className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-xs font-semibold transition-all ${colors.bg} ${colors.text} hover:opacity-80 active:scale-[0.98]`}
              >
                <Zap className="h-3.5 w-3.5" />
                Registrar Progreso
              </button>
            </NeonCard>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Form to add a new goal.
 */
function AddGoalForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { title: string; description: string; targetCount: number; categoryId: SkillCategoryId }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetCount, setTargetCount] = useState(20)
  const [categoryId, setCategoryId] = useState<SkillCategoryId>("intellect")

  const categories: { id: SkillCategoryId; label: string }[] = [
    { id: "intellect", label: "Intelecto" },
    { id: "wellness", label: "Bienestar" },
    { id: "humanities", label: "Humanidades" },
    { id: "creativity", label: "Creatividad" },
    { id: "personal", label: "Personal" },
    { id: "finance", label: "Finanzas" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title, description, targetCount, categoryId })
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

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
              Meta (bloques)
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block font-mono text-[10px] text-muted-foreground">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as SkillCategoryId)}
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
