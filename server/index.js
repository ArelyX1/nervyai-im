const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')

const app = express()
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
app.use(cors({ origin: allowedOrigin }))
app.use(bodyParser.json({ limit: '10mb' }))

// Use MongoDB when MONGODB_URI is set; otherwise file-based db
const useMongo = !!process.env.MONGODB_URI
const dbSync = require('./db')
const dbMongo = useMongo ? require('./db-mongo') : null // lazy: only loads when MONGODB_URI set

function dbGet(collection, id) {
  return useMongo ? dbMongo.get(collection, id) : Promise.resolve(dbSync.get(collection, id))
}
function dbUpsert(collection, item) {
  return useMongo ? dbMongo.upsert(collection, item) : Promise.resolve(dbSync.upsert(collection, item))
}
function dbList(collection) {
  return useMongo ? dbMongo.list(collection) : Promise.resolve(dbSync.list(collection))
}
function dbRemove(collection, id) {
  return useMongo ? dbMongo.remove(collection, id) : Promise.resolve(dbSync.remove(collection, id))
}
function dbGetState() {
  return useMongo ? dbMongo.getState() : Promise.resolve(dbSync.getState())
}
function dbSaveState(state) {
  return useMongo ? dbMongo.saveState(state) : Promise.resolve(dbSync.saveState(state))
}
function dbResetToSeed() {
  return useMongo ? dbMongo.resetToSeed() : Promise.resolve(dbSync.resetToSeed())
}

// Accounts login/create endpoint: accepts { id, pin, state?, mode? }
// mode: 'login' = must exist (fail if not); 'create' = must not exist (fail if exists)
app.post('/api/accounts/login', async (req, res) => {
  try {
    const { id, pin, state, mode } = req.body || {}
    if (!id || !pin) return res.status(400).json({ ok: false, error: 'missing id or pin' })

    const nid = String(id).trim().toLowerCase()

    console.log('[SERVER] /api/accounts/login request for id=', nid, 'mode=', mode || 'auto')
    const existing = await dbGet('accounts', nid)

    if (existing) {
      const hash = existing.pinHash || existing.pin
      const match = hash ? bcrypt.compareSync(pin, hash) : false
      if (!match) {
        if (req.body && req.body.force) {
          const pinHash = bcrypt.hashSync(pin, 10)
          const acc = { id: nid, pinHash, state: state || existing.state || null }
          await dbUpsert('accounts', acc)
          console.log('[SERVER] /api/accounts/login -> force-overwrote account id=', nid)
          return res.json({ ok: true, found: false, created: true, replaced: true, state: acc.state })
        }
        return res.status(401).json({ ok: false, error: 'invalid_pin' })
      }
      // mode='create' but account exists -> error
      if (mode === 'create') {
        return res.status(409).json({ ok: false, error: 'account_exists', message: 'Esa cuenta ya existe. Inicia sesión.' })
      }
      console.log('[SERVER] /api/accounts/login -> found account, returning state')
      return res.json({ ok: true, found: true, created: false, state: existing.state || null })
    }

    // Account does not exist
    if (mode === 'login') {
      return res.status(404).json({ ok: false, error: 'account_not_found', message: 'Cuenta no encontrada. Crea una nueva.' })
    }

    const pinHash = bcrypt.hashSync(pin, 10)
    const acc = { id: nid, pinHash, state: state || null }
    await dbUpsert('accounts', acc)
    console.log('[SERVER] /api/accounts/login -> created account id=', nid)
    return res.json({ ok: true, found: false, created: true, state: acc.state })
  } catch (e) {
    console.error('accounts/login failed', e)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
})

app.get('/api/state', async (req, res) => {
  try {
    const st = await dbGetState()
    res.json(st)
  } catch (e) {
    console.error('Failed to read state', e)
    res.status(500).json({ error: 'Failed to read state' })
  }
})

app.post('/api/state', async (req, res) => {
  try {
    await dbSaveState(req.body)
    res.json({ ok: true })
  } catch (e) {
    console.error('Failed to write state', e)
    res.status(500).json({ error: 'Failed to write state' })
  }
})

app.get('/api/collections/:name', async (req, res) => {
  const c = req.params.name
  try {
    console.log('[SERVER] GET /api/collections/', c)
    const items = await dbList(c)
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.get('/api/collections/:name/:id', async (req, res) => {
  const { name, id } = req.params
  try {
    console.log('[SERVER] GET /api/collections/', name, id)
    const item = await dbGet(name, id)
    if (!item) return res.status(404).json({})
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.post('/api/collections/:name', async (req, res) => {
  const name = req.params.name
  const item = req.body
  try {
    if (name === 'accounts' && item && item.id) {
      item.id = String(item.id).trim().toLowerCase()
    }
    console.log('[SERVER] POST /api/collections/', name, ' id=', item && item.id)
    const saved = await dbUpsert(name, item)
    res.json({ ok: true, item: saved })
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.delete('/api/collections/:name/:id', async (req, res) => {
  const { name, id } = req.params
  try {
    await dbRemove(name, id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.post('/api/reset', async (req, res) => {
  try {
    console.log('[SERVER] POST /api/reset')
    const seed = await dbResetToSeed()
    res.json({ ok: true, seed })
  } catch (e) {
    res.status(500).json({ error: 'failed to reset' })
  }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}${useMongo ? ' (MongoDB)' : ' (file-based)'}`)
})
