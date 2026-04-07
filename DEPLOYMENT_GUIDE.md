# Deployment Guide

This guide covers the build process and deployment of the Trip Planner application to production.

## Architecture

- **Frontend**: Next.js 14 (standalone mode) → `plan.eric-hu.com`
- **Backend**: Node.js/Express → `plan-api.eric-hu.com`
- **Database**: PostgreSQL 15

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Access to DNS for `plan.eric-hu.com` and `plan-api.eric-hu.com`
- SSL certificates (recommended via Let's Encrypt or cloud provider)

## Quick Start

### 1. Build & Deploy

```bash
# Run the full build and deploy script
./scripts/build-deploy.sh
```

This script will:
1. Install dependencies for both frontend and backend
2. Build the backend (TypeScript → optimized JavaScript)
3. Build the frontend (Next.js production build with SWC)
4. Build Docker images for both services
5. Warm up all frontend routes

### 2. Manual Deployment

```bash
# Build images
docker build -f frontend/Dockerfile -t trip-planner-frontend:latest ./frontend
docker build -f backend/Dockerfile -t trip-planner-backend:latest ./backend

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Build Process Details

### Backend Build

The backend uses TypeScript compiled to JavaScript with optimizations:

```bash
cd backend
npm install --legacy-peer-deps
npm run build  # Runs `tsc` with production settings
```

Key optimizations in `tsconfig.json`:
- `incremental: true` - Faster subsequent builds
- `skipLibCheck: true` - Skip type checking of declaration files
- `sourceMap: false` - Disable source maps for smaller bundles

The production Docker image:
- Uses multi-stage build (builder → runner)
- Runs as non-root user (`nextjs`)
- Copies only necessary files to reduce image size

### Frontend Build

The frontend uses Next.js 14 with SWC minification:

```bash
cd frontend
npm install --legacy-peer-deps
npm run build  # Uses next build with standalone output
```

Key optimizations:
- `output: 'standalone'` - Self-contained Docker image
- `swcMinify: true` - Faster minification with SWC
- Static pages are pre-rendered at build time

## Route Warmup

The build script automatically warms up all routes after building to ensure fast first-request times. Routes include:

- `/`, `/login`, `/dashboard`, `/feed`
- `/friends`, `/messages`, `/notifications`
- `/settings`, `/settings/notifications`
- `/forgot-password`, `/reset-password`
- `/invite`, `/invites/pending`
- `/trip/new`
- Dynamic trip routes (warm up on first deploy)

## Environment Variables

Create `.env.prod` with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@db:5432/tripplanner

# Auth
NEXTAUTH_SECRET=your-32-character-secret-key
NEXTAUTH_URL=https://plan.eric-hu.com

# App
NEXT_PUBLIC_APP_URL=https://plan.eric-hu.com
NEXT_PUBLIC_API_URL=https://plan-api.eric-hu.com

# Database credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
```

## DNS Configuration

Configure your DNS provider:

| Record Type | Name | Value |
|-------------|------|-------|
| A | plan.eric-hu.com | Your server IP |
| A | plan-api.eric-hu.com | Your server IP |

## SSL/TLS

For production, enable HTTPS. Options:

1. **nginx reverse proxy** (recommended)
2. **Cloud provider SSL termination** (AWS ALB, CloudFlare)
3. **Let's Encrypt** with Certbot

Example nginx config for SSL termination:

```nginx
server {
    listen 443 ssl http2;
    server_name plan.eric-hu.com;
    
    ssl_certificate /etc/ssl/certs/plan.eric-hu.com.crt;
    ssl_certificate_key /etc/ssl/private/plan.eric-hu.com.key;
    
    location / {
        proxy_pass http://localhost:16199;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name plan-api.eric-hu.com;
    
    ssl_certificate /etc/ssl/certs/plan-api.eric-hu.com.crt;
    ssl_certificate_key /etc/ssl/private/plan-api.eric-hu.com.key;
    
    location / {
        proxy_pass http://localhost:16198;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Managing Deployment

### View logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Scale services
```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Update deployment
```bash
# Rebuild and redeploy
./scripts/build-deploy.sh
docker-compose -f docker-compose.prod.yml up -d --build
```

## Health Checks

- **Frontend**: `http://localhost:16199/api/health` (if configured)
- **Backend**: `http://localhost:16198/health` (if configured)
- **PostgreSQL**: Uses docker healthcheck (`pg_isready`)

## Troubleshooting

### Container won't start
```bash
docker-compose -f docker-compose.prod.yml logs <service>
```

### Database connection issues
```bash
# Check database health
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

### Clear volumes (WARNING: deletes all data)
```bash
docker-compose -f docker-compose.prod.yml down -v
```
