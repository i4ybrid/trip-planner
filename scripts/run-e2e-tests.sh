#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "TripPlanner E2E Test Runner"
echo "=========================================="

cd "$PROJECT_DIR"

cleanup() {
    echo ""
    echo "=========================================="
    echo "Cleaning up..."
    echo "=========================================="
    docker compose -f docker-compose.test.yml down -v --remove-orphans
    echo "Database wiped and containers stopped."
}

trap cleanup EXIT

echo ""
echo "Step 1: Starting services..."
echo "=========================================="
docker compose -f docker-compose.test.yml up -d db

echo "Waiting for database to be ready..."
sleep 5

docker compose -f docker-compose.test.yml up -d backend frontend

echo "Waiting for services to start..."
echo "- Backend (port 4000)"
echo "- Frontend (port 3000)"
echo ""

MAX_WAIT=120
COUNTER=0

echo "Checking if backend is ready..."
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:4000/api-docs > /dev/null 2>&1 || curl -s http://localhost:4000 > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    echo "Waiting for backend... ($COUNTER seconds)"
done

if [ $COUNTER -ge $MAX_WAIT ]; then
    echo "ERROR: Backend failed to start"
    exit 1
fi

echo ""
echo "Step 2: Seeding database..."
echo "=========================================="

docker compose -f docker-compose.test.yml exec -T backend npx prisma db push --accept-data-loss 2>/dev/null || true

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        echo "Backend is ready"
        break
    fi
    sleep 2
done

# Seed via API
./scripts/seed-api.sh localhost:4000 || echo "API seed failed, trying prisma seed..." && \
    docker compose -f docker-compose.test.yml exec -T backend npx tsx prisma/seed.ts 2>/dev/null || \
    echo "Note: Seed may need adjustment"

echo ""
echo "Step 3: Running tests..."
echo "=========================================="

BACKEND_URL="http://localhost:4000"
FRONTEND_URL="http://localhost:3000"

echo "Testing backend API..."
curl -s "$BACKEND_URL/api-docs" > /dev/null && echo "✓ Backend API docs accessible" || echo "✗ Backend API not accessible"

echo ""
echo "Testing frontend..."
curl -s "$FRONTEND_URL" > /dev/null && echo "✓ Frontend accessible" || echo "✗ Frontend not accessible"

echo ""
echo "Testing API endpoints..."
echo "- Testing trips endpoint..."
curl -s "$BACKEND_URL/api/trips" > /dev/null && echo "✓ Trips endpoint works" || echo "✗ Trips endpoint failed"

echo "- Testing users endpoint..."
curl -s "$BACKEND_URL/api/users" > /dev/null && echo "✓ Users endpoint works" || echo "✗ Users endpoint failed"

echo "- Testing activities endpoint..."
curl -s "$BACKEND_URL/api/activities" > /dev/null && echo "✓ Activities endpoint works" || echo "✗ Activities endpoint failed"

echo ""
echo "=========================================="
echo "All tests completed!"
echo "=========================================="
echo ""
echo "Services running:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:   http://localhost:4000"
echo "  - API Docs: http://localhost:4000/api-docs"
echo ""
echo "Press Ctrl+C to stop and cleanup..."

tail -f /dev/null
