/**
 * Express + Lowdb - Backend API REST
 * Crea db.json automáticamente si no existe.
 */
import express from "express"
import cors from "cors"
import bcrypt from "bcryptjs"
import * as db from "./db-lowdb.js"

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json({ limit: "10mb" }))

// Request logging middleware
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "unknown"
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url} from ${clientIP}`)
  next()
})

// Single API router, mounted at / and /api
const apiRouter = express.Router()

// Health check
apiRouter.get("/health", (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || "unknown"
  console.log(`[HEALTH] ✅ GET /health from ${clientIP} - Backend is healthy`)
  res.json({ status: "ok", message: "Backend is running", timestamp: new Date().toISOString(), clientIP })
})

// Accounts login/create
apiRouter.post("/accounts/login", async (req, res) => {
  try {
    const { id, pin, state, mode } = req.body ?? {}
    if (!id || !pin) {
      console.error("[LOGIN] ❌ Missing id or pin")
      return res.status(400).json({ ok: false, error: "missing id or pin" })
    }

    const nid = String(id).trim().toLowerCase()
    console.log("[LOGIN] POST /api/accounts/login - id=", nid, "mode=", mode || "auto")
    const existing = await db.get("accounts", nid)

    if (existing) {
      if (mode === "create") {
        console.error("[LOGIN] ❌ Account exists but trying to create - use login mode")
        return res.status(409).json({
          ok: false,
          error: "account_exists",
          message: "Esa cuenta ya existe. Usa Iniciar sesión.",
        })
      }
      const hash = existing.pinHash ?? existing.pin
      const match = hash ? bcrypt.compareSync(pin, hash) : false
      if (!match) {
        console.error("[LOGIN] ❌ PIN mismatch for account:", nid)
        if (req.body?.force) {
          const pinHash = bcrypt.hashSync(pin, 10)
          const acc = { id: nid, pinHash, state: state ?? existing.state ?? null }
          await db.upsert("accounts", acc)
          console.log("[LOGIN] ✅ Force-reset account:", nid)
          return res.json({ ok: true, found: false, created: true, replaced: true, state: acc.state })
        }
        return res.status(401).json({ ok: false, error: "invalid_pin" })
      }
      console.log("[LOGIN] ✅ Login successful, found account:", nid, "with state keys:", Object.keys(existing.state || {}).join(", "))
      return res.json({ ok: true, found: true, created: false, state: existing.state ?? null })
    }

    if (mode === "login") {
      console.error("[LOGIN] ❌ Account not found but mode=login - use create mode")
      return res.status(404).json({
        ok: false,
        error: "account_not_found",
        message: "Cuenta no encontrada. Crea una nueva.",
      })
    }

    const pinHash = bcrypt.hashSync(pin, 10)
    const acc = { id: nid, pinHash, state: state ?? null }
    await db.upsert("accounts", acc)
    console.log("[LOGIN] ✅ Created new account:", nid, "with initial state")
    return res.json({ ok: true, found: false, created: true, state: acc.state })
  } catch (e) {
    console.error("[LOGIN] ❌ Server error:", e instanceof Error ? e.message : String(e))
    return res.status(500).json({ ok: false, error: "server_error" })
  }
})

// Global shared state
apiRouter.get("/state", async (req, res) => {
  try {
    const st = await db.getState()
    console.log("[STATE] ✅ GET /api/state - returning:", Object.keys(st || {}).join(", "))
    res.json(st)
  } catch (e) {
    console.error("[STATE] ❌ GET /api/state error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "Failed to read state" })
  }
})

apiRouter.post("/state", async (req, res) => {
  try {
    await db.saveState(req.body)
    console.log("[STATE] ✅ POST /api/state - saved successfully")
    res.json({ ok: true })
  } catch (e) {
    console.error("[STATE] ❌ POST /api/state error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "Failed to write state" })
  }
})

// Generic collections CRUD
apiRouter.get("/collections/:name", async (req, res) => {
  try {
    const c = req.params.name
    let items = await db.list(c)
    if (c === "accounts") items = items.filter((i) => i && String(i.id).toLowerCase() !== "simuser")
    console.log("[COLLECTIONS] ✅ GET /api/collections/" + c + " - found " + items.length + " items")
    res.json(items)
  } catch (e) {
    console.error("[COLLECTIONS] ❌ GET error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "failed" })
  }
})

apiRouter.get("/collections/:name/:id", async (req, res) => {
  try {
    const { name, id } = req.params
    if (name === "accounts" && String(id).toLowerCase() === "simuser") {
      console.log("[COLLECTIONS] ✅ GET /api/collections/accounts/" + id + " - simuser not stored")
      return res.status(404).json({})
    }
    const item = await db.get(name, id)
    if (!item) {
      console.log("[COLLECTIONS] ⚠️ GET /api/collections/" + name + "/" + id + " - not found")
      return res.status(404).json({})
    }
    console.log("[COLLECTIONS] ✅ GET /api/collections/" + name + "/" + id + " - found")
    res.json(item)
  } catch (e) {
    console.error("[COLLECTIONS] ❌ GET error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "failed" })
  }
})

apiRouter.post("/collections/:name", async (req, res) => {
  try {
    const name = req.params.name
    let item = req.body
    if (name === "accounts" && item?.id) {
      const nid = String(item.id).trim().toLowerCase()
      if (nid === "simuser") {
        await db.remove(name, nid)
        console.log("[COLLECTIONS] ✅ POST /api/collections/accounts - removed simuser")
        return res.json({ ok: true, item: null })
      }
      // Hash PIN before storing; never persist plain pin
      if (item.pin) {
        const pinHash = bcrypt.hashSync(item.pin, 10)
        item = { ...item, pinHash }
        delete item.pin
      }
      // Normalize the ID
      item.id = nid
      console.log("[COLLECTIONS] ✅ POST /api/collections/accounts - saving account " + nid + " with state keys:", Object.keys(item.state || {}).join(", "))
    }
    const saved = await db.upsert(name, item)
    res.json({ ok: true, item: saved })
  } catch (e) {
    console.error("[COLLECTIONS] ❌ POST error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "failed" })
  }
})

apiRouter.delete("/collections/:name/:id", async (req, res) => {
  try {
    const { name, id } = req.params
    await db.remove(name, id)
    console.log("[COLLECTIONS] ✅ DELETE /api/collections/" + name + "/" + id)
    res.json({ ok: true })
  } catch (e) {
    console.error("[COLLECTIONS] ❌ DELETE error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "failed" })
  }
})

// Reset database to seed
apiRouter.post("/reset", async (req, res) => {
  try {
    const seed = await db.resetToSeed()
    console.log("[RESET] ✅ POST /api/reset - data reset to seed")
    res.json({ ok: true, seed })
  } catch (e) {
    console.error("[RESET] ❌ POST /api/reset error:", e instanceof Error ? e.message : String(e))
    res.status(500).json({ error: "failed to reset" })
  }
})

// Mount router at both / and /api so both styles work
app.use("/api", apiRouter)
app.use("/", apiRouter)

const PORT = process.env.PORT || 4001
const HOST = process.env.HOST || "0.0.0.0"

app.listen(PORT, HOST, () => {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`✅ Backend Express+Lowdb RUNNING`)
  console.log(`   Listening on: ${HOST}:${PORT}`)
  console.log(`   Local: http://localhost:${PORT}`)
  console.log(`   Network: http://${HOST}:${PORT}`)
  console.log(`   Database: ./db.json`)
  console.log(`   CORS: Enabled for all origins`)
  console.log(`${"=".repeat(60)}\n`)
})
