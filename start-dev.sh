#!/bin/bash

# Function to display help message
show_help() {
    echo "Usage: ./start-dev.sh [options]"
    echo ""
    echo "Options:"
    echo "  --build    Build the frontend before starting (runs npm run build && npm run dev)"
    echo "  --help     Show this help message"
    echo ""
    echo "Description:"
    echo "  This script kills existing 'frontend' and 'backend' screen sessions, clears"
    echo "  ports 3000, 3001, 4000, and 4001, and then starts the frontend and backend"
    echo "  in new screen sessions."
    exit 0
}

# Check for help flag
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
fi

BUILD_FRONTEND=false
if [[ "$1" == "--build" ]]; then
    BUILD_FRONTEND=true
fi

# Kill existing screen sessions named "frontend" or "backend"
for session in "frontend" "backend"; do
    screen -ls | grep -E "\.${session}\b" | awk '{print $1}' | xargs -I{} screen -S {} -X quit 2>/dev/null
done

# Kill processes running on ports 3000, 3001, 4000, 4001
for port in 3000 3001 4000 4001; do
    pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null
    fi
done

# Start frontend in a screen session
cd ./frontend
if [ "$BUILD_FRONTEND" = true ]; then
    echo "Starting frontend screen session (build + dev)..."
    screen -dmS frontend bash -c "npm run build && npm run dev"
else
    echo "Starting frontend screen session (dev)..."
    screen -dmS frontend npm run dev
fi

# Start backend in a screen session
cd ../backend
echo "Starting backend screen session (dev)..."
screen -dmS backend npm run dev

if [ "$BUILD_FRONTEND" = true ]; then
    TIMEOUT_MINUTES=20
else
    TIMEOUT_MINUTES=5
fi
TIMEOUT_SECONDS=$((TIMEOUT_MINUTES * 60))
START_TIME=$(date +%s)

echo "Waiting for frontend to boot up on port 3000 (timeout: ${TIMEOUT_MINUTES}m)..."
until curl -s localhost:3000 > /dev/null; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    if [ $ELAPSED -ge $TIMEOUT_SECONDS ]; then
        echo "❌ ERROR: Frontend failed to boot within ${TIMEOUT_MINUTES} minutes."
        exit 1
    fi
    sleep 1
done

echo "🚀 ALL SYSTEMS GO! Frontend ready at http://localhost:3000"
