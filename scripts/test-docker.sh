#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 TripPlanner Test Suite${NC}"
echo "================================"

# Parse command line arguments
COMMAND=${1:-all}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    if ! command -v docker compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
}

# Build Docker images
build_images() {
    echo -e "${YELLOW}🔨 Building Docker images...${NC}"
    docker build -t tripplanner:dev -f Dockerfile.dev .
    docker build -t tripplanner:test -f Dockerfile.test .
    echo -e "${GREEN}✅ Build successful!${NC}"
}

# Run unit tests in Docker
run_unit_tests() {
    echo -e "${YELLOW}🧪 Running unit tests in Docker...${NC}"
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        sh -c "npm ci --legacy-peer-deps && npm run test:unit -- --coverage" \
        || { echo -e "${RED}❌ Unit tests failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Unit tests passed!${NC}"
}

# Run integration tests with test database
run_integration_tests() {
    echo -e "${YELLOW}🧪 Running integration tests in Docker...${NC}"
    
    # Start test database
    docker compose -f docker-compose.test.yml up -d db test-redis
    
    # Wait for database
    echo "Waiting for database..."
    sleep 10
    
    # Run tests
    docker run --rm \
        --network tripplanner_default \
        -v $(pwd):/app \
        -w /app \
        -e DATABASE_URL="postgresql://postgres:postgres@db:5432/tripplanner_test" \
        node:20-alpine \
        sh -c "npm ci --legacy-peer-deps && npm run test:integration" \
        || { 
            echo -e "${RED}❌ Integration tests failed${NC}"
            docker compose -f docker-compose.test.yml down
            exit 1
        }
    
    # Cleanup
    docker compose -f docker-compose.test.yml down
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
}

# Run full test suite in Docker
run_all_tests() {
    echo -e "${YELLOW}🧪 Running full test suite in Docker...${NC}"
    
    # Start test environment
    docker compose -f docker-compose.test.yml up --abort-on-container-exit test-runner
    
    # Check exit code
    EXIT_CODE=$(docker compose -f docker-compose.test.yml ps -q test-runner | xargs docker inspect -f '{{.State.ExitCode}}' 2>/dev/null || echo "1")
    
    docker compose -f docker-compose.test.yml down -v
    
    if [ "$EXIT_CODE" = "0" ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo -e "${RED}❌ Tests failed!${NC}"
        exit 1
    fi
}

# Test Docker build
test_build() {
    echo -e "${YELLOW}🔨 Testing Docker build...${NC}"
    docker build -t tripplanner:prod -f Dockerfile . \
        || { echo -e "${RED}❌ Build failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Build successful!${NC}"
}

# Lint in Docker
run_lint() {
    echo -e "${YELLOW}🔍 Running linter in Docker...${NC}"
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        sh -c "npm ci --legacy-peer-deps && npm run lint" \
        || { echo -e "${RED}❌ Linting failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Linting passed!${NC}"
}

# Typecheck in Docker
run_typecheck() {
    echo -e "${YELLOW}🔍 Running type checker in Docker...${NC}"
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        sh -c "npm ci --legacy-peer-deps && npx tsc --noEmit" \
        || { echo -e "${RED}❌ Type checking failed${NC}"; exit 1; }
    echo -e "${GREEN}✅ Type checking passed!${NC}"
}

# Run tests locally (not in Docker)
run_local() {
    echo -e "${YELLOW}🧪 Running tests locally...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm ci --legacy-peer-deps
    fi
    
    case $COMMAND in
        unit)
            npm run test:unit
            ;;
        integration)
            docker compose -f docker-compose.test.yml up -d db test-redis
            sleep 5
            npm run test:integration
            docker compose -f docker-compose.test.yml down
            ;;
        lint)
            npm run lint
            ;;
        typecheck)
            npx tsc --noEmit
            ;;
        all)
            npm run test:unit && npm run test:integration && npm run lint
            ;;
        *)
            echo "Usage: $0 [unit|integration|lint|typecheck|all|build|docker]"
            ;;
    esac
}

# Main execution
check_docker

case $COMMAND in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    all)
        run_all_tests
        ;;
    build)
        build_images
        ;;
    docker)
        docker compose -f docker-compose.test.yml up --abort-on-container-exit
        ;;
    lint)
        run_lint
        ;;
    typecheck)
        run_typecheck
        ;;
    local)
        run_local
        ;;
    *)
        echo "Usage: $0 [unit|integration|all|build|docker|lint|typecheck|local]"
        echo ""
        echo "Commands:"
        echo "  unit         - Run unit tests in Docker"
        echo "  integration  - Run integration tests with test DB in Docker"
        echo "  all          - Run full test suite in Docker"
        echo "  build        - Test Docker build"
        echo "  docker       - Run tests using docker-compose.test.yml"
        echo "  lint         - Run linter in Docker"
        echo "  typecheck    - Run type checker in Docker"
        echo "  local        - Run tests locally (requires Node.js)"
        ;;
esac
