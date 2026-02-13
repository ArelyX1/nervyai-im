/**
 * ============================================
 * SKILLS MEMORY ADAPTER - Infrastructure Layer
 * ============================================
 * In-memory implementation of the SkillsPort.
 * Supports dynamic category CRUD and recursive
 * skill node operations at any depth level.
 *
 * Swap this adapter for a DB-backed one by
 * only changing container.ts.
 * ============================================
 */

import type { SkillsPort } from "@/src/skills/application/skills.port"
import {
  type SkillCategory,
  type SkillNode,
  type SkillRadarData,
  computeCategoryLevel,
  computeOverallLevel,
  createSkillCategory,
  createSkillNode,
} from "@/src/skills/domain/skill.entity"

// ─── SEED DATA (6 default categories with recursive children) ────

function seed(): SkillCategory[] {
  return [
    {
      ...createSkillCategory("Intelecto & Ciencia", "Brain", "hsl(185, 100%, 50%)"),
      id: "intellect",
      children: [
        { id: "physics", name: "Fisica", level: 15, xpRequired: 1000, xpCurrent: 150, children: [], parentId: null },
        { id: "math", name: "Matematicas", level: 22, xpRequired: 1000, xpCurrent: 220, children: [], parentId: null },
        {
          id: "programming", name: "Programacion", level: 45, xpRequired: 1000, xpCurrent: 450, parentId: null,
          children: [
            { id: "frontend", name: "Frontend", level: 50, xpRequired: 1000, xpCurrent: 500, children: [], parentId: "programming" },
            { id: "backend", name: "Backend", level: 35, xpRequired: 1000, xpCurrent: 350, children: [], parentId: "programming" },
            { id: "devops", name: "DevOps", level: 20, xpRequired: 1000, xpCurrent: 200, children: [], parentId: "programming" },
          ],
        },
        { id: "networking", name: "Redes", level: 12, xpRequired: 1000, xpCurrent: 120, children: [], parentId: null },
        { id: "ai", name: "IA & ML", level: 30, xpRequired: 1000, xpCurrent: 300, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Bienestar & Salud", "Heart", "hsl(300, 100%, 50%)"),
      id: "wellness",
      children: [
        { id: "health", name: "Salud General", level: 35, xpRequired: 1000, xpCurrent: 350, children: [], parentId: null },
        { id: "exercise", name: "Ejercicio", level: 40, xpRequired: 1000, xpCurrent: 400, children: [], parentId: null },
        { id: "nutrition", name: "Nutricion", level: 28, xpRequired: 1000, xpCurrent: 280, children: [], parentId: null },
        { id: "meditation", name: "Meditacion", level: 18, xpRequired: 1000, xpCurrent: 180, children: [], parentId: null },
        { id: "sleep", name: "Sueno", level: 50, xpRequired: 1000, xpCurrent: 500, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Humanidades & Sociedad", "BookOpen", "hsl(82, 100%, 55%)"),
      id: "humanities",
      children: [
        { id: "sociology", name: "Sociologia", level: 10, xpRequired: 1000, xpCurrent: 100, children: [], parentId: null },
        { id: "history", name: "Historia", level: 20, xpRequired: 1000, xpCurrent: 200, children: [], parentId: null },
        { id: "philosophy", name: "Filosofia", level: 25, xpRequired: 1000, xpCurrent: 250, children: [], parentId: null },
        { id: "languages", name: "Bilingue", level: 35, xpRequired: 1000, xpCurrent: 350, children: [], parentId: null },
        { id: "communication", name: "Comunicacion", level: 30, xpRequired: 1000, xpCurrent: 300, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Creatividad & Arte", "Palette", "hsl(35, 100%, 55%)"),
      id: "creativity",
      children: [
        { id: "visual-art", name: "Arte Visual", level: 18, xpRequired: 1000, xpCurrent: 180, children: [], parentId: null },
        { id: "music", name: "Musica", level: 22, xpRequired: 1000, xpCurrent: 220, children: [], parentId: null },
        { id: "design", name: "Diseno", level: 38, xpRequired: 1000, xpCurrent: 380, children: [], parentId: null },
        { id: "writing", name: "Escritura", level: 28, xpRequired: 1000, xpCurrent: 280, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Desarrollo Personal", "Target", "hsl(55, 100%, 55%)"),
      id: "personal",
      children: [
        { id: "responsibility", name: "Responsabilidad", level: 42, xpRequired: 1000, xpCurrent: 420, children: [], parentId: null },
        { id: "discipline", name: "Disciplina", level: 35, xpRequired: 1000, xpCurrent: 350, children: [], parentId: null },
        { id: "productivity", name: "Productividad", level: 38, xpRequired: 1000, xpCurrent: 380, children: [], parentId: null },
        { id: "leadership", name: "Liderazgo", level: 20, xpRequired: 1000, xpCurrent: 200, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Finanzas & Exito", "TrendingUp", "hsl(220, 100%, 60%)"),
      id: "finance",
      children: [
        { id: "savings", name: "Ahorro", level: 30, xpRequired: 1000, xpCurrent: 300, children: [], parentId: null },
        { id: "investments", name: "Inversiones", level: 15, xpRequired: 1000, xpCurrent: 150, children: [], parentId: null },
        { id: "business", name: "Negocios", level: 20, xpRequired: 1000, xpCurrent: 200, children: [], parentId: null },
        { id: "income", name: "Ingresos", level: 25, xpRequired: 1000, xpCurrent: 250, children: [], parentId: null },
      ],
    },
  ]
}

// ─── RECURSIVE TREE HELPERS ────────────────────

/** Insert a new child node into a tree at the target parent */
function insertChild(nodes: SkillNode[], parentId: string | null, newNode: SkillNode): SkillNode[] {
  if (parentId === null) return [...nodes, newNode]
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...n.children, { ...newNode, parentId }] }
    }
    if (n.children.length > 0) {
      return { ...n, children: insertChild(n.children, parentId, newNode) }
    }
    return n
  })
}

/** Remove a node by ID from the tree */
function removeById(nodes: SkillNode[], nodeId: string): SkillNode[] {
  return nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => ({
      ...n,
      children: n.children.length > 0 ? removeById(n.children, nodeId) : n.children,
    }))
}

/** Update XP for a specific node in the tree */
function updateXpInTree(nodes: SkillNode[], nodeId: string, xpGained: number): SkillNode[] {
  return nodes.map((n) => {
    if (n.id === nodeId) {
      const newXp = Math.min(n.xpCurrent + xpGained, n.xpRequired)
      const newLevel = Math.round((newXp / n.xpRequired) * 100)
      return { ...n, xpCurrent: newXp, level: newLevel }
    }
    if (n.children.length > 0) {
      return { ...n, children: updateXpInTree(n.children, nodeId, xpGained) }
    }
    return n
  })
}

/** Recalculate all category levels from their children */
function recalculate(categories: SkillCategory[]): SkillCategory[] {
  return categories.map((cat) => ({
    ...cat,
    level: computeCategoryLevel(cat.children),
  }))
}

// ─── ADAPTER FACTORY ───────────────────────────

export function createSkillsMemoryAdapter(): SkillsPort {
  let categories = recalculate(seed())

  function snapshot(): SkillRadarData {
    return { categories, overallLevel: computeOverallLevel(categories) }
  }

  return {
    getSkillRadar: () => snapshot(),

    getCategory: (id) => categories.find((c) => c.id === id),

    addCategory(name, icon, color) {
      const cat: SkillCategory = { ...createSkillCategory(name, icon, color) }
      categories = recalculate([...categories, cat])
      return snapshot()
    },

    removeCategory(categoryId) {
      categories = categories.filter((c) => c.id !== categoryId)
      return snapshot()
    },

    updateCategory(categoryId, updates) {
      categories = categories.map((c) =>
        c.id === categoryId ? { ...c, ...updates } : c
      )
      return snapshot()
    },

    addSkillNode(categoryId, parentNodeId, name) {
      const newNode = createSkillNode(name, parentNodeId)
      categories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        return { ...cat, children: insertChild(cat.children, parentNodeId, newNode) }
      })
      categories = recalculate(categories)
      return snapshot()
    },

    removeSkillNode(categoryId, nodeId) {
      categories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        return { ...cat, children: removeById(cat.children, nodeId) }
      })
      categories = recalculate(categories)
      return snapshot()
    },

    updateNodeXp(categoryId, nodeId, xpGained) {
      categories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat
        return { ...cat, children: updateXpInTree(cat.children, nodeId, xpGained) }
      })
      categories = recalculate(categories)
      return snapshot()
    },
  }
}
