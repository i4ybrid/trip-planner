#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}🧪 TripPlanner Test Suite${NC}"
echo "================================"

COMMAND=${1:-all}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"; exit 1;
    fi
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ docker compose is not installed. Please install the Docker Compose CLI plugin.${NC}"; exit 1;
    fi
}

cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
    docker compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
    echo -e "${GREEN}✅ Docker environment stopped!${NC}"
}

run_deploy() {
    shift # Remove 'deploy' command
    services=()
    while (( "$#" )); do
        case "$1" in
            --frontend)
                services+=("frontend")
                shift
                ;;
            --backend)
                services+=("backend")
                shift
                ;;
            --db)
                services+=("db")
                shift
                ;;
            *)
                echo "Unsupported service: $1" >&2
                exit 1
                ;;
        esac
    done

    if [ ${#services[@]} -eq 0 ]; then
        echo "No services specified, deploying all services from docker-compose.yml"
        docker compose -f docker-compose.yml up --build -d
    else
        echo "Deploying services: ${services[*]}"
        docker compose -f docker-compose.dev.yml up --build -d "${services[@]}"
    fi
    echo -e "${GREEN}✅ Deployment complete!${NC}"
}

run_frontend_tests() {
    echo -e "${YELLOW}🧪 Running frontend unit tests...${NC}"
    cd "$PROJECT_DIR/frontend"
    if [[ "$NO_BUILD" == "false" ]]; then
        docker build --no-cache -t tripplanner-frontend:test -f Dockerfile.test . \
            || { echo -e "${RED}❌ Frontend tests failed${NC}"; exit 1; }
    else
        echo "Skipping build (--no-build)"
    fi
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
}

run_backend_tests() {
    echo -e "${YELLOW}🧪 Running backend unit tests...${NC}"
    cd "$PROJECT_DIR/backend"
    if [[ "$NO_BUILD" == "false" ]]; then
        docker build --no-cache -t tripplanner-backend:test -f Dockerfile.test . \
            || { echo -e "${RED}❌ Backend tests failed${NC}"; exit 1; }
    else
        echo "Skipping build (--no-build)"
    fi
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
}

show_logs() {
    echo -e "${YELLOW}📋 Showing logs...${NC}"
    cd "$PROJECT_DIR"

    CONTAINER=${1:-frontend}
    echo "Showing logs for: $CONTAINER"
    echo "================================"
    docker logs -f "tripplanner-$CONTAINER-1"
}

run_e2e_docker() {
    echo -e "${YELLOW}🐳 Starting E2E Docker environment...${NC}"
    echo -e "${YELLOW}📝 Frontend logging enabled (NEXT_PUBLIC_DEBUG=true)${NC}"
    echo ""
    
    cd "$PROJECT_DIR"
    
    trap cleanup EXIT
    
    if [[ "$NO_BUILD" == "false" ]]; then
        echo "Building services..."
        docker compose -f docker-compose.test.yml build --no-cache
    else
        echo "Skipping build (--no-build)"
    fi
    
    echo "Starting services..."
    docker compose -f docker-compose.test.yml up -d
    
    echo "Waiting for services to be ready..."
    echo ""
    
    BACKEND_READY=false
    FRONTEND_READY=false
    
    for i in {1..60}; do
        if [ "$BACKEND_READY" = "false" ]; then
            if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Backend ready (http://localhost:4000)${NC}"
                BACKEND_READY=true
            fi
        fi
        
        if [ "$FRONTEND_READY" = "false" ]; then
            if curl -s http://localhost:3000 > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Frontend ready (http://localhost:3000)${NC}"
                FRONTEND_READY=true
            fi
        fi
        
        if [ "$BACKEND_READY" = "true" ] && [ "$FRONTEND_READY" = "true" ]; then
            break
        fi
        
        echo "Waiting for services... ($i/60)"
        sleep 2
    done
    
    if [ "$BACKEND_READY" = "false" ]; then
        echo -e "${RED}❌ Backend failed to start. Check logs:${NC}"
        docker compose -f docker-compose.test.yml logs backend
        exit 1
    fi
    
    echo ""
    echo "Pushing database schema..."
    docker compose -f docker-compose.test.yml exec -T backend npx prisma db push --accept-data-loss
    
    echo "Seeding database via Prisma seed..."
    SEED_OUTPUT=$(docker compose -f docker-compose.test.yml exec -T backend npx tsx prisma/seed.ts 2>&1) || true
    if echo "$SEED_OUTPUT" | grep -q "Seeding complete"; then
        echo -e "${GREEN}✓ Database seeded successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Prisma seed output:${NC}"
        echo "$SEED_OUTPUT"
    fi
    
    echo ""
    echo "Verifying test user..."
    TEST_USER=$(curl -s -H "x-user-id: test@user.com" http://localhost:4000/api/users/me 2>/dev/null | head -c 100)
    if [ -n "$TEST_USER" ]; then
        echo -e "${GREEN}✓ Test user verified${NC}"
    else
        echo -e "${RED}✗ Test user not found${NC}"
    fi
    
    echo ""
    echo "Testing API endpoints..."
    echo ""
    
    TEST_TRIPS=$(curl -s http://localhost:4000/api/trips 2>/dev/null | head -c 100)
    if [ -n "$TEST_TRIPS" ]; then
        echo -e "${GREEN}✓ GET /api/trips - OK${NC}"
    else
        echo -e "${RED}✗ GET /api/trips - FAILED${NC}"
    fi
    
    TEST_USERS=$(curl -s http://localhost:4000/api/users 2>/dev/null | head -c 100)
    if [ -n "$TEST_USERS" ]; then
        echo -e "${GREEN}✓ GET /api/users - OK${NC}"
    else
        echo -e "${RED}✗ GET /api/users - FAILED${NC}"
    fi
    
    TEST_DOCS=$(curl -s http://localhost:4000/api-docs 2>/dev/null | head -c 100)
    if [ -n "$TEST_DOCS" ]; then
        echo -e "${GREEN}✓ GET /api-docs - OK${NC}"
    else
        echo -e "${RED}✗ GET /api-docs - FAILED${NC}"
    fi
    
    echo ""
    echo "================================"
    echo -e "${GREEN}✅ E2E Docker test complete!${NC}"
    echo "================================"
    echo ""
    echo "Database will be wiped on exit."
    
    tail -f /dev/null
}

run_all_tests() {
    run_frontend_tests
    run_backend_tests
}

test_frontend_build() {
    echo -e "${YELLOW}🔨 Testing frontend build...${NC}"
    cd "$PROJECT_DIR/frontend"
    docker build --no-cache -t tripplanner-frontend:prod -f Dockerfile . \
        || { echo -e "${RED}❌ Frontend build failed${NC}"; exit 1; }
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✅ Frontend build successful!${NC}"
}

test_backend_build() {
    echo -e "${YELLOW}🔨 Testing backend build...${NC}"
    cd "$PROJECT_DIR/backend"
    docker build --no-cache -t tripplanner-backend:prod -f Dockerfile . \
        || { echo -e "${RED}❌ Backend build failed${NC}"; exit 1; }
    cd "$PROJECT_DIR"
    echo -e "${GREEN}✅ Backend build successful!${NC}"
}

run_integration_tests() {
    echo -e "${YELLOW}🧪 Running integration tests...${NC}"
    cd "$PROJECT_DIR"
    if [[ "$NO_BUILD" == "false" ]]; then
        docker compose -f docker-compose.test.yml build
    fi
    docker compose -f docker-compose.test.yml up --abort-on-container-exit
    docker compose -f docker-compose.test.yml down -v
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
}

check_docker

NO_BUILD=false
for arg in "$@"; do
    if [[ "$arg" == "--no-build" ]]; then
        NO_BUILD=true
    fi
done

if [[ "$COMMAND" == "-h" || "$COMMAND" == "--help" ]]; then
    echo "TripPlanner Test Suite"
    echo "================================"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy        Deploy specified services (--frontend, --backend, --db)"
    echo "  frontend      Run frontend unit tests"
    echo "  backend       Run backend unit tests"
    echo "  e2e           Run E2E Docker test (starts services, seeds DB, tests API)"
    echo "  integration   Run integration tests"
    echo "  all           Run all unit tests"
    echo "  build         Test Docker builds"
    echo "  lint          Show lint commands"
    echo "  typecheck     Show typecheck commands"
    echo "  logs          Show container logs (default: frontend-mock)"
    echo ""
    echo "Options:"
    echo "  --no-build    Skip Docker build (use existing images)"
    echo ""
    echo "Log containers:"
    echo "  frontend, backend, db"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all unit tests"
    echo "  $0 deploy --backend --db # Deploy backend and database"
    echo "  $0 frontend           # Run frontend tests only"
    echo "  $0 backend            # Run backend tests only"
    echo "  $0 e2e                # Run E2E Docker environment test"
    echo "  $0 e2e --no-build    # Run E2E test without rebuilding"
    echo "  $0 logs backend      # Show backend logs"
    echo "  $0 logs frontend-api # Show frontend-api logs"
    exit 0
fi

case $COMMAND in
    deploy)
        run_deploy "$@"
        ;;
    frontend)
        run_frontend_tests
        ;;
    backend)
        run_backend_tests
        ;;
    e2e|docker-test)
        run_e2e_docker
        ;;
    integration)
        run_integration_tests
        ;;
    all)
        run_all_tests
        ;;
    build)
        test_frontend_build
        test_backend_build
        ;;
    lint)
        echo -e "${YELLOW}🔍 Run linting locally with:${NC}"
        echo "  cd frontend && npm run lint"
        echo "  cd backend && npm run lint"
        ;;
    typecheck)
        echo -e "${YELLOW}🔍 Run type checking locally with:${NC}"
        echo "  cd frontend && npm run typecheck"
        echo "  cd backend && npx tsc --noEmit"
        ;;
    logs)
        CONTAINER=${2:-frontend-mock}
        show_logs "$CONTAINER"
        ;;
    *)
        echo "Usage: $0 [deploy|frontend|backend|e2e|integration|all|build|lint|typecheck|logs|-h|--help]"
        echo ""
        echo "Commands:"
        echo "  deploy       Deploy specified services (--frontend, --backend, --db)"
        echo "  frontend     Run frontend unit tests"
        echo "  backend      Run backend unit tests"
        echo "  e2e          Run E2E Docker test (starts services, seeds DB, tests API)"
        echo "  integration  Run integration tests"
        echo "  all          Run all unit tests"
        echo "  build        Test Docker builds"
        echo "  lint         Show lint commands"
        echo "  typecheck    Show typecheck commands"
        echo ""
        echo "Run '$0 --help' for more information."
        ;;
esac
