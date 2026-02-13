/**
 * ============================================
 * SKILL RADAR SCREEN - Presentation Layer
 * ============================================
 * Dynamic skill radar view with:
 * - Main radar chart for all categories
 * - "+" button to create new categories
 * - Recursive drill-down into skill nodes
 * - Breadcrumb navigation across N levels
 * - Add/delete skill nodes at any depth
 * - Delete categories with confirmation
 * ============================================
 */

"use client"

import { useState } from "react"
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell,
} from "recharts"
import { useApp } from "@/src/shared/presentation/app-context"
import { NeonCard } from "@/src/shared/presentation/components/neon-card"
import { getCategoryColor } from "@/src/shared/presentation/category-colors"
import { computeNodeLevel } from "@/src/skills/domain/skill.entity"
import type { SkillCategory, SkillNode } from "@/src/skills/domain/skill.entity"
import { ChevronLeft, ChevronRight, Plus, Trash2, Sparkles, X } from "lucide-react"

// ─── TYPES ─────────────────────────────────────

/** Navigation state for recursive drill-down */
interface DrillState {
  categoryId: string
  /** Stack of parent nodes we drilled into; empty = category root */
  breadcrumb: { id: string; name: string }[]
  /** Current nodes to display */
  currentNodes: SkillNode[]
  /** Current parent node ID (null = category root) */
  parentNodeId: string | null
}

// ─── MAIN SCREEN ───────────────────────────────

export function SkillRadarScreen() {
  const { skills, addCategory, removeCategory, addSkillNode, removeSkillNode } = useApp()
  const [drill, setDrill] = useState<DrillState | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  /** Enter drill-down for a category */
  const drillIntoCategory = (cat: SkillCategory) => {
    setDrill({
      categoryId: cat.id,
      breadcrumb: [],
      currentNodes: cat.children,
      parentNodeId: null,
    })
  }

  /** Drill deeper into a child node */
  const drillIntoNode = (node: SkillNode) => {
    if (!drill || node.children.length === 0) return
    setDrill({
      ...drill,
      breadcrumb: [...drill.breadcrumb, { id: node.id, name: node.name }],
      currentNodes: node.children,
      parentNodeId: node.id,
    })
  }

  /** Go back one level */
  const goBack = () => {
    if (!drill) return
    if (drill.breadcrumb.length === 0) {
      setDrill(null)
      return
    }
    // Pop the last breadcrumb, restore parent nodes
    const newBreadcrumb = [...drill.breadcrumb]
    newBreadcrumb.pop()

    // Find current nodes from fresh skill data
    const cat = skills.categories.find((c) => c.id === drill.categoryId)
    if (!cat) { setDrill(null); return }

    let nodes = cat.children
    for (const crumb of newBreadcrumb) {
      const found = nodes.find((n) => n.id === crumb.id)
      if (found) nodes = found.children
      else break
    }

    setDrill({
      ...drill,
      breadcrumb: newBreadcrumb,
      currentNodes: nodes,
      parentNodeId: newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : null,
    })
  }

  // Sync drill-down nodes with fresh state after CRUD
  const refreshDrill = () => {
    if (!drill) return
    const cat = skills.categories.find((c) => c.id === drill.categoryId)
    if (!cat) { setDrill(null); return }

    let nodes = cat.children
    for (const crumb of drill.breadcrumb) {
      const found = nodes.find((n) => n.id === crumb.id)
      if (found) nodes = found.children
      else break
    }
    setDrill({ ...drill, currentNodes: nodes })
  }

  // If we're in drill-down mode
  if (drill) {
    const cat = skills.categories.find((c) => c.id === drill.categoryId)
    if (!cat) { setDrill(null); return null }

    return (
      <DrillDownView
        category={cat}
        drill={drill}
        onBack={goBack}
        onDrillNode={drillIntoNode}
        onAddNode={(name) => {
          addSkillNode(drill.categoryId, drill.parentNodeId, name)
          // Refresh after state update
          setTimeout(refreshDrill, 10)
        }}
        onRemoveNode={(nodeId) => {
          removeSkillNode(drill.categoryId, nodeId)
          setTimeout(refreshDrill, 10)
        }}
      />
    )
  }

  // Main radar view
  const radarData = skills.categories.map((cat) => ({
    name: cat.name.split(" ")[0],
    level: cat.level,
    fullMark: 100,
  }))

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground text-glow-cyan">
            Radar de Habilidades
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Nivel general: {skills.overallLevel}/100
          </p>
        </div>
        <button
          onClick={() => setShowNewCategory(true)}
          className="flex items-center gap-1.5 rounded-lg bg-neon-cyan/10 px-3 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/20"
        >
          <Plus className="h-4 w-4" />
          Categoria
        </button>
      </header>

      {/* New Category Form */}
      {showNewCategory && (
        <NewCategoryForm
          onSubmit={(name, icon, color) => {
            addCategory(name, icon, color)
            setShowNewCategory(false)
          }}
          onCancel={() => setShowNewCategory(false)}
        />
      )}

      {/* Main Radar */}
      {skills.categories.length > 2 && (
        <NeonCard glowColor="cyan">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="hsl(185, 100%, 50%)" strokeOpacity={0.12} strokeDasharray="2 4" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 11, fontFamily: "monospace" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(185, 40%, 40%)", fontSize: 8 }} tickCount={5} />
              <Radar name="Nivel" dataKey="level" stroke="hsl(185, 100%, 50%)" fill="hsl(185, 100%, 50%)" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </NeonCard>
      )}

      {/* Category Cards */}
      <h2 className="font-mono text-sm font-semibold text-foreground">
        Categorias ({skills.categories.length})
      </h2>
      <div className="flex flex-col gap-3">
        {skills.categories.map((cat) => {
          const colors = getCategoryColor(cat.id)
          return (
            <NeonCard key={cat.id} glowColor={colors.glow} interactive onClick={() => drillIntoCategory(cat)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Sparkles className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <p className={`font-mono text-sm font-semibold ${colors.text}`}>{cat.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {cat.children.length} sub-habilidades
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-mono text-lg font-bold ${colors.text}`}>{cat.level}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">NIVEL</p>
                  </div>
                  {confirmDelete === cat.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCategory(cat.id); setConfirmDelete(null) }}
                        className="rounded-md bg-destructive/20 px-2 py-1 font-mono text-[9px] text-destructive hover:bg-destructive/30"
                      >
                        Si
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }}
                        className="rounded-md bg-surface-3 px-2 py-1 font-mono text-[9px] text-muted-foreground"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(cat.id) }}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Eliminar ${cat.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.level}%`, backgroundColor: colors.hex }} />
              </div>
            </NeonCard>
          )
        })}
      </div>
    </div>
  )
}

// ─── DRILL-DOWN VIEW (Recursive) ───────────────

function DrillDownView({
  category,
  drill,
  onBack,
  onDrillNode,
  onAddNode,
  onRemoveNode,
}: {
  category: SkillCategory
  drill: DrillState
  onBack: () => void
  onDrillNode: (node: SkillNode) => void
  onAddNode: (name: string) => void
  onRemoveNode: (nodeId: string) => void
}) {
  const colors = getCategoryColor(category.id)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")

  const handleAdd = () => {
    if (!newName.trim()) return
    onAddNode(newName.trim())
    setNewName("")
    setShowAddForm(false)
  }

  const subData = drill.currentNodes.map((n) => ({
    name: n.name,
    level: computeNodeLevel(n),
    fullMark: 100,
  }))

  const barData = drill.currentNodes.map((n) => ({
    name: n.name,
    xp: n.xpCurrent,
    needed: n.xpRequired,
    level: computeNodeLevel(n),
  }))

  // Build breadcrumb labels
  const breadcrumbLabels = [category.name, ...drill.breadcrumb.map((b) => b.name)]

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header with breadcrumb */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Volver"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={`font-mono text-lg font-bold ${colors.text} truncate`}>
              {breadcrumbLabels[breadcrumbLabels.length - 1]}
            </h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-semibold transition-all ${colors.bg} ${colors.text} hover:opacity-80`}
          >
            <Plus className="h-3.5 w-3.5" />
            Sub-skill
          </button>
        </div>

        {/* Breadcrumb trail */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {breadcrumbLabels.map((label, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <span className={`font-mono text-[10px] ${i === breadcrumbLabels.length - 1 ? colors.text + " font-semibold" : "text-muted-foreground"}`}>
                {label}
              </span>
            </span>
          ))}
        </div>
      </header>

      {/* Inline add form */}
      {showAddForm && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre de la sub-habilidad"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
            autoFocus
          />
          <button onClick={handleAdd} className="rounded-lg bg-neon-cyan/15 px-3 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border hover:bg-neon-cyan/25">
            Agregar
          </button>
          <button onClick={() => { setShowAddForm(false); setNewName("") }} className="rounded-lg border border-border bg-surface-2 px-2 py-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sub-radar chart */}
      {drill.currentNodes.length > 2 && (
        <NeonCard glowColor={colors.glow}>
          <h2 className="mb-2 font-mono text-xs font-semibold text-muted-foreground">Sub-Radar</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={subData} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke={colors.hex} strokeOpacity={0.15} strokeDasharray="2 4" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 10, fontFamily: "monospace" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} tickCount={5} />
              <Radar name="Nivel" dataKey="level" stroke={colors.hex} fill={colors.hex} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </NeonCard>
      )}

      {/* XP Bar Chart */}
      {drill.currentNodes.length > 0 && (
        <NeonCard glowColor={colors.glow}>
          <h2 className="mb-3 font-mono text-xs font-semibold text-muted-foreground">Progreso XP</h2>
          <ResponsiveContainer width="100%" height={Math.max(120, drill.currentNodes.length * 36)}>
            <BarChart data={barData} layout="vertical" barCategoryGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 30%, 18%)" />
              <XAxis type="number" domain={[0, 1000]} tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 9, fontFamily: "monospace" }} />
              <YAxis type="category" dataKey="name" width={85} tick={{ fill: "hsl(185, 40%, 55%)", fontSize: 9, fontFamily: "monospace" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(225, 35%, 9%)", border: `1px solid ${colors.hex}`, borderRadius: "8px", fontFamily: "monospace", fontSize: "11px", color: "hsl(185, 100%, 92%)" }} />
              <Bar dataKey="xp" radius={[0, 4, 4, 0]} barSize={14}>
                {barData.map((_, i) => <Cell key={i} fill={colors.hex} fillOpacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </NeonCard>
      )}

      {/* Node Detail List */}
      <h2 className="font-mono text-sm font-semibold text-foreground">
        Nodos ({drill.currentNodes.length})
      </h2>

      {drill.currentNodes.length === 0 && (
        <NeonCard glowColor={colors.glow}>
          <p className="py-6 text-center font-mono text-xs text-muted-foreground">
            Sin sub-habilidades. Agrega una con el boton &quot;+ Sub-skill&quot;.
          </p>
        </NeonCard>
      )}

      <div className="flex flex-col gap-2">
        {drill.currentNodes.map((node) => {
          const level = computeNodeLevel(node)
          const hasChildren = node.children.length > 0
          return (
            <div
              key={node.id}
              className={`flex items-center gap-3 rounded-lg border ${colors.border} ${colors.bgFaded} px-4 py-3 ${hasChildren ? "cursor-pointer hover:bg-surface-2 transition-colors" : ""}`}
              onClick={hasChildren ? () => onDrillNode(node) : undefined}
              role={hasChildren ? "button" : undefined}
              tabIndex={hasChildren ? 0 : undefined}
              onKeyDown={hasChildren ? (e) => { if (e.key === "Enter") onDrillNode(node) } : undefined}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs font-semibold text-foreground">{node.name}</p>
                  {hasChildren && (
                    <span className="rounded-full bg-surface-3 px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground">
                      {node.children.length} hijos
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {node.xpCurrent}/{node.xpRequired} XP
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(node.xpCurrent / node.xpRequired) * 100}%`, backgroundColor: colors.hex }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`font-mono text-lg font-bold ${colors.text}`}>{level}</div>
                {hasChildren && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveNode(node.id) }}
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Eliminar ${node.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── NEW CATEGORY FORM ─────────────────────────

const NEON_COLOR_OPTIONS = [
  { label: "Cian", value: "hsl(185, 100%, 50%)" },
  { label: "Magenta", value: "hsl(300, 100%, 50%)" },
  { label: "Lima", value: "hsl(82, 100%, 55%)" },
  { label: "Naranja", value: "hsl(35, 100%, 55%)" },
  { label: "Amarillo", value: "hsl(55, 100%, 55%)" },
  { label: "Azul", value: "hsl(220, 100%, 60%)" },
]

function NewCategoryForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, icon: string, color: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(NEON_COLOR_OPTIONS[0].value)

  return (
    <NeonCard glowColor="cyan">
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim(), "Sparkles", color) }}
        className="flex flex-col gap-3"
      >
        <h3 className="font-mono text-sm font-semibold text-neon-cyan">Nueva Categoria</h3>
        <input
          type="text"
          placeholder="Nombre de la categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-cyan"
          required
          autoFocus
        />
        <div>
          <label className="mb-1.5 block font-mono text-[10px] text-muted-foreground">Color Neon</label>
          <div className="flex flex-wrap gap-2">
            {NEON_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setColor(opt.value)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${color === opt.value ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: opt.value }}
                aria-label={opt.label}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-neon-cyan/15 py-2 font-mono text-xs font-semibold text-neon-cyan neon-border transition-all hover:bg-neon-cyan/25">
            Crear
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg border border-border bg-surface-2 px-4 py-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </NeonCard>
  )
}
