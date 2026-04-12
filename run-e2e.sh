#!/bin/bash
set -e
cd /mnt/user/development/trip-planner

# Build staging with fixed env vars
bash scripts/build-deploy.sh staging

# Deploy to server
ssh root@192.168.0.189 "cd /mnt/user/development/trip-planner && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d"

# Wait for containers
sleep 20

# Verify
curl -s http://192.168.0.189:16198/api/health

# Seed
cd /mnt/user/development/trip-planner && node backend/prisma/seed.js

# Update playwright config for LAN IP
sed -i "s/webHost: '[^']*'/webHost: '192.168.0.189'/" /mnt/user/development/trip-planner/frontend/playwright.config.ts 2>/dev/null
sed -i "s|baseURL: '[^']*'|baseURL: 'http://192.168.0.189:16199'|" /mnt/user/development/trip-planner/frontend/playwright.config.ts 2>/dev/null

# Run tests
cd /mnt/user/development/trip-planner/frontend
PLAYWRIGHT_BASE_URL=http://192.168.0.189:16199 npx playwright test --reporter=list 2>&1
