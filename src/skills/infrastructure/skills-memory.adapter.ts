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

// (no extra imports)

// ─── SEED DATA (6 default categories with recursive children) ────

function seed(): SkillCategory[] {
  return [
    {
      ...createSkillCategory("Intelecto & Ciencia", "Brain", "hsl(185, 100%, 50%)"),
      id: "intellect",
      children: [
        { id: "physics", name: "Fisica", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "math", name: "Matematicas", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        {
          id: "programming", name: "Programacion", level: 0, xpRequired: 1000, xpCurrent: 0, parentId: null,
          children: [
            { id: "frontend", name: "Frontend", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: "programming" },
            { id: "backend", name: "Backend", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: "programming" },
            { id: "devops", name: "DevOps", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: "programming" },
          ],
        },
        { id: "networking", name: "Redes", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "ai", name: "IA & ML", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Bienestar & Salud", "Heart", "hsl(300, 100%, 50%)"),
      id: "wellness",
      children: [
        { id: "health", name: "Salud General", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "exercise", name: "Ejercicio", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "nutrition", name: "Nutricion", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "meditation", name: "Meditacion", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "sleep", name: "Sueno", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Humanidades & Sociedad", "BookOpen", "hsl(82, 100%, 55%)"),
      id: "humanities",
      children: [
        { id: "sociology", name: "Sociologia", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "history", name: "Historia", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "philosophy", name: "Filosofia", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "languages", name: "Bilingue", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "communication", name: "Comunicacion", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Creatividad & Arte", "Palette", "hsl(35, 100%, 55%)"),
      id: "creativity",
      children: [
        { id: "visual-art", name: "Arte Visual", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "music", name: "Musica", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "design", name: "Diseno", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "writing", name: "Escritura", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Desarrollo Personal", "Target", "hsl(55, 100%, 55%)"),
      id: "personal",
      children: [
        { id: "responsibility", name: "Responsabilidad", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "discipline", name: "Disciplina", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "productivity", name: "Productividad", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "leadership", name: "Liderazgo", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
      ],
    },
    {
      ...createSkillCategory("Finanzas & Exito", "TrendingUp", "hsl(220, 100%, 60%)"),
      id: "finance",
      children: [
        { id: "savings", name: "Ahorro", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "investments", name: "Inversiones", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "business", name: "Negocios", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
        { id: "income", name: "Ingresos", level: 0, xpRequired: 1000, xpCurrent: 0, children: [], parentId: null },
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

/** Find a node by ID in this file (simple utility) */
function findNodeInTree(nodes: SkillNode[], id: string): SkillNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children.length > 0) {
      const found = findNodeInTree(n.children, id)
      if (found) return found
    }
  }
  return null
}

/** Set xpCurrent to 0 on a node (used when turning a leaf into parent with children)
 * returns a new tree with the change applied
 */
function zeroXpInTree(nodes: SkillNode[], nodeId: string): SkillNode[] {
  return nodes.map((n) => {
    if (n.id === nodeId) {
      return { ...n, xpCurrent: 0 }
    }
    if (n.children.length > 0) {
      return { ...n, children: zeroXpInTree(n.children, nodeId) }
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

/** Zero out xpCurrent and level for all nodes in a tree */
function zeroAllXpInTree(nodes: SkillNode[]): SkillNode[] {
  return nodes.map((n) => ({
    ...n,
    xpCurrent: 0,
    level: 0,
    children: n.children.length > 0 ? zeroAllXpInTree(n.children) : [],
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

    /** Replace in-memory state with loaded data (sync after login/fetch) */
    loadSkillRadar(data: SkillRadarData) {
      if (data?.categories && Array.isArray(data.categories)) {
        categories = recalculate(JSON.parse(JSON.stringify(data.categories)))
      }
      return snapshot()
    },

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

        // If adding under a transition node, redirect to its parent (transition nodes are internal)
        if (parentNodeId) {
          const parentNode = findNodeInTree(cat.children, parentNodeId)
          if (parentNode && parentNode.id.startsWith("trans-")) {
            parentNodeId = parentNode.parentId
          }
        }

        // If parent exists and is currently a leaf with XP, move its XP into a new "General" transition child
        if (parentNodeId) {
          const parentNode = findNodeInTree(cat.children, parentNodeId)
          if (parentNode && parentNode.children.length === 0 && parentNode.xpCurrent > 0) {
            const tmp = createSkillNode("General", parentNodeId)
            const transNode: SkillNode = {
              ...tmp,
              id: `trans-${tmp.id}`,
              name: `${parentNode.name} — General`,
              xpRequired: parentNode.xpRequired,
              xpCurrent: parentNode.xpCurrent,
              parentId: parentNodeId,
              children: [],
            }

            // zero parent's xp, insert transition node, then insert the requested new node
            let newChildren = zeroXpInTree(cat.children, parentNodeId)
            newChildren = insertChild(newChildren, parentNodeId, transNode)
            newChildren = insertChild(newChildren, parentNodeId, newNode)
            return { ...cat, children: newChildren }
          }
        }

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

    // Distribute XP taken from a transition node into sibling children
    distributeTransitionXp(categoryId, parentNodeId, allocations) {
      categories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat

        function applyAlloc(nodes: SkillNode[]): SkillNode[] {
          return nodes.map((n) => {
            if (n.id === parentNodeId) {
              // find transition child
              const trans = n.children.find((c) => c.id.startsWith("trans-") || /general/i.test(c.name))
              const transXp = trans ? trans.xpCurrent : 0

              // apply allocations to children
              const totalAllocated = allocations.reduce((s, a) => s + a.xp, 0)
              const updatedChildren = n.children.map((c) => {
                if (c.id.startsWith("trans-")) return { ...c, xpCurrent: Math.max(0, transXp - totalAllocated) }
                const alloc = allocations.find((a) => a.nodeId === c.id)
                if (!alloc) return c
                const newXp = Math.min(c.xpRequired, c.xpCurrent + alloc.xp)
                return { ...c, xpCurrent: newXp, level: Math.round((newXp / c.xpRequired) * 100) }
              })

              return { ...n, children: updatedChildren }
            }
            if (n.children.length > 0) return { ...n, children: applyAlloc(n.children) }
            return n
          })
        }

        return { ...cat, children: applyAlloc(cat.children) }
      })
      categories = recalculate(categories)
      return snapshot()
    },

    // Distribute all XP from transition child equally among non-transition children.
    distributeTransitionEqually(categoryId, parentNodeId) {
      categories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat

        // Helper for non-root parents
        function applyEqual(nodes: SkillNode[]): SkillNode[] {
          return nodes.map((n) => {
            if (n.id === parentNodeId) {
              const trans = n.children.find((c) => c.id.startsWith("trans-") || /general/i.test(c.name))
              const transXp = trans ? trans.xpCurrent : 0

              const targets = n.children.filter((c) => !c.id.startsWith("trans-"))
              if (targets.length === 0) return n

              const base = Math.floor(transXp / targets.length)
              const remainder = transXp % targets.length

              let first = true
              const updatedChildren = n.children.map((c) => {
                if (c.id.startsWith("trans-")) {
                  return { ...c, xpCurrent: 0 }
                }
                const extra = first ? remainder : 0
                first = false
                const alloc = base + extra
                const newXp = Math.min(c.xpRequired, c.xpCurrent + alloc)
                return { ...c, xpCurrent: newXp, level: Math.round((newXp / c.xpRequired) * 100) }
              })

              return { ...n, children: updatedChildren }
            }
            if (n.children.length > 0) return { ...n, children: applyEqual(n.children) }
            return n
          })
        }

        // If parentNodeId is null, operate at category root
        if (parentNodeId === null) {
          const trans = cat.children.find((c) => c.id.startsWith("trans-") || /general/i.test(c.name))
          const transXp = trans ? trans.xpCurrent : 0
          const targets = cat.children.filter((c) => !c.id.startsWith("trans-"))
          if (targets.length === 0) return cat

          const base = Math.floor(transXp / targets.length)
          const remainder = transXp % targets.length
          let first = true
          const updated = cat.children.map((c) => {
            if (c.id.startsWith("trans-")) return { ...c, xpCurrent: 0 }
            const extra = first ? remainder : 0
            first = false
            const alloc = base + extra
            const newXp = Math.min(c.xpRequired, c.xpCurrent + alloc)
            return { ...c, xpCurrent: newXp, level: Math.round((newXp / c.xpRequired) * 100) }
          })
          return { ...cat, children: updated }
        }

        return { ...cat, children: applyEqual(cat.children) }
      })

      categories = recalculate(categories)
      return snapshot()
    },

    // Reset all progress in all categories (set xpCurrent and level to 0)
    resetProgress() {
      categories = categories.map((c) => ({ ...c, children: zeroAllXpInTree(c.children) }))
      categories = recalculate(categories)
      return snapshot()
    },
  }
}
