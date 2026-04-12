# Deployment Guide

This guide covers the build process and deployment of the Trip Planner application.

## Environments

| Env | Method | URL | Image Tag |
|-----|--------|-----|-----------|
| Dev | `npm run dev` | localhost:3000/4000 | - |
| Staging | Docker | `<LAN_IP>:16199` | `:staging` |
| Prod | Docker (Unraid) | plan.eric-hu.com | `:prod` |

## Prerequisites

- Docker & Docker Compose
- Node.js 20+

---

## Development (Local)

```bash
# Start frontend + backend with hot reload
./start-dev.sh

# Access:
# - Frontend: http://localhost:3000
# - Backend:  http://localhost:4000
```

Uses `start-dev.sh` which runs npm scripts directly (not Docker) for hot-reload.

---

## Staging (on this host)

Build and run locally, accessible via LAN IP:

```bash
# 1. Build staging images
bash scripts/build-deploy.sh staging

# 2. Start staging services
ENV=staging docker compose up -d

# 3. Access via LAN IP (e.g., http://192.168.0.189:16199)
```

Ports: frontend 16199, backend 16198, db 16197

---

## Production (Unraid)

Since this machine is a VM on Unraid with shared folder access, you can build and deploy directly.

### 1. Build locally

```bash
bash scripts/build-deploy.sh prod
```

### 2. Deploy on Unraid

```bash
cd /mnt/user/development/trip-planner/dist
./deploy.sh
```

The `deploy.sh` script will:
1. Load the Docker images
2. Start the containers with `ENV=prod docker compose up -d`
3. Run Prisma db push if needed

### 4. Configure Nginx (on Unraid)

If not already configured, add an nginx site for each domain:

**`/mnt/user/appdata/nginx/etc/sites/trip-planner.conf`**:
```nginx
# Frontend: plan.eric-hu.com
server {
    listen 443 ssl http2;
    server_name plan.eric-hu.com;
    
    ssl_certificate /etc/letsencrypt/live/plan.eric-hu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plan.eric-hu.com/privkey.pem;
    
    location / {
        proxy_pass http://192.168.0.8:16199;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend: plan-api.eric-hu.com
server {
    listen 443 ssl http2;
    server_name plan-api.eric-hu.com;
    
    ssl_certificate /etc/letsencrypt/live/plan-api.eric-hu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/plan-api.eric-hu.com/privkey.pem;
    
    location / {
        proxy_pass http://192.168.0.8:16198;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5. Cloudflare DNS

Ensure Cloudflare proxies both domains:
- `plan.eric-hu.com` → 67.254.222.75 (your public IP)
- `plan-api.eric-hu.com` → 67.254.222.75

The browser will call `https://plan-api.eric-hu.com/api` directly (not proxied through frontend).

---

## Build Process Details

### Backend Build

```bash
cd backend
npm install --legacy-peer-deps
npm run build  # TypeScript → optimized JavaScript
```

The production Docker image uses multi-stage build (builder → runner) and runs as non-root user.

### Frontend Build

```bash
cd frontend
npm install --legacy-peer-deps
npm run build  # Next.js standalone output
```

Key optimizations:
- `output: 'standalone'` - Self-contained Docker image
- `swcMinify: true` - Faster minification

### Route Warmup

The build script automatically warms up all routes after building:
- `/`, `/login`, `/dashboard`, `/feed`
- `/friends`, `/messages`, `/notifications`
- `/settings`, `/settings/notifications`
- `/forgot-password`, `/reset-password`
- `/invite`, `/invites/pending`
- `/trip/new`

---

## Environment Variables

Create `.env.staging` or `.env.prod` with:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@db:5432/tripplanner
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Auth
NEXTAUTH_SECRET=your-32-character-secret-key

# URLs (staging uses localhost, prod uses domain)
NEXTAUTH_URL=http://localhost:16199        # or https://plan.eric-hu.com
NEXT_PUBLIC_APP_URL=http://localhost:16199 # or https://plan.eric-hu.com
NEXT_PUBLIC_API_URL=http://localhost:16198/api # or https://plan-api.eric-hu.com/api
```

---

## Managing Deployment

### View logs
```bash
docker compose logs -f
```

### Restart services
```bash
docker compose restart
```

### Update deployment
```bash
# Rebuild and redeploy
ENV=staging docker compose up -d --build
```

### Clear volumes (WARNING: deletes all data)
```bash
docker compose down -v
```

---

## Health Checks

- **Frontend**: `http://localhost:16199` (staging)
- **Backend**: `http://localhost:16198/health`
- **PostgreSQL**: Uses docker healthcheck (`pg_isready`)

---

## Troubleshooting

### Container won't start
```bash
docker compose logs <service>
```

### Database connection issues
```bash
docker compose exec db pg_isready -U postgres
```