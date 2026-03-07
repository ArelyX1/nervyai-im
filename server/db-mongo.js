/**
 * MongoDB adapter - NoSQL storage for NervyAI backend
 * Stores all data (skills, tasks, goals, user, settings, accounts) in MongoDB.
 * Uses same interface as db.js for drop-in replacement.
 */

const { MongoClient } = require('mongodb')
const path = require('path')
const fs = require('fs')

let client = null
let db = null

async function getDb() {
  if (db) return db
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI required')
  client = new MongoClient(uri)
  await client.connect()
  const dbName = process.env.MONGODB_DB || 'nervyai'
  db = client.db(dbName)
  console.log('[db-mongo] Connected to MongoDB', dbName)
  return db
}

function loadSeed() {
  const SEED_FILE = path.join(__dirname, 'seed.json')
  if (!fs.existsSync(SEED_FILE)) {
    return { skills: [], tasks: [], goals: [], user: null, settings: null, accounts: [] }
  }
  const raw = fs.readFileSync(SEED_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  return { ...parsed, accounts: parsed.accounts || [] }
}

/** MongoDB-backed DB with async API (same semantics as db.js) */
const dbMongo = {
  async getState() {
    const d = await getDb()
    const coll = d.collection('state')
    const doc = await coll.findOne({ _id: 'global' })
    if (doc && doc.data) return doc.data
    const seed = loadSeed()
    await coll.insertOne({ _id: 'global', data: seed })
    return seed
  },

  async saveState(state) {
    const d = await getDb()
    const coll = d.collection('state')
    await coll.updateOne(
      { _id: 'global' },
      { $set: { data: state } },
      { upsert: true }
    )
    return state
  },

  async resetToSeed() {
    const seed = loadSeed()
    return this.saveState(seed)
  },

  async list(collection) {
    const st = await this.getState()
    return st[collection] || []
  },

  async get(collection, id) {
    const items = await this.list(collection)
    return items.find((i) => i.id === id) || null
  },

  async upsert(collection, item) {
    const st = await this.getState()
    const items = st[collection] || []
    const idx = items.findIndex((i) => i.id === item.id)
    if (idx === -1) {
      items.push(item)
    } else {
      items[idx] = { ...items[idx], ...item }
    }
    st[collection] = items
    await this.saveState(st)
    return item
  },

  async remove(collection, id) {
    const st = await this.getState()
    const items = st[collection] || []
    const filtered = items.filter((i) => i.id !== id)
    st[collection] = filtered
    await this.saveState(st)
    return true
  },
}

module.exports = dbMongo
