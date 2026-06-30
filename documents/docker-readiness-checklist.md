# Docker Readiness Checklist

Goal: make Dial-In easy to run on a home server with persistent data and minimal host setup.

## Required

- [x] Fix the current frontend build blocker.
  - Original issue: `npm run build` failed because `front-end/src/hooks/useUser.ts` imported unused `UserData`.
  - Current status: `npm run build` passes.

- [x] Make frontend API routing Docker-friendly.
  - Current config in `front-end/src/hooks/apiConfig.ts` guesses API host/port from `window.location.hostname`.
  - It also contains a hardcoded Railway URL.
  - Preferred approach: have the frontend call same-origin `/api/...` paths and let Nginx proxy those to the backend.
  - This avoids exposing backend host/port details to browser code.
  - Current status: frontend defaults to same-origin `/api`; Vite dev server proxies `/api` to `localhost:5000`.

- [x] Make the SQLite database path configurable.
  - Current backend path in `back-end/database.py` is hardcoded as `sqlite:///./instance/data.db`.
  - Add a `DATABASE_URL` environment variable.
  - Use a Docker-friendly default such as `sqlite:////data/data.db`.
  - Mount `/data` as a persistent Docker volume.
  - Current status: backend reads `DATABASE_URL`; Compose sets `sqlite:////data/data.db`.

- [x] Add a backend Dockerfile.
  - Install `back-end/requirements.txt`.
  - Run FastAPI with:

```bash
uvicorn app:app --host 0.0.0.0 --port 5000
```

- [x] Add a frontend Dockerfile.
  - Build the Vite app with Node.
  - Serve the built `dist` directory from Nginx.

- [x] Add an Nginx config.
  - Serve the Vite SPA.
  - Fall back to `index.html` for client-side routing.
  - Proxy `/api/` to the backend service.
  - Strip the `/api` prefix before forwarding, since backend routes are currently `/tasks`, `/auth`, `/categories`, etc.

- [x] Add `docker-compose.yml`.
  - Services:
    - `backend`
    - `frontend`
  - Named volume:
    - persistent SQLite data mounted at `/data`

## Recommended

- [x] Add `.dockerignore` files.
  - Exclude `node_modules`, `dist`, `.venv`, `__pycache__`, local DB files, and other generated output.

- [x] Add healthchecks.
  - Backend already exposes `/health`.

- [ ] Tighten CORS later.
  - Backend currently allows all origins.
  - If the frontend uses same-origin Nginx proxying, browser CORS should not be needed for normal app traffic.

- [ ] Build and test with Docker on a machine with Docker installed.
  - Docker CLI is not currently available in this workspace, so image build and Compose validation still need to be run elsewhere.

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

1. [x] Fix the TypeScript build error.
2. [x] Replace frontend API host guessing with same-origin `/api` routing.
3. [x] Make backend database URL configurable.
4. [x] Add backend Dockerfile.
5. [x] Add frontend Dockerfile and Nginx config.
6. [x] Add Docker Compose with persistent SQLite volume.
7. [ ] Build and test locally with Docker.
8. [ ] Deploy to the home server.
