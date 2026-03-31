#!/bin/bash

# TripPlanner - Database Reset & Infrastructure Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🧹 Starting fresh: Resetting database and infrastructure..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

cd "$PROJECT_ROOT"

# Ensure infra is up
echo "🐳 Starting PostgreSQL, Redis, and Mailhog..."
docker compose up -d db redis mailhog

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    DB_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -n1)
    if [ -n "$DB_CONTAINER" ] && docker exec "$DB_CONTAINER" pg_isready -U postgres &>/dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start. Check docker logs."
        exit 1
    fi
    sleep 1
done

cd "$PROJECT_ROOT/backend"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo "🔥 Wiping database and applying migrations..."
npm run db:reset

echo "🌱 Seeding database with fresh data..."
npm run db:seed

echo "✨ Success! Database has been reset and seeded."
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - Mailhog: localhost:8025 (Web UI)"
echo ""
echo "You can now start the backend with: npm run dev"
