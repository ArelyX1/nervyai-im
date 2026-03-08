# 🔌 COMUNICACIÓN TÉCNICA - SOLO EL FLUJO

## 1️⃣ CÓMO FRONTEND DESCUBRE LA URL DEL BACKEND

**Ubicación del código:** `src/shared/presentation/use-app-store.ts` → función `getDefaultBackendUrl()`

```typescript
function getDefaultBackendUrl(): string | null {
  // Priority 1: Meta tag HTML
  const metaBackendUrl = document.querySelector('meta[name="backend-url"]')?.getAttribute('content')
  if (metaBackendUrl) return metaBackendUrl
  
  // Priority 2: localStorage (usuario puede forzar URL)
  const stored = localStorage.getItem("backendUrl")
  if (stored) return stored
  
  // Priority 3: Auto-detect local network (localhost, 192.168.x, 10.x)
  if (isLocalNetwork) return `http://${hostname}:4001/api`
  
  // Priority 4: K8s service names (.svc.cluster.local)
  if (hostname.includes(".svc.cluster.local")) {
    return "http://app-backend.default.svc.cluster.local:4001/api"
  }
  
  // Priority 5: DNS subdomain pattern (frontend→api, app→backend)
  if (hostname.startsWith("frontend")) {
    return `https://backend.${hostname.substring("frontend.".length)}`
  }
  
  // Fallback: usar rutas de Next.js
  return "/api"
}
```

**Punto crítico:** El frontend NUNCA hardcodea la URL. Siempre la detecta dinámicamente.

---

## 2️⃣ CÓMO CONFIGURAR DÓNDE ESTÁ TU BACKEND

**Opción 1: Meta Tag (Recomendado)**
```html
<!-- En HTML head -->
<meta name="backend-url" content="https://tu-api.com" />
```

**Opción 2: Environment Variable (Build Time)**
```bash
# Durante build
NEXT_PUBLIC_BACKEND_URL=https://tu-api.com npm run build
```

**Opción 3: localStorage (Runtime)**
```javascript
// En navegador DevTools Console
localStorage.setItem("backendUrl", "https://tu-api.com")
location.reload()
```

**Opción 4: Auto-detect (Sin configurar nada)**
- Si frontend en `192.168.1.17` → busca backend en `http://192.168.1.17:4001/api`
- Si frontend en `frontend.tudominio.com` → busca en `https://backend.tudominio.com/api`

---

## 3️⃣ REQUEST/RESPONSE - LOGIN

### Cuando usuario crea/entra con cuenta:

```
REQUEST:
POST {BACKEND_URL}/api/accounts/login
Content-Type: application/json

{
  "id": "arelyxl",              // username (normalizado a minúsculas)
  "pin": "1234",                // PIN (texto)
  "mode": "create",             // "create" = nueva, "login" = existente
  "state": {                    // Estado inicial (para create)
    "skills": {...},
    "tasks": [],
    "goals": [],
    "user": {...},
    "settings": {...}
  }
}

RESPONSE:
{
  "ok": true,
  "found": true,                // true si ya existía
  "created": false,             // true si se creó
  "state": {                    // Estado guardado en DB
    "skills": {...},
    "tasks": [...],
    "goals": [...],
    "user": {...},
    "settings": {...}
  }
}
```

**QUÉ HACE EL BACKEND:**
1. Lee base de datos (db.json)
2. Busca cuenta con ese ID
3. Si existe: verifica PIN con bcrypt
4. Si no existe + mode="create": crea nueva
5. Guarda en db.json
6. Retorna estado

---

## 4️⃣ REQUEST/RESPONSE - AUTOSAVE (Cada 20 segundos)

```
REQUEST:
POST {BACKEND_URL}/api/collections/accounts
Content-Type: application/json

{
  "id": "arelyxl",
  "state": {
    "skills": {...},
    "tasks": [...],
    "goals": [...],
    "user": {...},
    "settings": {...}
  }
}

RESPONSE:
{
  "ok": true,
  "item": {
    "id": "arelyxl",
    "pinHash": "$2a$10$...",    // bcrypt del PIN
    "state": {...}
  }
}
```

**QUÉ HACE EL BACKEND:**
1. Lee id y state
2. Busca cuenta en db.json
3. Actualiza el state
4. Guarda db.json
5. Retorna confirmación

---

## 5️⃣ REQUEST/RESPONSE - RECUPERAR DATOS AL REENTRA

```
REQUEST:
GET {BACKEND_URL}/api/collections/accounts/{id}
// Ejemplo: GET https://api.tudominio.com/api/collections/accounts/arelyxl

RESPONSE:
{
  "id": "arelyxl",
  "pinHash": "$2a$10$...",
  "state": {
    "skills": {...},
    "tasks": [
      {
        "id": "task1",
        "title": "Aprender React",
        "completed": true,
        "reward_xp": 100
      }
    ],
    "goals": [...],
    "user": {...},
    "settings": {...}
  }
}
```

**QUÉ HACE EL BACKEND:**
1. Lee el id de la URL
2. Busca en db.json
3. Retorna toda la cuenta

---

## 6️⃣ FLUJO COMPLETO DE PERSISTENCIA

```
┌─ SESIÓN 1 ──────────────────────────────────────────────┐
│                                                          │
│ Usuario abre app → Crea cuenta "arelyxl" PIN "1234"     │
│                                                          │
│ Frontend POST /api/accounts/login                        │
│ ├─ Backend crea entrada en db.json                      │
│ ├─ Hashea PIN con bcrypt                                │
│ └─ Guarda: {id: "arelyxl", pinHash: "$2a$...", ...}    │
│                                                          │
│ Usuario agrega tareas, skills, etc                      │
│                                                          │
│ Frontend POST /api/collections/accounts (autosave 20s) │
│ ├─ Backend lee id="arelyxl"                             │
│ ├─ Actualiza state en db.json                           │
│ └─ Guarda todos los cambios                             │
│                                                          │
│ Usuario cierra app → localStorage guarda accountId      │
└──────────────────────────────────────────────────────────┘

PASAN DÍAS...

┌─ SESIÓN 2 ──────────────────────────────────────────────┐
│                                                          │
│ Usuario reabre app → Entra login "arelyxl" PIN "1234"   │
│                                                          │
│ Frontend POST /api/accounts/login (mode="login")        │
│ ├─ Backend verifica PIN con bcrypt                      │
│ ├─ Lee estado guardado en db.json                       │
│ └─ Retorna: {ok: true, found: true, state: {...}}      │
│                                                          │
│ Frontend recibe state                                   │
│ ├─ Carga todas las tareas que completó                  │
│ ├─ Carga todos los skills que ganó XP                   │
│ ├─ Carga todos los goals                                │
│ └─ ¡Está exactamente como lo dejó! ✅                   │
│                                                          │
│ Continúa trabajando...                                  │
│ Autosave sigue guardando cada 20s                       │
└──────────────────────────────────────────────────────────┘
```

---

## 7️⃣ PUNTOS CRÍTICOS DEL FLUJO

### Problema: "PIN incorrecto" al reentra

**Causa:** Frontend está usando `/api` (Next.js) en lugar de tu backend Express

```
Correcto:
POST https://API.TUDOMINIO.COM/api/accounts/login

Incorrecto:
POST https://frontend.tudominio.com/api/accounts/login
  → Next.js busca endpoint interno
  → No encuentra lógica de bcrypt
```

**Solución:** Asegurar que `{BACKEND_URL}` apunta a tu Express backend, no a Next.js

---

### Problema: Data no persiste entre sesiones

**Causa:** Frontend no está enviando estado al backend

```
Incorrecto:
POST /api/collections/accounts
{
  "id": "arelyxl"
  // Falta "state"
}

Correcto:
POST /api/collections/accounts
{
  "id": "arelyxl",
  "state": {
    "skills": {...},
    "tasks": [...],
    "goals": [...]
  }
}
```

---

### Problema: "Backend ❌" en navegador

**Causa:** Frontend no puede llegar al endpoint `/api/health`

```
// En navegador, DevTools Console:

// Ver qué URL intenta usar:
document.querySelector('meta[name="backend-url"]')?.content
localStorage.getItem("backendUrl")
window.location.hostname

// Verificar que endpoint existe:
fetch("https://TU-API.COM/api/health")
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## 8️⃣ DONDE ESTÁ EL CÓDIGO

**Frontend (Detecta URL + hace requests):**
```
src/shared/presentation/use-app-store.ts
├─ getDefaultBackendUrl() → Detecta URL
├─ loginAccount() → POST /api/accounts/login
├─ saveToServer() → POST /api/collections/accounts
└─ fetchFromServer() → GET /api/collections/accounts/{id}
```

**Backend (Recibe requests + guarda en db.json):**
```
server/index.js
├─ POST /api/accounts/login → Crear/loguear
├─ POST /api/collections/accounts → Guardar estado
├─ GET /api/collections/accounts/{id} → Recuperar estado
└─ GET /api/health → Health check
```

---

## 9️⃣ VARIABLES DE ENTORNO QUE CONTROLAN TODO

```
NEXT_PUBLIC_BACKEND_URL
  ↓
Inyectada en: app/layout.tsx
  ↓
Leída en: getDefaultBackendUrl()
  ↓
Usada en todos los fetch() del frontend
  ↓
Determina a qué servidor apunta todo
```

**Si no está configurada:**
- Localhost → `http://localhost:4001/api`
- Red interna → `http://192.168.x.x:4001/api`
- Externa → `/api` (Next.js)

---

## 🔟 RESUMÉN ULTRA-SIMPLE

| Paso | Frontend | Backend |
|------|----------|---------|
| 1 | Lee: ¿Dónde está el backend? | - |
| 2 | POST login → "arelyxl" / "1234" | Lee db.json |
| 3 | - | Verifica PIN con bcrypt |
| 4 | - | Crea/busca cuenta |
| 5 | - | Guarda en db.json |
| 6 | Recibe state | Retorna state |
| 7 | Muestra dashboard | - |
| 8 | Cada 20s: POST /collections/accounts | Actualiza db.json |
| 9 | Usuario cierra app | - |
| ... | ... | Días pasan... |
| 10 | Reabre app → POST login | Lee db.json |
| 11 | - | Retorna estado guardado |
| 12 | Carga todos los datos | - |
| ✅ | Datos restaurados | - |

---

## 🎯 LO QUE NECESITAS HACER TÚ

1. **Configura dónde está tu backend:**
   - Meta tag, env var, o déjalo auto-detectar

2. **Asegúrate que tu backend:**
   - Escucha en `0.0.0.0` (no localhost)
   - Tiene endpoint `/api/accounts/login`
   - Tiene endpoint `/api/collections/accounts` (POST)
   - Tiene endpoint `/api/collections/accounts/{id}` (GET)
   - Hashea PIns con bcrypt
   - Persiste en db.json

3. **Que todos los endpoints retornen JSON con `ok: true/false`**

4. **CORS habilitado** para que frontend pueda hacer requests

Listo. El frontend automáticamente hará el resto.
