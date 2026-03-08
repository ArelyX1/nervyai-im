/**
 * File-based state DB for Next.js API routes.
 * Uses same server/state.json and server/seed.json as Express backend.
 * Single source of truth when running only `pnpm dev`.
 */

import fs from "fs"
import path from "path"

const ROOT = process.cwd()
const DATA_FILE = path.join(ROOT, "server", "state.json")
const SEED_FILE = path.join(ROOT, "server", "seed.json")

function loadRaw(): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null
    const raw = fs.readFileSync(DATA_FILE, "utf8")
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function saveRaw(obj: Record<string, unknown>): void {
  const tmp = DATA_FILE + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8")
  fs.renameSync(tmp, DATA_FILE)
}

function loadSeed(): Record<string, unknown> {
  try {
    if (!fs.existsSync(SEED_FILE)) {
      return { skills: [], tasks: [], goals: [], user: null, settings: null, accounts: [] }
    }
    const raw = fs.readFileSync(SEED_FILE, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return { ...parsed, accounts: (parsed.accounts as unknown[]) || [] }
  } catch {
    return { skills: [], tasks: [], goals: [], user: null, settings: null, accounts: [] }
  }
}

export const stateDb = {
  getState(): Record<string, unknown> {
    const raw = loadRaw()
    if (raw) return raw
    const seed = loadSeed()
    saveRaw(seed)
    return seed
  },

  saveState(state: Record<string, unknown>): Record<string, unknown> {
    saveRaw(state)
    return state
  },

  resetToSeed(): Record<string, unknown> {
    const seed = loadSeed()
    return this.saveState(seed)
  },

  list(collection: string): unknown[] {
    const st = this.getState()
    const items = st[collection]
    return Array.isArray(items) ? items : []
  },

  get(collection: string, id: string): unknown {
    const items = this.list(collection)
    return items.find((i: unknown) => (i as { id?: string })?.id === id) ?? null
  },

  upsert(collection: string, item: Record<string, unknown>): Record<string, unknown> {
    const st = this.getState()
    const items = [...(this.list(collection) as Record<string, unknown>[])]
    const idx = items.findIndex((i) => i.id === item.id)
    if (idx === -1) items.push(item)
    else items[idx] = { ...items[idx], ...item }
    ;(st as Record<string, unknown[]>)[collection] = items
    saveRaw(st)
    return item
  },

  remove(collection: string, id: string): boolean {
    const st = this.getState()
    const items = (this.list(collection) as Record<string, unknown>[]).filter((i) => i.id !== id)
    ;(st as Record<string, unknown[]>)[collection] = items
    saveRaw(st)
    return true
  },
}
