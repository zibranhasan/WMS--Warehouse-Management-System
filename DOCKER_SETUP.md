# Docker Setup

## Overview

The Warehouse Management System (WMS) can run as a multi-container application using Docker Compose. The stack consists of three services:

| Service | Description |
|---------|-------------|
| **postgres** | PostgreSQL 16 (Alpine) database |
| **backend** | Express 5 + Prisma ORM + Better Auth API server |
| **frontend** | Next.js 16 standalone web application |

All three services are connected via a shared Docker bridge network (`wms-network`). The backend automatically runs Prisma migrations on startup.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2 included with Docker Desktop)
- At least **4 GB of RAM** allocated to Docker (recommended for building Next.js)

No Node.js, npm, or PostgreSQL installation is required on the host machine when using Docker.

---

## Project Docker Structure

```text
WMS- Warehouse Management System/
├── docker-compose.yml
├── .env.docker.example
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── .dockerignore
└── frontend/
    ├── Dockerfile
    └── .dockerignore
```

---

## Environment Configuration

### How it works

Docker Compose reads a `.env` file in the project root for variable substitution in `docker-compose.yml`. The provided `.env.docker.example` is a template containing all required variables with safe placeholder values.

### Setup

1. Copy the example file to `.env` in the project root:

   ```bash
   cp .env.docker.example .env
   ```

2. Edit `.env` and replace placeholder values with real credentials.

### Required variables

| Variable | Purpose | Consumed by |
|----------|---------|-------------|
| `POSTGRES_USER` | PostgreSQL username | postgres, backend |
| `POSTGRES_PASSWORD` | PostgreSQL password | postgres, backend |
| `POSTGRES_DB` | PostgreSQL database name | postgres, backend |
| `BETTER_AUTH_SECRET` | Better Auth session secret (min 32 chars) | backend |
| `ACCESS_TOKEN_SECRET` | JWT access token signing key | backend |
| `REFRESH_TOKEN_SECRET` | JWT refresh token signing key | backend |
| `SUPER_ADMIN_EMAIL` | Initial super admin email | backend |
| `SUPER_ADMIN_PASSWORD` | Initial super admin password | backend |

### Optional / external service variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Browser-facing API URL | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | Browser-facing Socket.IO URL | `http://localhost:5000` |
| `EMAIL_SENDER_SMTP_*` | SMTP email delivery credentials | (placeholder) |
| `CLOUDINARY_*` | Cloudinary image storage credentials | (placeholder) |
| `STRIPE_SECRET_KEY` | Stripe payment processing key | (placeholder) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification secret | (placeholder) |

### Default values for local Docker usage

The `docker-compose.yml` uses variable defaults so that a minimal `.env` works:

- `NODE_ENV` defaults to `production`
- `PORT` is hardcoded to `5000` (backend) and `3000` (frontend)
- `ACCESS_TOKEN_EXPIRES_IN` defaults to `15m`
- `REFRESH_TOKEN_EXPIRES_IN` defaults to `7d`
- `EMAIL_SENDER_SMTP_PORT` defaults to `587`
- `FRONTEND_URL` defaults to `http://localhost:3000`

> **Note:** The backend `DATABASE_URL` is constructed internally by Compose using the `POSTGRES_*` variables. It is not passed through `.env` directly.

---

## Start the Application

### 1. Prepare the environment file

```bash
cp .env.docker.example .env
```

Edit `.env` with your actual credentials before proceeding.

### 2. Build and start the full stack

```bash
docker compose up --build
```

This builds the backend and frontend images, creates the PostgreSQL container, runs migrations, and starts all services.

### 3. Run in detached mode

```bash
docker compose up --build -d
```

---

## Verify the Containers

### Check running containers

```bash
docker compose ps
```

All three services (`wms-postgres`, `wms-backend`, `wms-frontend`) should show status `Up`.

### PostgreSQL health

```bash
docker compose exec postgres pg_isready -U wms_user -d wms_db
```

### Backend status

```bash
docker compose logs backend
```

Look for the migration output and server start confirmation.

### Frontend status

```bash
docker compose logs frontend
```

### View logs for all services

```bash
docker compose logs -f
```

### View logs for a specific service

```bash
docker compose logs -f backend
```

---

## Application URLs

| URL | Access from | Description |
|-----|-------------|-------------|
| `http://localhost:3000` | Browser | Frontend web application |
| `http://localhost:5000` | Browser | Backend API (direct access) |
| `http://localhost:5432` | Host tools | PostgreSQL (for external DB tools) |

### Internal Docker networking

Inside the Docker network, services communicate using their Compose **service names** as hostnames:

| Connection | Hostname | Port |
|------------|----------|------|
| Frontend container → Backend container | `backend` | `5000` |
| Backend container → PostgreSQL container | `postgres` | `5432` |
| Frontend container → PostgreSQL | `postgres` | `5432` |

The frontend's `INTERNAL_API_URL` is hardcoded to `http://backend:5000/api/v1` in `docker-compose.yml`. This is the URL the frontend server uses when making server-side API calls (e.g., `getServerSideProps` or React Server Components). It resolves via Docker DNS, not `localhost`.

The browser-facing `NEXT_PUBLIC_API_URL` defaults to `http://localhost:5000/api/v1` and is used by client-side JavaScript running in the user's browser.

---

## Database and Prisma Migrations

When the backend container starts, the entrypoint script (`backend/docker-entrypoint.sh`) automatically runs:

```bash
npx prisma migrate deploy
```

This applies all pending Prisma migrations to the PostgreSQL database. After migrations complete, the backend server starts.

You do **not** need to run migrations manually. The container handles this on every startup.

---

## Architecture

```text
Browser
   │
   ▼
Frontend (Next.js :3000)
   │  INTERNAL_API_URL → http://backend:5000/api/v1
   ▼
Backend (Express :5000)
   │  DATABASE_URL → postgresql://postgres:5432
   ▼
PostgreSQL (:5432)
```

### External services (configured outside Docker)

The application integrates with several external services that are **not** part of the Docker stack. You must configure valid credentials for each in your `.env` file if you want those features to work:

| Service | Purpose | Variables |
|---------|---------|-----------|
| **Cloudinary** | Image/file upload and storage | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **SMTP** | Transactional email delivery | `EMAIL_SENDER_SMTP_USER`, `EMAIL_SENDER_SMTP_PASS`, `EMAIL_SENDER_SMTP_HOST`, `EMAIL_SENDER_SMTP_PORT`, `EMAIL_SENDER_SMTP_FROM` |
| **Stripe** | Payment processing (configured but currently inactive) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

Redis is **not** part of this Docker stack.

---

## Persistent PostgreSQL Data

The `docker-compose.yml` defines a named Docker volume:

```yaml
volumes:
  postgres_data:
    driver: local
```

This volume is mounted at `/var/lib/postgresql/data` inside the PostgreSQL container. Docker persists the database files in this volume, so your data survives:

- Container restarts (`docker compose restart`)
- Container recreation (`docker compose up --force-recreate`)
- System reboots

The volume is **only** removed when you explicitly delete it.

---

## Stop the Application

### Stop and remove containers

```bash
docker compose down
```

This stops all running containers and removes them, but **preserves** the `postgres_data` volume. Your database data remains intact.

### Remove containers AND database volume

```bash
docker compose down -v
```

> **Warning:** This deletes the `postgres_data` volume and all persisted database data. Use only when you want a completely fresh database.

---

## Rebuild After Code or Docker Changes

### Rebuild a specific service

```bash
docker compose up --build backend
```

or

```bash
docker compose up --build frontend
```

### Rebuild the complete stack

```bash
docker compose up --build
```

The `--build` flag forces Docker to rebuild the images from the Dockerfiles rather than using cached layers.

### Rebuild without cache

```bash
docker compose build --no-cache
docker compose up
```

---

## Fresh Database Reset

To completely reset the database and start from scratch:

```bash
docker compose down -v
docker compose up --build
```

This removes the PostgreSQL volume, recreates all containers, and applies all Prisma migrations to an empty database.

> **Warning:** This is a destructive operation. All local database data will be permanently lost.

---

## Docker Networking

### Service hostnames

| Service | Hostname inside Docker | Port |
|---------|----------------------|------|
| PostgreSQL | `postgres` | `5432` |
| Backend | `backend` | `5000` |
| Frontend | `frontend` | `3000` |

All services are connected to the `wms-network` bridge network.

### URL variables explained

| Variable | Used by | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Frontend (browser) | The API URL that client-side JavaScript in the browser uses to reach the backend. Defaults to `http://localhost:5000/api/v1`. |
| `INTERNAL_API_URL` | Frontend (server-side) | Hardcoded to `http://backend:5000/api/v1`. Used for server-side API calls where the request originates from within the Docker network. |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend (browser) | The Socket.IO URL for real-time events. Defaults to `http://localhost:5000`. |

> **Key distinction:** `NEXT_PUBLIC_*` variables are embedded in the client-side JavaScript bundle and are resolved by the browser. `INTERNAL_API_URL` is resolved by the Next.js server inside the Docker network using Docker DNS.

---

## Production Notes

- **Secrets:** Never commit `.env` files with real credentials to version control. Use a secrets manager or environment injection in production.
- **Database credentials:** Use strong, unique passwords for `POSTGRES_USER` and `POSTGRES_PASSWORD` in production. The defaults in `.env.docker.example` are for local development only.
- **External services:** Cloudinary, SMTP, and Stripe require valid production credentials. The placeholder values in `.env.docker.example` will not work in production.
- **PostgreSQL persistence:** The named Docker volume provides data persistence. For production, consider a managed database service or a dedicated volume backup strategy.
- **Non-root execution:** Both the backend and frontend containers run as the `node` user (non-root) via the Dockerfile `USER node` directive and `su-exec` in the entrypoint.
- **HTTPS / reverse proxy:** The Docker setup exposes plain HTTP. For production, deploy behind a reverse proxy (e.g., Nginx, Traefik) that terminates TLS and forwards traffic to the frontend and backend containers.

---

## Troubleshooting

### Port already in use

```
Bind for 0.0.0.0:5432 failed: port is already allocated
```

Another service (e.g., a local PostgreSQL installation) is using the port. Either stop the conflicting service or change the host port mapping in `docker-compose.yml`.

### PostgreSQL healthcheck failure

```
wms-postgres is unhealthy
```

The backend depends on PostgreSQL being healthy. Check:

```bash
docker compose logs postgres
```

Ensure `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are set correctly in `.env` and match what the backend expects.

### Backend cannot connect to PostgreSQL

```bash
docker compose logs backend | grep -i "database"
```

Verify the PostgreSQL container is healthy first:

```bash
docker compose exec postgres pg_isready -U wms_user -d wms_db
```

The backend constructs its `DATABASE_URL` from the `POSTGRES_*` variables. Ensure they match.

### Prisma migration failure

```bash
docker compose logs backend | grep -i "prisma\|migration"
```

Common causes:
- PostgreSQL is not yet ready when the backend starts (the healthcheck should prevent this)
- The `DATABASE_URL` is incorrect
- Schema changes conflict with existing data

### Frontend cannot reach backend

Open the browser developer console and check for network errors. The frontend's client-side requests use `NEXT_PUBLIC_API_URL` which defaults to `http://localhost:5000/api/v1`. Verify the backend container is running:

```bash
docker compose ps
```

And that the backend is healthy:

```bash
curl http://localhost:5000
```

### Stale Docker image / container

If changes aren't reflected after a rebuild:

```bash
docker compose down
docker compose up --build --force-recreate
```

### Environment variable mismatch

If a service fails to start, check that your `.env` file contains all required variables. Compare against `.env.docker.example`:

```bash
diff .env.docker.example .env
```

---

## Development vs Docker

| Aspect | Local development (`npm run dev`) | Docker Compose |
|--------|-----------------------------------|----------------|
| **Frontend** | `cd frontend && npm install && npm run dev` on `:3000` | Container with production build on `:3000` |
| **Backend** | `cd backend && npm install && npm run dev` on `:5000` | Container with compiled build on `:5000` |
| **PostgreSQL** | Requires a local PostgreSQL installation | Managed by Docker |
| **Migrations** | Manual: `npm run migrate` | Automatic via entrypoint script |
| **Hot reload** | Yes (`tsx watch` / `next dev`) | No (requires rebuild) |
| **Use case** | Day-to-day development | Testing the production-like stack, CI/CD, new developer onboarding |

Docker Compose runs the application in **production mode**. It builds optimized bundles, runs Prisma migrations via `prisma migrate deploy`, and serves the compiled output. It does not support hot reloading.

---

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd "WMS- Warehouse Management System"

# Create your environment file
cp .env.docker.example .env

# Edit .env with your credentials (required)
notepad .env

# Build and start everything
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# Database: localhost:5432
```

To run in the background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```
