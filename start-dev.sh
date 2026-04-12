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
    echo "  ports 16199, 16198, 3000, 3001, 4000, and 4001, and then starts the frontend and backend"
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

# Create logs directory if it doesn't exist
mkdir -p logs
touch logs/frontend.log logs/backend.log

# Kill existing screen sessions named "frontend" or "backend"
for session in "frontend" "backend"; do
    screen -ls | grep -E "\.${session}\b" | awk '{print $1}' | xargs -I{} screen -S {} -X quit 2>/dev/null
done

# Kill processes running on ports 3000, 3001, 4000, 4001
for port in 3000 3001 4000 4001 16199 16198; do
    pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null
    fi
done

# Start frontend in a screen session
cd ./frontend
# Enable polling for Next.js (useful for shared folders/VMs)
export WATCHPACK_POLLING=true
if [ "$BUILD_FRONTEND" = true ]; then
    echo "Starting frontend screen session (build + dev)..."
    screen -dmS frontend bash -c "export WATCHPACK_POLLING=true && (npm run build && npm run dev) 2>&1 | tee ../logs/frontend.log"
else
    echo "Starting frontend screen session (dev)..."
    screen -dmS frontend bash -c "export WATCHPACK_POLLING=true && npm run dev 2>&1 | tee ../logs/frontend.log"
fi

# Start backend in a screen session
cd ../backend
echo "Starting backend screen session (dev)..."
screen -dmS backend bash -c "npm run dev 2>&1 | tee ../logs/backend.log"

# Return to root
cd ..

if [ "$BUILD_FRONTEND" = true ]; then
    TIMEOUT_MINUTES=20
else
    TIMEOUT_MINUTES=5
fi
TIMEOUT_SECONDS=$((TIMEOUT_MINUTES * 60))
START_TIME=$(date +%s)

echo "Waiting for services to boot up (tailing logs)..."
echo "- Frontend (port 3000)"
echo "- Backend (port 4000)"
echo "---------------------------------------------------"

# Tail logs in the background to show progress in the console
tail -f logs/frontend.log logs/backend.log &
TAIL_PID=$!

# Trap to ensure tail is killed if script is interrupted
trap "kill $TAIL_PID 2>/dev/null; exit" INT TERM EXIT

while true; do
    FRONTEND_READY=false
    BACKEND_READY=false
    
    if curl -s localhost:3000 > /dev/null; then
        FRONTEND_READY=true
    fi
    
    if curl -s localhost:4000/health > /dev/null || curl -s localhost:4000 > /dev/null; then
        BACKEND_READY=true
    fi
    
    if [ "$FRONTEND_READY" = true ] && [ "$BACKEND_READY" = true ]; then
        break
    fi
    
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    if [ $ELAPSED -ge $TIMEOUT_SECONDS ]; then
        kill $TAIL_PID 2>/dev/null
        echo "❌ ERROR: Services failed to boot within ${TIMEOUT_MINUTES} minutes."
        [ "$FRONTEND_READY" = false ] && echo "   - Frontend is NOT responding on port 3000"
        [ "$BACKEND_READY" = false ] && echo "   - Backend is NOT responding on port 4000"
        exit 1
    fi
    sleep 2
done

# Kill tail once ready
kill $TAIL_PID 2>/dev/null
# Clean up trap
trap - INT TERM EXIT

echo "---------------------------------------------------"
echo "🚀 ALL SYSTEMS GO!"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:4000"
