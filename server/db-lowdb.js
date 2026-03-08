/**
 * Express + Lowdb - Crea db.json automáticamente si no existe.
 * API REST tradicional para persistir datos.
 */
import path from "path"
import { fileURLToPath } from "url"
import { readFileSync, existsSync } from "fs"
import { JSONFilePreset } from "lowdb/node"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.join(__dirname, "db.json")
const SEED_FILE = path.join(__dirname, "seed.json")
const LEGACY_FILE = path.join(__dirname, "state.json")

const defaultData = {
  skills: [],
  tasks: [],
  goals: [],
  user: null,
  settings: null,
  accounts: [],
}

function loadSeed() {
  if (!existsSync(SEED_FILE)) return defaultData
  try {
    const raw = readFileSync(SEED_FILE, "utf8")
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed, accounts: parsed.accounts || [] }
  } catch {
    return defaultData
  }
}

/** Migrate from state.json if db.json doesn't exist */
function getInitialData() {
  if (existsSync(DB_FILE)) return null // db.json exists, Lowdb will load it
  if (!existsSync(LEGACY_FILE)) return loadSeed()
  try {
    const raw = readFileSync(LEGACY_FILE, "utf8")
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed, accounts: parsed.accounts || [] }
  } catch {
    return loadSeed()
  }
}

let dbInstance = null

async function getDb() {
  if (dbInstance) return dbInstance
  const initial = getInitialData() ?? loadSeed()
  dbInstance = await JSONFilePreset(DB_FILE, initial)
  return dbInstance
}

export async function getState() {
  const db = await getDb()
  const data = db.data
  if (!data.accounts) data.accounts = []
  return data
}

export async function saveState(state) {
  const db = await getDb()
  db.data = { ...db.data, ...state }
  await db.write()
  return db.data
}

export async function resetToSeed() {
  const seed = loadSeed()
  const db = await getDb()
  db.data = { ...seed }
  await db.write()
  return db.data
}

export async function list(collection) {
  const st = await getState()
  return st[collection] || []
}

export async function get(collection, id) {
  const items = await list(collection)
  const lookupId = collection === "accounts" ? String(id).trim().toLowerCase() : id
  return items.find((i) => String(i.id).trim().toLowerCase() === lookupId) ?? null
}

export async function upsert(collection, item) {
  const db = await getDb()
  if (!db.data[collection]) db.data[collection] = []
  const items = db.data[collection]
  const id = collection === "accounts" && item.id ? String(item.id).trim().toLowerCase() : item.id
  const idx = items.findIndex((i) => String(i.id).trim().toLowerCase() === id)
  const toSave = { ...item, id }
  if (idx === -1) {
    items.push(toSave)
  } else {
    items[idx] = { ...items[idx], ...toSave }
  }
  await db.write()
  return toSave
}

export async function remove(collection, id) {
  const db = await getDb()
  if (!db.data[collection]) return true
  const lookupId = collection === "accounts" ? String(id).trim().toLowerCase() : id
  db.data[collection] = db.data[collection].filter(
    (i) => String(i.id).trim().toLowerCase() !== lookupId
  )
  await db.write()
  return true
}
