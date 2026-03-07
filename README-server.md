Simple backend for persisting app state

This repository contains a tiny Express backend (server/index.js) that stores state in:
- **File** (`server/state.json`) by default
- **MongoDB** when `MONGODB_URI` is set (NoSQL, multi-device sync)

Install deps and run:

```bash
pnpm install
pnpm backend
```

For MongoDB (NoSQL, recommended for production):
```bash
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/nervyai" pnpm backend
```

API:
- GET /api/state -> returns stored JSON
- POST /api/state -> saves JSON body
- POST /api/accounts/login -> login or create account (mode: 'login' | 'create')
- GET/POST /api/collections/:name -> list/upsert collections

Usage notes:
- On the login screen, enter the **Backend URL** (e.g. `http://localhost:4001`) to enable sync. `/api` is added automatically.
- Choose **Iniciar sesión** (login) or **Crear cuenta** (create). Data loads per-session from the backend.
- All state (skills, tasks, goals, user, settings) is stored per-account in NoSQL when using MongoDB.

Production notes:
- The mini-backend stores a single JSON state file (`server/state.json`). Writes are atomic (temp file + rename) to reduce corruption risk.
- Recommended process manager: `pm2` or systemd unit for reliability. Example with pm2:

```bash
# install pm2 globally
pnpm add -g pm2
# start backend with pm2
pm2 start server/index.js --name nervyai-state
```

- Set `ALLOWED_ORIGIN` environment variable to restrict CORS to your frontend origin (e.g., `https://yourdomain.com`).
- To reset the app to a fresh state (all progress zero):
	- Clear browser storage: `localStorage.removeItem('nervyai-app-state')`
	- Call backend reset: `POST http://localhost:4001/api/reset` (or use the `pnpm backend` server and visit the endpoint via curl).

Security and scaling:
- This server is purposely minimal. For production at scale, replace the file-backed db with a real database (Postgres, MongoDB, etc.), add authentication, HTTPS, and backups.
- To deploy on a laptop/server: install Node, clone repo, run `pnpm install` and `pnpm backend`.
