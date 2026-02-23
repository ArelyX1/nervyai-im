/**
 * ============================================
 * TASKS SCREEN - Presentation Layer
 * ============================================
 * Full task management view with:
 * - Filter by status/category
 * - Add new task form with validation rules
 * - Complete/delete task actions
 * - Task list grouped by status
 * ============================================
 */

"use client"

import { useState } from "react"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { CATEGORY_COLORS } from "@/src/shared/presentation/category-colors"
import type { SkillCategoryId, SkillNode } from "@/src/skills/domain/skill.entity"
import type { TaskFrequency, TaskPriority, ValidationRule, TaskStatus } from "@/src/tasks/domain/task.entity"
import {
  Plus, CheckCircle2, Trash2, Clock, Flame,
  AlertTriangle, Filter, X, ChevronDown, ChevronUp,
} from "lucide-react"

type FilterMode = "all" | TaskStatus

export function TasksScreen() {
  const { tasks, addTask, completeTask, deleteTask } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<FilterMode>("all")
  const [categoryFilter, setCategoryFilter] = useState<SkillCategoryId | "all">("all")
  const [showFilters, setShowFilters] = useState(false)

  const filtered = tasks.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false
    if (categoryFilter !== "all" && t.skillCategoryId !== categoryFilter) return false
    return true
  })

  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
            Mis Actividades
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {tasks.length} tareas totales
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 rounded-lg border border-border bg-surface-1 px-2.5 py-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-neon-cyan/10 px-3 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/20"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </button>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col gap-2">
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", "pending", "in-progress", "completed"] as FilterMode[]).map((status) => {
              const labels: Record<FilterMode, string> = {
                all: "Todas",
                pending: "Pendientes",
                "in-progress": "En Progreso",
                completed: "Completadas",
              }
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold transition-all ${
                    filter === status
                      ? "bg-neon-cyan/20 text-neon-cyan neon-border"
                      : "bg-surface-2 text-muted-foreground border border-border hover:text-foreground"
                  }`}
                >
                  {labels[status]} ({statusCounts[status as keyof typeof statusCounts] ?? 0})
                </button>
              )
            })}
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold transition-all ${
                categoryFilter === "all"
                  ? "bg-neon-cyan/20 text-neon-cyan neon-border"
                  : "bg-surface-2 text-muted-foreground border border-border"
              }`}
            >
              Todas
            </button>
            {(Object.keys(CATEGORY_COLORS) as SkillCategoryId[]).map((catId) => {
              const colors = CATEGORY_COLORS[catId]
              const labels: Record<SkillCategoryId, string> = {
                intellect: "Intelecto",
                wellness: "Bienestar",
                humanities: "Humanidades",
                creativity: "Creatividad",
                personal: "Personal",
                finance: "Finanzas",
              }
              return (
                <button
                  key={catId}
                  onClick={() => setCategoryFilter(catId)}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold transition-all ${
                    categoryFilter === catId
                      ? `${colors.bg} ${colors.text}`
                      : "bg-surface-2 text-muted-foreground border border-border"
                  }`}
                >
                  {labels[catId]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showForm && (
        <AddTaskForm
          onSubmit={(data) => {
            addTask(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Task List */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <NeonCard glowColor="cyan">
            <p className="py-6 text-center font-mono text-xs text-muted-foreground">
              No hay tareas que mostrar
            </p>
          </NeonCard>
        ) : (
          filtered.map((task) => {
            const colors = CATEGORY_COLORS[task.skillCategoryId]
            return (
              <TaskCard
                key={task.id}
                task={task}
                colors={colors}
                onComplete={() => completeTask(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

/** Individual Task Card */
function TaskCard({
  task,
  colors,
  onComplete,
  onDelete,
}: {
  task: import("@/src/tasks/domain/task.entity").Task
  colors: import("@/src/shared/presentation/category-colors").CategoryColorConfig
  onComplete: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const priorityColors: Record<TaskPriority, string> = {
    low: "text-muted-foreground bg-surface-3",
    medium: "text-neon-cyan bg-neon-cyan/10",
    high: "text-neon-orange bg-neon-orange/10",
    critical: "text-destructive bg-destructive/10",
  }

  const frequencyLabels: Record<TaskFrequency, string> = {
    daily: "Diaria",
    "every-other-day": "Interdiaria",
    weekly: "Semanal",
    monthly: "Mensual",
    "one-time": "Unica",
    custom: "Personalizada",
  }

  const validationLabels: Record<ValidationRule, string> = {
    none: "Sin validacion",
    "minimum-time": `Min. ${task.minimumMinutes ?? 0} min`,
    "photo-proof": "Foto requerida",
    "location-check": "Ubicacion GPS",
    "manual-confirm": "Confirmacion manual",
  }

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bgFaded} overflow-hidden`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Complete button */}
        <button
          onClick={onComplete}
          disabled={task.status === "completed"}
          className={`shrink-0 transition-all ${
            task.status === "completed"
              ? "text-neon-lime"
              : "text-muted-foreground hover:text-neon-lime"
          }`}
          aria-label={`Completar tarea ${task.title}`}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-mono text-xs font-semibold ${
            task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
          }`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-1.5 py-0.5 font-mono text-[8px] font-semibold ${priorityColors[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
            <span className="font-mono text-[8px] text-muted-foreground">
              {frequencyLabels[task.frequency]}
            </span>
            {task.streak > 0 && (
              <span className="flex items-center gap-0.5 font-mono text-[8px] text-neon-orange">
                <Flame className="h-2.5 w-2.5" />
                {task.streak}
              </span>
            )}
            <span className={`font-mono text-[8px] ${colors.text}`}>
              +{task.xpReward}XP
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Ver detalles"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Eliminar tarea ${task.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-border/40 px-3 py-2">
          {task.description && (
            <p className="mb-2 font-mono text-[10px] text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-md bg-surface-3 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {validationLabels[task.validationRule]}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1 rounded-md bg-surface-3 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                <AlertTriangle className="h-2.5 w-2.5" />
                Vence: {task.dueDate}
              </span>
            )}
            {task.tags.map((tag) => (
              <span key={tag} className={`rounded-md ${colors.bg} px-2 py-0.5 font-mono text-[9px] ${colors.text}`}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Form to add a new task with all fields:
 * title, description, category, sub-skill, frequency,
 * priority, validation rule, XP reward, due date, tags.
 */
function AddTaskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    title: string
    description: string
    skillCategoryId: SkillCategoryId
    subSkillId?: string
    frequency: TaskFrequency
    priority: TaskPriority
    validationRule: ValidationRule
    xpReward: number
    dueDate?: string
    tags: string[]
    minimumMinutes?: number
  }) => void
  onCancel: () => void
}) {
  const { skills } = useApp()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [skillCategoryId, setSkillCategoryId] = useState<SkillCategoryId>("intellect")
  const [selectedNodePath, setSelectedNodePath] = useState<string[]>([])
  const [frequency, setFrequency] = useState<TaskFrequency>("daily")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [validationRule, setValidationRule] = useState<ValidationRule>("manual-confirm")
  const [xpReward, setXpReward] = useState(15)
  const [dueDate, setDueDate] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [minimumMinutes, setMinimumMinutes] = useState(30)

  const selectedCategory = skills.categories.find((c) => c.id === skillCategoryId)

  // Build arrays of nodes to render a select for each level (cascading selects)
  const selects: SkillNode[][] = []
  if (selectedCategory) {
    let nodes = selectedCategory.children
    selects.push(nodes)
    for (let i = 0; i < selectedNodePath.length; i++) {
      const selId = selectedNodePath[i]
      const found = nodes.find((n) => n.id === selId)
      if (!found) break
      nodes = found.children
      if (nodes.length > 0) selects.push(nodes)
      else break
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title,
      description,
      skillCategoryId,
      subSkillId: selectedNodePath.length > 0 ? selectedNodePath[selectedNodePath.length - 1] : undefined,
      frequency,
      priority,
      validationRule,
      xpReward,
      dueDate: dueDate || undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      minimumMinutes: validationRule === "minimum-time" ? minimumMinutes : undefined,
    })
  }

  const selectCls = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
  const inputCls = selectCls
  const labelCls = "mb-1 block font-mono text-[10px] text-muted-foreground"

  return (
    <NeonCard glowColor="cyan">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-neon-cyan">Nueva Tarea</h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input type="text" placeholder="Titulo de la tarea" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} required />
        <textarea placeholder="Descripcion (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Categoria</label>
            <select value={skillCategoryId} onChange={(e) => { setSkillCategoryId(e.target.value as SkillCategoryId); setSelectedNodePath([]) }} className={selectCls}>
              {skills.categories.map((c) => (<option key={c.id} value={c.id}>{c.name.split("&")[0].trim()}</option>))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Sub-Habilidad</label>
            <div className="flex flex-col gap-2">
              {selects.map((nodesAtLevel, level) => (
                <select
                  key={level}
                  value={selectedNodePath[level] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) {
                      setSelectedNodePath((prev) => prev.slice(0, level))
                    } else {
                      setSelectedNodePath((prev) => {
                        const next = [...prev.slice(0, level), val]
                        return next
                      })
                    }
                  }}
                  className={selectCls}
                >
                  <option value="">Ninguna</option>
                  {nodesAtLevel.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
                </select>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Frecuencia</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as TaskFrequency)} className={selectCls}>
              <option value="daily">Diaria</option>
              <option value="every-other-day">Interdiaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="one-time">Unica</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={selectCls}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Critica</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Validacion</label>
            <select value={validationRule} onChange={(e) => setValidationRule(e.target.value as ValidationRule)} className={selectCls}>
              <option value="none">Sin validacion</option>
              <option value="manual-confirm">Confirmacion manual</option>
              <option value="minimum-time">Tiempo minimo</option>
              <option value="photo-proof">Foto como prueba</option>
              <option value="location-check">Ubicacion GPS</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>XP Recompensa</label>
            <input type="number" min={1} max={100} value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} className={inputCls} />
          </div>
        </div>

        {validationRule === "minimum-time" && (
          <div>
            <label className={labelCls}>Minutos minimos</label>
            <input type="number" min={1} value={minimumMinutes} onChange={(e) => setMinimumMinutes(Number(e.target.value))} className={inputCls} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fecha limite</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tags (separados por coma)</label>
            <input type="text" placeholder="estudio, gym..." value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputCls} />
          </div>
        </div>

        <button type="submit" className="w-full rounded-lg bg-neon-cyan/15 py-2.5 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/25">
          Crear Tarea
        </button>
      </form>
    </NeonCard>
  )
}
