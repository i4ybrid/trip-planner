#!/bin/bash
# Run E2E suite on a dedicated infrastructure and post results to Discord webhook
# Usage: ./run-e2e-and-post.sh

set -e

# --- CONFIGURATION ---
FRONTEND_PORT=13000
BACKEND_PORT=14000
DB_PORT=15432
REDIS_PORT=16379
MAILHOG_SMTP=11025
MAILHOG_UI=18025

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
E2E_DOCKER_COMPOSE="$SCRIPT_DIR/docker-compose.e2e.yml"

# URLs
BASE_URL="http://localhost:$FRONTEND_PORT"
API_URL="http://localhost:$BACKEND_PORT"
DATABASE_URL="postgresql://postgres:postgres@localhost:$DB_PORT/tripplanner_e2e"

# Paths
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKEND_LOG="/tmp/e2e-backend.log"
FRONTEND_LOG="/tmp/e2e-frontend.log"
TEST_OUTPUT="/tmp/e2e-output.txt"
JSON_OUTPUT="/tmp/e2e-results.json"
RESULTS_DIR="$FRONTEND_DIR/test-results"

# Load environment variables from project root .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    # We load them to get DISCORD_WEBHOOK_URL etc, but we will override critical ones
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Override for E2E
export PORT=$BACKEND_PORT
export DATABASE_URL=$DATABASE_URL
export NEXT_PUBLIC_API_URL=$API_URL
export PLAYWRIGHT_BASE_URL=$BASE_URL
export NEXTAUTH_URL=$BASE_URL
export REDIS_URL="redis://localhost:$REDIS_PORT"

# --- DOTENV PROTECTION ---
# Prisma and other tools aggressively load .env files and might ignore our exports.
# We'll temporarily rename them to ensure our environment is clean.
rename_dotenv() {
    [ -f "$PROJECT_ROOT/.env" ] && mv "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.bak" || true
    [ -f "$BACKEND_DIR/.env" ] && mv "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.bak" || true
    [ -f "$FRONTEND_DIR/.env" ] && mv "$FRONTEND_DIR/.env" "$FRONTEND_DIR/.env.bak" || true
}

restore_dotenv() {
    [ -f "$PROJECT_ROOT/.env.bak" ] && mv "$PROJECT_ROOT/.env.bak" "$PROJECT_ROOT/.env" || true
    [ -f "$BACKEND_DIR/.env.bak" ] && mv "$BACKEND_DIR/.env.bak" "$BACKEND_DIR/.env" || true
    [ -f "$FRONTEND_DIR/.env.bak" ] && mv "$FRONTEND_DIR/.env.bak" "$FRONTEND_DIR/.env" || true
}

echo "🚀 Starting E2E dedicated infrastructure..."

# Cleanup trap to ensure we stop everything on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    # Kill backend and frontend if they are running
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    
    # Restore .env files
    restore_dotenv
    
    # Stop docker containers
    docker compose -f "$E2E_DOCKER_COMPOSE" -p tripplanner-e2e down -v
    echo "✅ Cleanup complete."
}
trap cleanup EXIT

# Temporarily rename .env files so they don't interfere
rename_dotenv

# 1. Start Docker Infra
docker compose -f "$E2E_DOCKER_COMPOSE" -p tripplanner-e2e up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    DB_CONTAINER=$(docker compose -f "$E2E_DOCKER_COMPOSE" -p tripplanner-e2e ps -q db-e2e 2>/dev/null || true)
    if [ -n "$DB_CONTAINER" ] && docker exec "$DB_CONTAINER" pg_isready -U postgres &>/dev/null; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start."
        exit 1
    fi
    sleep 1
done

# 2. Setup Database
echo "🗄️  Setting up E2E database..."
cd "$BACKEND_DIR"
# Ensure we use the correct DATABASE_URL for prisma
DATABASE_URL=$DATABASE_URL npm run db:generate
DATABASE_URL=$DATABASE_URL npx prisma db push --accept-data-loss
DATABASE_URL=$DATABASE_URL npm run db:seed

# 3. Start Backend
echo "📡 Starting Backend on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
PORT=$BACKEND_PORT DATABASE_URL=$DATABASE_URL npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# 4. Start Frontend
echo "💻 Starting Frontend on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
# Next.js uses PORT env var for the server port
PORT=$FRONTEND_PORT NEXT_PUBLIC_API_URL=$API_URL NEXTAUTH_URL=$BASE_URL npx next dev -p $FRONTEND_PORT > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

echo "Waiting for servers to be ready..."
# Wait for backend
for i in {1..30}; do
    if curl -s "$API_URL/api/health" > /dev/null; then
        echo "Backend: UP"
        BACKEND_READY=true
        break
    fi
    sleep 1
done
# Wait for frontend
for i in {1..60}; do
    if curl -s "$BASE_URL" > /dev/null; then
        echo "Frontend: UP"
        FRONTEND_READY=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" != true ]; then
    echo "Error: Backend failed to start. Logs:"
    tail -n 20 "$BACKEND_LOG"
    exit 1
fi
if [ "$FRONTEND_READY" != true ]; then
    echo "Error: Frontend failed to start. Logs:"
    tail -n 20 "$FRONTEND_LOG"
    exit 1
fi

echo ""
echo "Running E2E suite..."
cd "$FRONTEND_DIR"

# Clean up old reports
rm -f "$TEST_OUTPUT" "$JSON_OUTPUT"
rm -rf "$FRONTEND_DIR/playwright-report"
rm -rf "$RESULTS_DIR"

# Run Playwright
PLAYWRIGHT_JSON_OUTPUT_NAME="$JSON_OUTPUT" CI=true npx playwright test \
    --workers=4 \
    --reporter=list \
    --reporter=json \
    --output="$RESULTS_DIR" \
    2>&1 | tee "$TEST_OUTPUT"
EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "=== TEST OUTPUT ==="
cat "$TEST_OUTPUT"
echo "=== END OUTPUT ==="
echo ""

# Parse JSON results for detailed per-test breakdown
if [ -f "$JSON_OUTPUT" ]; then
    echo ""
    echo "=== PER-TEST RESULTS (from JSON) ==="
    jq -r '
        .suites[]
        | .suites[]? // .
        | .specs[]
        | "\(.title) [\(.tests[0].status)] \(.tests[0].results[0].duration / 1000 | floor)s :: \(.tests[0].results[0].error // "")"
    ' "$JSON_OUTPUT" 2>/dev/null || echo "(jq parse failed)"
    
    STATS=$(jq "{passed: [.suites[].specs[].tests[] | select(.status == \"passed\")] | length,
                  failed: [.suites[].specs[].tests[] | select(.status == \"failed\")] | length,
                  skipped: [.suites[].specs[].tests[] | select(.status == \"skipped\")] | length}" \
                  "$JSON_OUTPUT" 2>/dev/null)
    PASSED=$(echo "$STATS" | jq -r '.passed' 2>/dev/null || echo "?")
    FAILED=$(echo "$STATS" | jq -r '.failed' 2>/dev/null || echo "0")
    SKIPPED=$(echo "$STATS" | jq -r '.skipped' 2>/dev/null || echo "0")
    TOTAL=$((PASSED + FAILED + SKIPPED))

    echo "Summary: Total=$TOTAL Passed=$PASSED Failed=$FAILED Skipped=$SKIPPED"
fi

# Discord notification logic
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    echo "Posting to Discord..."
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    COLOR=$([ "$FAILED" = "0" ] && echo "3066993" || echo "15158332")
    STATUS_TEXT=$([ "$FAILED" = "0" ] && echo "ALL TESTS PASSING" || echo "TESTS FAILED")

    PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "E2E Test Results (Isolated Infra) — ${TIMESTAMP}",
    "color": ${COLOR},
    "fields": [
      {"name": "Status", "value": "${STATUS_TEXT}", "inline": true},
      {"name": "Passed", "value": "${PASSED}", "inline": true},
      {"name": "Failed", "value": "${FAILED}", "inline": true},
      {"name": "Skipped", "value": "${SKIPPED}", "inline": true}
    ],
    "footer": {"text": "TripPlanner E2E Suite • ${TIMESTAMP}"}
  }]
}
EOF
)
    curl -s -X POST "$DISCORD_WEBHOOK_URL" -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null
fi

echo "Done. Exit code: $EXIT_CODE"
exit $EXIT_CODE
