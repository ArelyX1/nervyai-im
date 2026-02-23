/**
 * ============================================
 * SKILL ENTITY - Domain Layer (Recursive Tree)
 * ============================================
 * Skills are organized as a recursive N-level
 * tree. Each SkillNode can contain children,
 * which are also SkillNodes - enabling infinite
 * depth (e.g. "Intelecto > Programacion >
 * Frontend > React > Hooks").
 *
 * Categories are the top-level groupings shown
 * on the radar chart. They are dynamic - the
 * user can create, rename, and delete them.
 * ============================================
 */

import { generateUUID } from "@/src/tasks/domain/task.entity"

/** Recursive skill tree node - supports N levels of depth */
export interface SkillNode {
  readonly id: string
  readonly name: string
  readonly level: number       // 0-100
  readonly xpRequired: number
  readonly xpCurrent: number
  readonly children: SkillNode[]
  readonly parentId: string | null
}

/** Top-level skill category displayed on the radar */
export interface SkillCategory {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly color: string
  readonly level: number  // 0-100 - aggregated from children tree
  readonly children: SkillNode[]
}

/** Full snapshot of the user's skill radar */
export interface SkillRadarData {
  readonly categories: SkillCategory[]
  readonly overallLevel: number
}

// ─── RECURSIVE TREE UTILITIES ───────────────────

/** Recursively compute level from the entire subtree */
export function computeNodeLevel(node: SkillNode): number {
  if (node.children.length === 0) {
    return node.xpRequired > 0
      ? Math.round((node.xpCurrent / node.xpRequired) * 100)
      : node.level
  }
  const total = node.children.reduce((sum, c) => sum + computeNodeLevel(c), 0)
  return Math.round(total / node.children.length)
}

/** Compute aggregate level for a category from its children tree */
export function computeCategoryLevel(children: SkillNode[]): number {
  if (children.length === 0) return 0
  const total = children.reduce((sum, c) => sum + computeNodeLevel(c), 0)
  return Math.round(total / children.length)
}

/** Compute overall level across all categories */
export function computeOverallLevel(categories: SkillCategory[]): number {
  if (categories.length === 0) return 0
  const total = categories.reduce((sum, c) => sum + c.level, 0)
  return Math.round(total / categories.length)
}

/** Flatten a node tree into a flat array */
export function flattenTree(nodes: SkillNode[]): SkillNode[] {
  const result: SkillNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

/** Find a node by ID in a recursive tree */
export function findNode(nodes: SkillNode[], id: string): SkillNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Get the breadcrumb path to a node */
export function getNodePath(nodes: SkillNode[], targetId: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.name]
    if (node.id === targetId) return currentPath
    if (node.children.length > 0) {
      const found = getNodePath(node.children, targetId, currentPath)
      if (found) return found
    }
  }
  return null
}

/** Create a new SkillNode with defaults */
export function createSkillNode(
  name: string,
  parentId: string | null = null,
): SkillNode {
  return {
    id: generateUUID(),
    name,
    level: 0,
    xpRequired: 1000,
    xpCurrent: 0,
    children: [],
    parentId,
  }
}

/** Create a new SkillCategory with defaults */
export function createSkillCategory(
  name: string,
  icon: string = "Sparkles",
  color: string = "hsl(185, 100%, 50%)",
): SkillCategory {
  return {
    id: generateUUID()  ,
    name,
    icon,
    color,
    level: 0,
    children: [],
  }
}
