# 🚀 RESUMEN EJECUTIVO - Frontend ↔ Backend Communication

## El Problema (K8s + Cloudflare)

Tu setup actual:
```
Usuario accede: https://frontend.tudominio.com
                    ↓
            Frontend (K8s:30002)
                    ↓
            Intenta: http://localhost:4001/api ❌
                    ↓
            No encuentra el backend porque:
            - localhost = PC del usuario (no existe)
            - Backend está en K8s (diferente red/puerto)
            - CORS bloqueado (puerto 30002 ≠ 40013)
```

---

## La Solución (Ya Implementada)

### 3 Métodos (Elige 1):

#### **Método 1: Meta Tag (Recomendado)** ⭐
```bash
# En Dockerfile o K8s ConfigMap:
NEXT_PUBLIC_BACKEND_URL=https://api.tudominio.com

# Automáticamente en el navegador:
<meta name="backend-url" content="https://api.tudominio.com" />

# Frontend usa esa URL
fetch("https://api.tudominio.com/api/accounts/login")
```

#### **Método 2: Subdominios DNS**
```
frontend.tudominio.com → Frontend (K8s:30002)
api.tudominio.com      → Backend (K8s:40013)

Frontend automáticamente detecta:
- hostname = "frontend.tudominio.com"
- "Ah, es frontend! El backend debe ser: api.tudominio.com"
- fetch("https://api.tudominio.com/api/accounts/login") ✅
```

#### **Método 3: K8s Service Names** (Si ambos en mismo cluster)
```
app-frontend.default.svc.cluster.local → Frontend
app-backend.default.svc.cluster.local  → Backend

Frontend automáticamente detecta:
- hostname = "app-frontend.default.svc.cluster.local"
- "El backend es: app-backend.default.svc.cluster.local"
- fetch("http://app-backend.default.svc.cluster.local:4001/api/accounts/login") ✅
```

---

## Flujo Técnico Simplificado

```
1. Usuario abre navegador en: https://frontend.tudominio.com
   
2. React load (useAppStore hook)
   ├─ Lee window.location.hostname
   ├─ Busca meta tag <meta name="backend-url">
   ├─ Busca localStorage.backendUrl
   ├─ Auto-detecta patrones (frontend→api, etc)
   └─ Determina URL: "https://api.tudominio.com"

3. Usuario crea cuenta: "arelyxl" / "1234"
   
4. Frontend hace REQUEST:
   POST https://api.tudominio.com/api/accounts/login
   {
     id: "arelyxl",
     pin: "1234",
     mode: "create",
     state: {skills, tasks, goals, user, settings}
   }

5. Backend (Express) recibe
   ├─ Valida PIN
   ├─ Crea entrada en db.json
   └─ Retorna state

6. Frontend recibe RESPONSE
   ├─ Aplica state a React
   ├─ Sincroniza adapters
   ├─ Guarda accountId en localStorage
   └─ Muestra dashboard

7. Autosave cada 20s
   POST https://api.tudominio.com/api/collections/accounts
   {id: "arelyxl", state: {...}}
   
8. Backend guarda en db.json
   └─ Datos persistidos ✅

9. Usuario cierra app

10. Usuario reabre app días después
    ├─ React detecta accountId en localStorage
    ├─ GET https://api.tudominio.com/api/collections/accounts/arelyxl
    ├─ Backend retorna el state guardado
    └─ ¡Todos los datos restaurados! ✅
```

---

## Cómo Usar (3 Pasos)

### **PASO 1: Actualizar Variables de Entorno**

```bash
# Opción A: Dockerfile (build time)
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL="https://api.tudominio.com" \
  -t nervyai-frontend:latest .

# Opción B: Docker Compose (desarrollo)
# Ya configurado en docker-compose.yml
# NEXT_PUBLIC_BACKEND_URL: http://backend:4001/api

# Opción C: K8s ConfigMap (production)
kubectl set env deployment/frontend \
  NEXT_PUBLIC_BACKEND_URL=https://api.tudominio.com \
  -n nervyai
```

### **PASO 2: Verificar que Funciona**

```bash
# En navegador, abre DevTools (F12) → Console

# Ver URL que está usando:
localStorage.getItem("backendUrl")
document.querySelector('meta[name="backend-url"]')?.content
window.location.hostname

# Test de conexión:
fetch("https://api.tudominio.com/api/health")
  .then(r => r.json())
  .then(console.log)
```

### **PASO 3: Probar Login**

```bash
# En app:
1. Abre http://frontend.tudominio.com
2. Crea cuenta: usuario="test", PIN="1234"
3. Abre DevTools → Console
4. Deberías ver:
   [HEALTH] Backend is online ✅
   [LOGIN] Login successful
5. Verifica que db.json en backend tiene la cuenta:
   cat server/db.json | jq '.accounts[] | .id'
```

---

## Archivos Creados/Modificados

✅ **src/shared/presentation/use-app-store.ts** (Enhanced auto-detection)
- Ahora detecta: localhost, 192.168.x, 10.x, 172.16-31.x (local)
- Detecta: subdominios (frontend→backend, api.*)
- Detecta: K8s service names (.svc.cluster.local)
- Lee meta tags y localStorage

✅ **app/layout.tsx** (Meta tag injection)
- Inyecta `<meta name="backend-url">` desde env var

✅ **Dockerfile** (Build arg para backend URL)
- ARG NEXT_PUBLIC_BACKEND_URL

✅ **docker-compose.yml** (Desarrollo con red interna)
- NEXT_PUBLIC_BACKEND_URL=http://backend:4001/api

✅ **k8s-deployment.yml** (Production ready)
- 2 replicas frontend + backend
- Ingress con Cloudflare
- ConfigMap para BACKEND_URL

✅ **COMUNICACION_TECNICA.md** (Documentación completa)
- Flujos detallados
- Troubleshooting
- Ejemplos

---

## CHECKLIST para K8s + Cloudflare

- [ ] Dockerfile build con: `--build-arg NEXT_PUBLIC_BACKEND_URL=https://api.tudominio.com`
- [ ] DNS en Cloudflare:
  - [ ] frontend.tudominio.com → K8s Ingress
  - [ ] api.tudominio.com → K8s Ingress
- [ ] CORS en backend:
  - [ ] ALLOWED_ORIGIN="https://frontend.tudominio.com"
- [ ] SSL/TLS en Ingress
- [ ] Verificar en navegador:
  - [ ] `localStorage.getItem("backendUrl")` o meta tag visible
  - [ ] Health check responde en `/api/health`
  - [ ] Console logs muestran Backend ✅
- [ ] Test login:
  - [ ] Crear cuenta
  - [ ] Ver en db.json
  - [ ] Recargar: datos se restauran

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "Backend ❌" en navegador | Revisa DevTools Console → Network → verifica URL |
| CORS error | `ALLOWED_ORIGIN` en backend debe incluir frontend URL |
| "PIN incorrecto" al reentra | Primero crea cuenta (mode="create"), luego login |
| db.json no se actualiza | Verifica permisos archivo + que backend está corriendo |
| Diferentes URLs según dispositivo | Configura meta tag o env var (no hardcodes) |

---

## ¿Más dudas?

Ver: [COMUNICACION_TECNICA.md](./COMUNICACION_TECNICA.md) para:
- Flujo completo de persistencia
- Detalles de cada request/response
- Ejemplos para cada ambiente
- Debugging paso a paso
