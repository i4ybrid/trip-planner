#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Setting up backend infrastructure..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

cd "$PROJECT_ROOT"

echo "🐳 Starting PostgreSQL, Redis, and Mailhog containers..."
docker compose up -d db redis mailhog

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    DB_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -n1)
    if docker exec "$DB_CONTAINER" pg_isready -U postgres &>/dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start. Check docker logs."
        exit 1
    fi
    sleep 1
done

echo "🗄️  Generating Prisma client..."
cd "$PROJECT_ROOT/backend"
npm install
npm run db:generate

echo "🗄️  Running Prisma schema sync (non-destructive)..."
npm run db:push

echo "✅ Backend infrastructure is ready!"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - Mailhog: localhost:1025 (SMTP) / localhost:8025 (UI)"
