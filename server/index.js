/**
 * Express + Lowdb - Backend API REST
 * Crea db.json automáticamente si no existe.
 */
import express from "express"
import cors from "cors"
import bcrypt from "bcryptjs"
import * as db from "./db-lowdb.js"

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: "10mb" }))

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log("[SERVER] GET /api/health - Backend is healthy")
  res.json({ status: "ok", message: "Backend is running", timestamp: new Date().toISOString() })
})

// Accounts login/create
app.post("/api/accounts/login", async (req, res) => {
  try {
    const { id, pin, state, mode } = req.body ?? {}
    if (!id || !pin) return res.status(400).json({ ok: false, error: "missing id or pin" })

    const nid = String(id).trim().toLowerCase()
    console.log("[SERVER] POST /api/accounts/login id=", nid, "mode=", mode || "auto")
    const existing = await db.get("accounts", nid)

    if (existing) {
      if (mode === "create") {
        return res.status(409).json({ ok: false, error: "account_exists", message: "Esa cuenta ya existe. Usa Iniciar sesión." })
      }
      const hash = existing.pinHash ?? existing.pin
      const match = hash ? bcrypt.compareSync(pin, hash) : false
      if (!match) {
        if (req.body?.force) {
          const pinHash = bcrypt.hashSync(pin, 10)
          const acc = { id: nid, pinHash, state: state ?? existing.state ?? null }
          await db.upsert("accounts", acc)
          return res.json({ ok: true, found: false, created: true, replaced: true, state: acc.state })
        }
        return res.status(401).json({ ok: false, error: "invalid_pin" })
      }
      console.log("[SERVER] Account login successful, returning existing state:", existing.state)
      return res.json({ ok: true, found: true, created: false, state: existing.state ?? null })
    }

    if (mode === "login") {
      return res.status(404).json({ ok: false, error: "account_not_found", message: "Cuenta no encontrada. Crea una nueva." })
    }

    const pinHash = bcrypt.hashSync(pin, 10)
    const acc = { id: nid, pinHash, state: state ?? null }
    await db.upsert("accounts", acc)
    console.log("[SERVER] Created account id=", nid, "with initial state", state)
    return res.json({ ok: true, found: false, created: true, state: acc.state })
  } catch (e) {
    console.error("accounts/login failed", e)
    return res.status(500).json({ ok: false, error: "server_error" })
  }
})

app.get("/api/state", async (req, res) => {
  try {
    const st = await db.getState()
    res.json(st)
  } catch (e) {
    console.error("GET /api/state", e)
    res.status(500).json({ error: "Failed to read state" })
  }
})

app.post("/api/state", async (req, res) => {
  try {
    await db.saveState(req.body)
    res.json({ ok: true })
  } catch (e) {
    console.error("POST /api/state", e)
    res.status(500).json({ error: "Failed to write state" })
  }
})

app.get("/api/collections/:name", async (req, res) => {
  try {
    const c = req.params.name
    let items = await db.list(c)
    if (c === "accounts") items = items.filter((i) => i && String(i.id).toLowerCase() !== "simuser")
    res.json(items)
  } catch (e) {
    console.error("GET /api/collections", e)
    res.status(500).json({ error: "failed" })
  }
})

app.get("/api/collections/:name/:id", async (req, res) => {
  try {
    const { name, id } = req.params
    if (name === "accounts" && String(id).toLowerCase() === "simuser") {
      return res.status(404).json({})
    }
    const item = await db.get(name, id)
    if (!item) return res.status(404).json({})
    res.json(item)
  } catch (e) {
    console.error("GET /api/collections/:id", e)
    res.status(500).json({ error: "failed" })
  }
})

app.post("/api/collections/:name", async (req, res) => {
  try {
    const name = req.params.name
    let item = req.body
    if (name === "accounts" && item?.id) {
      const nid = String(item.id).trim().toLowerCase()
      if (nid === "simuser") {
        await db.remove(name, nid)
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
      console.log("[SERVER] POST /api/collections/accounts saving:", JSON.stringify(item).substring(0, 200))
    }
    const saved = await db.upsert(name, item)
    res.json({ ok: true, item: saved })
  } catch (e) {
    console.error("POST /api/collections", e)
    res.status(500).json({ error: "failed" })
  }
})

app.delete("/api/collections/:name/:id", async (req, res) => {
  try {
    const { name, id } = req.params
    await db.remove(name, id)
    res.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/collections", e)
    res.status(500).json({ error: "failed" })
  }
})

app.post("/api/reset", async (req, res) => {
  try {
    const seed = await db.resetToSeed()
    res.json({ ok: true, seed })
  } catch (e) {
    console.error("POST /api/reset", e)
    res.status(500).json({ error: "failed to reset" })
  }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Express+Lowdb on http://0.0.0.0:${PORT} [db.json]`)
  console.log(`Accessible from network at: http://YOUR_IP:${PORT}`)
})
