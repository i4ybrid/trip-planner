# Running TripPlanner

## Quick Start

### Start Everything (Frontend + Backend + Infrastructure)
```bash
cd /mnt/user/development/trip-planner
./start-dev.sh
```

### Infrastructure Only (Docker)
```bash
cd /mnt/user/development/trip-planner
docker compose up -d
# Or: docker-compose up -d (older versions)
```

### Scripts Available
```bash
cd /mnt/user/development/trip-planner/scripts/

# Start frontend only
./start-frontend.sh

# Start backend only  
./start-backend.sh

# Restart everything
./restart.sh

# Run tests
./run-tests.sh
```

## Manual Server Commands

### Frontend (port 16199)
```bash
cd /mnt/user/development/trip-planner/frontend
npm run dev
```

### Backend (port 16198)
```bash
cd /mnt/user/development/trip-planner/backend
npm run dev
```

## Screen Sessions
The dev servers may be running in screen sessions. Check:
```bash
screen -ls
```

Attach to a session:
```bash
screen -r frontend
screen -r backend
```

Detach from session: `Ctrl+A, D`

## Stopping Servers
```bash
# Kill screen sessions
screen -S frontend -X quit
screen -S backend -X quit

# Or kill processes directly
pkill -f "next dev"
pkill -f "node.*backend"
```
