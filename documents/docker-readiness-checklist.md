# Docker Readiness Checklist

Goal: make Dial-In easy to run on a home server with persistent data and minimal host setup.

## Required

- Fix the current frontend build blocker.
  - `npm run build` currently fails because `front-end/src/hooks/useUser.ts` imports unused `UserData`.
  - Docker frontend builds will fail until this is fixed.

- Make frontend API routing Docker-friendly.
  - Current config in `front-end/src/hooks/apiConfig.ts` guesses API host/port from `window.location.hostname`.
  - It also contains a hardcoded Railway URL.
  - Preferred approach: have the frontend call same-origin `/api/...` paths and let Nginx proxy those to the backend.
  - This avoids exposing backend host/port details to browser code.

- Make the SQLite database path configurable.
  - Current backend path in `back-end/database.py` is hardcoded as `sqlite:///./instance/data.db`.
  - Add a `DATABASE_URL` environment variable.
  - Use a Docker-friendly default such as `sqlite:////data/data.db`.
  - Mount `/data` as a persistent Docker volume.

- Add a backend Dockerfile.
  - Install `back-end/requirements.txt`.
  - Run FastAPI with:

```bash
uvicorn app:app --host 0.0.0.0 --port 5000
```

- Add a frontend Dockerfile.
  - Build the Vite app with Node.
  - Serve the built `dist` directory from Nginx.

- Add an Nginx config.
  - Serve the Vite SPA.
  - Fall back to `index.html` for client-side routing.
  - Proxy `/api/` to the backend service.
  - Strip the `/api` prefix before forwarding, since backend routes are currently `/tasks`, `/auth`, `/categories`, etc.

- Add `docker-compose.yml`.
  - Services:
    - `backend`
    - `frontend`
  - Named volume:
    - persistent SQLite data mounted at `/data`

## Recommended

- Add `.dockerignore` files.
  - Exclude `node_modules`, `dist`, `.venv`, `__pycache__`, local DB files, and other generated output.

- Add healthchecks.
  - Backend already exposes `/health`.

- Tighten CORS later.
  - Backend currently allows all origins.
  - If the frontend uses same-origin Nginx proxying, browser CORS should not be needed for normal app traffic.

## Target Home Server Shape

Run the app at:

```text
http://home-server-ip:8080
```

Frontend calls:

```text
/api/tasks
/api/auth/login
/api/categories
```

Nginx forwards internally to:

```text
backend:5000/tasks
backend:5000/auth/login
backend:5000/categories
```

## Implementation Order

1. Fix the TypeScript build error.
2. Replace frontend API host guessing with same-origin `/api` routing.
3. Make backend database URL configurable.
4. Add backend Dockerfile.
5. Add frontend Dockerfile and Nginx config.
6. Add Docker Compose with persistent SQLite volume.
7. Build and test locally.
8. Deploy to the home server.
