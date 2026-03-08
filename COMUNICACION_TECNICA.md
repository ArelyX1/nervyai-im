# 🔗 COMUNICACIÓN TÉCNICA FRONT ↔ BACK

## 1️⃣ FLUJO ACTUAL (Localhost/Red Local)

```
NAVEGADOR (window.location.hostname = "localhost" o "192.168.1.17")
    ↓
React Hook: useAppStore()
    ↓
getDefaultBackendUrl()
    ├─ Lee hostname del navegador
    ├─ Si es local/192.168/10.x → "http://hostname:4001/api"
    ├─ Si es remoto/externo → "/api" (proxea Next.js)
    └─ Retorna URL
    ↓
loginAccount(username, pin, mode)
    ├─ fetch(`${url}/api/accounts/login`, {POST})
    ├─ Body: {id, pin, state, mode}
    └─ Response: {ok, found, created, state}
    ↓
Express Backend (Puerto 4001)
    ├─ POST /api/accounts/login
    ├─ Verifica PIN con bcrypt
    ├─ Guarda estado en db.json
    └─ Retorna estado guardado
```

---

## 2️⃣ PROBLEMA CON K8S + CLOUDFLARE

```
Tu Setup Actual:
┌─────────────────────────────────────────┐
│ Cloudflare (DNS + Edge Network)         │
│ ├─ app-frontend.tudominio.com           │
│ └─ K8s:30002 (Frontend Next.js)         │
│    └─ Intenta: http://localhost:4001/api ❌
│       Resultado: No encuentra nada      │
└─────────────────────────────────────────┘
└─ backend-service.k8s:40013 ← Aislado, no accesible
```

### ¿Por qué falla?

1. **Frontend corre en navegador del usuario** → `localhost` es el PC del usuario
2. **Backend en K8s** → `localhost:4001` NO EXISTE en el PC del usuario
3. **K8s Internal Network** → 192.168.x.x es privado, no alcanzable desde Cloudflare
4. **Puerto diferente** → 30002 ≠ 40013 → CORS bloqueado sin proxy

---

## 3️⃣ SOLUCIÓN: 3 MÉTODOS

### **MÉTODO 1: Meta Tag (Recomendado para K8s)**

```bash
# 1. Build la imagen con env var
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL="https://api.tudominio.com" \
  -t my-frontend:latest .

# 2. O en runtime, inyecta via ConfigMap:
kubectl create configmap frontend-config \
  --from-literal=BACKEND_URL="https://api.tudominio.com"

# 3. En deployment, monta:
env:
  - name: NEXT_PUBLIC_BACKEND_URL
    valueFrom:
      configMapKeyRef:
        name: frontend-config
        key: BACKEND_URL
```

**Flujo en navegador:**
```typescript
// app/layout.tsx
<meta name="backend-url" content="https://api.tudominio.com" />

// src/shared/presentation/use-app-store.ts
const metaBackendUrl = document.querySelector('meta[name="backend-url"]')?.getAttribute('content')
// Retorna: "https://api.tudominio.com"
// Luego: fetch("https://api.tudominio.com/api/accounts/login")
```

---

### **MÉTODO 2: Subdominios DNS (Para Cloudflare)**

```
Configuración DNS en Cloudflare:
├─ frontend.tudominio.com → K8s:30002
├─ api.tudominio.com      → K8s:40013
└─ *.tudominio.com        → K8s Ingress

Navegador accede a: https://frontend.tudominio.com
    ↓
useAppStore() detecta:
    - hostname = "frontend.tudominio.com"
    - isLocalNetwork = false
    - Detecta "frontend" en nombre
    - Retorna: "https://api.tudominio.com"
    ↓
fetch("https://api.tudominio.com/api/accounts/login")
    ✅ Funciona!
```

**Código automático (ya implementado):**
```typescript
if (hostname.startsWith("frontend")) {
  const backendUrl = `${protocol}//backend.${hostname.substring("frontend.".length)}`
  // hostname="frontend.tudominio.com" 
  // → backendUrl="https://backend.tudominio.com"
}
```

---

### **MÉTODO 3: Kubernetes Service Names**

```yaml
# deployment.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: app-frontend
spec:
  ports:
    - port: 3000
      targetPort: 3000
  selector:
    app: frontend
---
apiVersion: v1
kind: Service
metadata:
  name: app-backend
spec:
  ports:
    - port: 4001
      targetPort: 4001
  selector:
    app: backend
```

**Flujo:**
```typescript
// Frontend pod accede (si está en mismo namespace)
const backendUrl = "http://app-backend.default.svc.cluster.local:4001/api"

// Detecta automáticamente en useAppStore:
if (hostname.includes(".svc.cluster.local")) {
  const backendHostname = hostname.replace("frontend", "backend")
  // "app-frontend.default.svc.cluster.local" 
  // → "app-backend.default.svc.cluster.local"
}
```

---

## 4️⃣ DETALLES TÉCNICOS DE LAS REQUESTS

### **Request: Crear Cuenta**

```http
POST https://api.tudominio.com/api/accounts/login
Content-Type: application/json
Origin: https://frontend.tudominio.com

{
  "id": "usuario123",
  "pin": "1234",
  "mode": "create",
  "state": {
    "skills": {...},
    "tasks": [...],
    "goals": [...],
    "user": {...},
    "settings": {...}
  }
}
```

### **Response:**

```json
{
  "ok": true,
  "found": false,
  "created": true,
  "state": {
    "skills": {...},
    "tasks": [],
    "goals": [],
    "user": {...},
    "settings": {...}
  }
}
```

**Backend (server/index.js):**
```javascript
app.post("/api/accounts/login", async (req, res) => {
  const { id, pin, state, mode } = req.body
  
  // 1. Valida ID y PIN
  // 2. Lee db.json (Lowdb)
  // 3. Si existe: verifica PIN con bcrypt
  // 4. Si no existe + mode="create": crea nueva cuenta
  // 5. Guarda en db.json
  // 6. Retorna estado
})
```

---

## 5️⃣ FLUJO COMPLETO DE PERSISTENCIA

```
┌─ LOGIN ──────────────────────────────────────────┐
│                                                  │
│ 1. Usuario entra credenciales                    │
│    ├─ username = "arelyxl"                       │
│    ├─ pin = "1234"                               │
│    └─ mode = "login"                             │
│                                                  │
│ 2. Frontend hace request                         │
│    POST /api/accounts/login                      │
│    {id: "arelyxl", pin: "1234", mode: "login"}  │
│                                                  │
│ 3. Backend recibe, valida PIN                    │
│    ├─ Lee db.json                                │
│    ├─ Busca account id="arelyxl"                │
│    ├─ Compara PIN con bcrypt                     │
│    └─ Si coincide → retorna state                │
│                                                  │
│ 4. Frontend recibe state                         │
│    ├─ Aplica a React state                       │
│    ├─ Sincroniza con adapters (skills, tasks)   │
│    ├─ Guarda accountId en localStorage           │
│    └─ Muestra dashboard                          │
│                                                  │
│ 5. Autosave cada 20 segundos                     │
│    POST /api/collections/accounts                │
│    {id: "arelyxl", state: {...}}                 │
│    ├─ Backend actualiza db.json                  │
│    └─ Datos persistidos                          │
│                                                  │
│ 6. User cierra navegador/app                     │
│    └─ accountId en localStorage                  │
│                                                  │
│ 7. User reabre app                               │
│    ├─ useEffect detecta accountId                │
│    ├─ Fetch GET /api/collections/accounts/{id}  │
│    ├─ Backend retorna estado guardado            │
│    └─ Se restauran todos los datos ✅            │
└──────────────────────────────────────────────────┘
```

---

## 6️⃣ CONFIGURACIÓN PARA TU K8S + CLOUDFLARE

### **Opción A: Usando Meta Tag (Más Simple)**

```dockerfile
# Dockerfile
FROM node:25
WORKDIR /app
COPY . .

# Build time
ARG NEXT_PUBLIC_BACKEND_URL=https://api.example.com
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: .
      args:
        NEXT_PUBLIC_BACKEND_URL: https://api.tudominio.com
    ports:
      - "30002:3000"
  
  backend:
    image: node:25
    command: node server/index.js
    ports:
      - "40013:4001"
```

### **Opción B: Ingress + Cloudflare**

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nervyai-ingress
spec:
  rules:
    - host: frontend.tudominio.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 3000
    
    - host: api.tudominio.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 4001
```

**Cloudflare DNS:**
```
frontend.tudominio.com  → CNAME → k8s-cluster.tudominio.com
api.tudominio.com       → CNAME → k8s-cluster.tudominio.com
```

---

## 7️⃣ DEBUGGING EN NAVEGADOR

```javascript
// Abre DevTools (F12) → Console y pega:

// 1. Ver qué URL intenta usar:
localStorage.getItem("backendUrl")  // URL forzada (si existe)
document.querySelector('meta[name="backend-url"]')?.content  // Meta tag
window.location.hostname  // Hostname actual

// 2. Ver último error de conexión:
fetch('https://api.tudominio.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// 3. Forzar URL (temporal):
localStorage.setItem("backendUrl", "https://api.tudominio.com")
location.reload()
```

---

## 8️⃣ CHECKLIST K8S + CLOUDFLARE

- [ ] Frontend accesible: `https://frontend.tudominio.com`
- [ ] Backend accesible: `https://api.tudominio.com`
- [ ] CORS habilitado en backend (`app.use(cors())`)
- [ ] Meta tag o env var configurado
- [ ] SSL/TLS funciona (HTTPS)
- [ ] Health check en `/api/health` responde
- [ ] Navegador console muestra: `[CLIENT] Backend is online ✅`
- [ ] db.json se actualiza con nuevas cuentas

---

## 🔑 PUNTOS CLAVE

| Aspecto | Local | K8s + Cloudflare |
|--------|-------|------------------|
| **Frontend URL** | http://localhost:3000 | https://frontend.tudominio.com |
| **Backend URL** | http://localhost:4001/api | https://api.tudominio.com/api |
| **Auto-detect** | ✅ (puerto 4001 hardcoded) | ✅ (meta tag o hostname) |
| **DB** | db.json local | db.json en container |
| **CORS** | Auto (* permitido) | ✅ Debe estar habilitado |
| **SSL** | No (HTTP) | ✅ Requerido (HTTPS) |
