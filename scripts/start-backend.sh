#!/bin/bash

# Backend startup script with Docker database check

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting TripPlanner Backend..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if database container is running
DB_CONTAINER=$(docker ps --filter "name=db" --filter "status=running" --format "{{.Names}}" 2>/dev/null || echo "")

if [ -z "$DB_CONTAINER" ]; then
    echo "🐳 Database container not running. Starting PostgreSQL..."
    cd "$PROJECT_ROOT"
    docker-compose up -d db
    
    echo "⏳ Waiting for database to be healthy..."
    for i in {1..30}; do
        if docker exec $(docker ps --filter "name=db" --format "{{.Names}}" | head -n1) pg_isready -U postgres &>/dev/null; then
            echo "✅ Database is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Database failed to start. Check docker logs."
            exit 1
        fi
        sleep 1
    done
else
    echo "✅ Database container is already running ($DB_CONTAINER)"
fi

# Change to backend directory and start
cd "$PROJECT_ROOT/backend"

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Running database migrations..."
npm run db:migrate

echo "🌱 Seeding database..."
npm run db:seed

echo "🚀 Starting backend server..."
npm run dev
