const fs = require('fs')
const path = require('path')

const DATA_FILE = path.join(__dirname, 'state.json')
const SEED_FILE = path.join(__dirname, 'seed.json')

function loadRaw() {
  if (!fs.existsSync(DATA_FILE)) return null
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('db: failed to parse state.json', e)
    return null
  }
}

function saveRaw(obj) {
  // atomic write: write to temp file then rename
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8')
  fs.renameSync(tmp, DATA_FILE)
}

function loadSeed() {
  if (!fs.existsSync(SEED_FILE)) return { skills: [], tasks: [], goals: [], user: null, settings: null }
  try {
    const raw = fs.readFileSync(SEED_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('db: failed to parse seed.json', e)
    return { skills: [], tasks: [], goals: [], user: null, settings: null }
  }
}

module.exports = {
  getState() {
    const raw = loadRaw()
    if (raw) return raw
    const seed = loadSeed()
    saveRaw(seed)
    return seed
  },

  saveState(state) {
    saveRaw(state)
    return state
  },

  resetToSeed() {
    const seed = loadSeed()
    saveRaw(seed)
    return seed
  },

  // Simple collection helpers treat top-level keys as collections
  list(collection) {
    const st = this.getState()
    return st[collection] || []
  },

  get(collection, id) {
    const items = this.list(collection)
    return items.find((i) => i.id === id)
  },

  upsert(collection, item) {
    const st = this.getState()
    const items = st[collection] || []
    const idx = items.findIndex((i) => i.id === item.id)
    if (idx === -1) {
      items.push(item)
    } else {
      items[idx] = { ...items[idx], ...item }
    }
    st[collection] = items
    saveRaw(st)
    return item
  },

  remove(collection, id) {
    const st = this.getState()
    const items = st[collection] || []
    const filtered = items.filter((i) => i.id !== id)
    st[collection] = filtered
    saveRaw(st)
    return true
  },
}
