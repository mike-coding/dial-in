# Docker Operations

This app is deployed on the home server with Docker Compose.

## Server Location

```bash
cd /opt/stacks/dial-in
```

The app is available at:

```text
http://franklinhome:8090
```

The default host port is `8090`. The container still serves Nginx on port `80`; Compose maps host port `8090` to container port `80`.

## Normal Update

Use this after making and pushing code changes from the development machine:

```bash
cd /opt/stacks/dial-in
git pull
docker compose up -d --build
```

This rebuilds changed images and recreates containers as needed. The SQLite database is preserved because it lives in the named Docker volume.

## Compose-Only Update

If only `docker-compose.yml` changed and no application image rebuild is needed:

```bash
cd /opt/stacks/dial-in
git pull
docker compose up -d
```

## Full Restart

Use this when you want an explicit stop before starting the stack again:

```bash
cd /opt/stacks/dial-in
git pull
docker compose down
docker compose up -d --build
```

`docker compose down` removes the containers and network, but it does not remove the named SQLite volume unless `-v` is used.

## Status And Logs

Check running containers:

```bash
docker compose ps
```

Follow logs:

```bash
docker compose logs -f
```

Follow one service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Health Checks

From the server:

```bash
curl -I http://localhost:8090
curl http://localhost:8090/api/health
```

From another machine on the LAN:

```text
http://franklinhome:8090
```

## Port Override

The default published port is `8090`.

To temporarily run on another port:

```bash
DIAL_IN_PORT=8091 docker compose up -d
```

To make a permanent server-specific override, create a `.env` file next to `docker-compose.yml`:

```env
DIAL_IN_PORT=8091
```

## Database Persistence

Compose stores SQLite in the named volume:

```text
dial-in_dial-in-data
```

Inside the backend container, the app uses:

```text
/data/data.db
```

The backend gets this path from:

```env
DATABASE_URL=sqlite:////data/data.db
```

## Copy Local Database To Server

From the Windows development machine, in the repo root:

```powershell
scp .\back-end\instance\data.db mike@franklinhome:/tmp/data.db
```

Then on the server:

```bash
cd /opt/stacks/dial-in
docker compose down
docker run --rm -v dial-in_dial-in-data:/data -v /tmp:/tmp alpine sh -c 'cp /tmp/data.db /data/data.db && ls -lh /data/data.db'
docker compose up -d
curl http://localhost:8090/api/health
```

This overwrites the server database with the local development database.
