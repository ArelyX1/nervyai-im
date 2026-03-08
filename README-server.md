# Backend Express + Lowdb

Backend minimalista que persiste el estado en **db.json** (Lowdb). Crea el archivo automáticamente si no existe.

## ✅ Persistencia Verificada

La persistencia de datos **está funcionando 100% correctamente**. Los datos se guardan en `db.json` y se restauran correctamente al hacer login.

**Verificado con:**
- ✅ Creación de cuenta con datos iniciales
- ✅ Modificación de datos (XP, tareas, objetivos)
- ✅ Persistencia a través de múltiples ciclos de login
- ✅ Restauración correcta de estado al reabrir la app

Ver `README-PERSISTENCE.md` para detalles completos.

## Instalación y ejecución

```bash
nvm use latest
npm run backend
```

El backend corre en `http://localhost:4001`.

## Migración automática

- Si `db.json` no existe pero `state.json` sí, se migran los datos al crear `db.json`.
- Si no hay ninguno, se usa `seed.json` como base.

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/state | Estado global (skills, tasks, goals, user, settings, accounts) |
| POST | /api/state | Guardar estado global |
| POST | /api/accounts/login | Login o crear cuenta (mode: 'login' \| 'create') |
| GET | /api/collections/:name | Listar colección |
| GET | /api/collections/:name/:id | Obtener item por id |
| POST | /api/collections/:name | Crear/actualizar item |
| DELETE | /api/collections/:name/:id | Eliminar item |
| POST | /api/reset | Resetear a seed.json |

## Uso con el frontend

1. Ejecuta `pnpm dev` (Next.js en 3000) y `pnpm backend` (Express en 4001).
2. En localhost, el frontend usa por defecto `http://localhost:4001/api`.
3. Los datos se cargan al iniciar sesión y se guardan por cuenta en `db.json`.

## Pruebas en terminal

```bash
# Terminal 1: backend
pnpm backend

# Terminal 2: tests
bash server/test-api.sh
```

O manualmente:

```bash
# Crear cuenta
curl -X POST http://localhost:4001/api/accounts/login \
  -H "Content-Type: application/json" \
  -d '{"id":"miuser","pin":"1234","mode":"create"}'

# Obtener datos de la cuenta
curl http://localhost:4001/api/collections/accounts/miuser

# Ver db.json
cat server/db.json | jq .
```

## Reset

```bash
curl -X POST http://localhost:4001/api/reset
```

## Producción

- Usa `pm2` o systemd para mantener el proceso activo.
- Variable `ALLOWED_ORIGIN` para restringir CORS.
