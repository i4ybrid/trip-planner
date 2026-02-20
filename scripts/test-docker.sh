#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🧪 TripPlanner Test Suite${NC}"
echo "================================"

COMMAND=${1:-all}

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

run_frontend_tests() {
    echo -e "${YELLOW}🧪 Running frontend unit tests...${NC}"
    cd frontend
    docker build -t tripplanner-frontend:test -f Dockerfile.test . \
        || { echo -e "${RED}❌ Frontend tests failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
}

run_backend_tests() {
    echo -e "${YELLOW}🧪 Running backend unit tests...${NC}"
    cd backend
    docker build -t tripplanner-backend:test -f Dockerfile.test . \
        || { echo -e "${RED}❌ Backend tests failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
}

run_integration_tests() {
    echo -e "${YELLOW}🧪 Running integration tests...${NC}"
    docker compose -f docker-compose.test.yml up --abort-on-container-exit
    docker compose -f docker-compose.test.yml down -v
    echo -e "${GREEN}✅ Integration tests passed!${NC}"
}

run_all_tests() {
    run_frontend_tests
    run_backend_tests
}

test_frontend_build() {
    echo -e "${YELLOW}🔨 Testing frontend build...${NC}"
    cd frontend
    docker build -t tripplanner-frontend:prod -f Dockerfile . \
        || { echo -e "${RED}❌ Frontend build failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Frontend build successful!${NC}"
}

test_backend_build() {
    echo -e "${YELLOW}🔨 Testing backend build...${NC}"
    cd backend
    docker build -t tripplanner-backend:prod -f Dockerfile . \
        || { echo -e "${RED}❌ Backend build failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Backend build successful!${NC}"
}

test_lint_frontend() {
    echo -e "${YELLOW}🔍 Running frontend linting...${NC}"
    cd frontend
    docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci --legacy-peer-deps && npm run lint" \
        || { echo -e "${RED}❌ Frontend linting failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Frontend linting passed!${NC}"
}

test_lint_backend() {
    echo -e "${YELLOW}🔍 Running backend linting...${NC}"
    cd backend
    docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci --legacy-peer-deps && npm run lint" \
        || { echo -e "${RED}❌ Backend linting failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Backend linting passed!${NC}"
}

test_typecheck_frontend() {
    echo -e "${YELLOW}🔍 Running frontend type checking...${NC}"
    cd frontend
    docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci --legacy-peer-deps && npx tsc --noEmit" \
        || { echo -e "${RED}❌ Frontend type checking failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Frontend type checking passed!${NC}"
}

test_typecheck_backend() {
    echo -e "${YELLOW}🔍 Running backend type checking...${NC}"
    cd backend
    docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npm ci --legacy-peer-deps && npx tsc --noEmit" \
        || { echo -e "${RED}❌ Backend type checking failed${NC}"; exit 1; }
    cd ..
    echo -e "${GREEN}✅ Backend type checking passed!${NC}"
}

check_docker

case $COMMAND in
    frontend)
        run_frontend_tests
        ;;
    backend)
        run_backend_tests
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
        test_lint_frontend
        test_lint_backend
        ;;
    typecheck)
        test_typecheck_frontend
        test_typecheck_backend
        ;;
    *)
        echo "Usage: $0 [frontend|backend|integration|all|build|lint|typecheck]"
        echo ""
        echo "Commands:"
        echo "  frontend   - Run frontend unit tests"
        echo "  backend   - Run backend unit tests"
        echo "  integration - Run integration tests"
        echo "  all       - Run all unit tests"
        echo "  build     - Test Docker builds"
        echo "  lint      - Run linters"
        echo "  typecheck - Run type checkers"
        ;;
esac
