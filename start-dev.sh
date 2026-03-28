#!/bin/bash

# Kill existing screen sessions named "frontend" or "backend"
screen -S frontend -X quit 2>/dev/null
screen -S backend -X quit 2>/dev/null

# Kill processes running on ports 3000, 3001, 4000, 4001
for port in 3000 3001 4000 4001; do
    pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null
        echo "Killed process on port $port (PID: $pid)"
    fi
done

# Build frontend fresh (no cache) before starting dev server
# This ensures .next assets are always freshly compiled
cd ./frontend
echo "Building frontend (fresh, no cache)..."
npm run build
echo "Starting frontend dev server..."
screen -dmS frontend npm run dev

# Start backend in a screen session
cd ../backend
screen -dmS backend npm run dev

echo "Frontend and backend started in screen sessions"
