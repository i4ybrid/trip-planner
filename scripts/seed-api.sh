#!/bin/bash

# TripPlanner API Seed Script
# This script seeds the database using the API endpoints where available
# Some data (users) must be seeded via Prisma seed
# Usage: ./seed-api.sh [api_address]
# Default api_address: localhost:4000

set -e

API_ADDRESS=${1:-localhost:4000}
BASE_URL="http://${API_ADDRESS}/api"

# Use test@user.com as the main user (created in prisma seed)
USER_ID="test@user.com"
export USER_ID

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo -e "${YELLOW}🌱 Seeding TripPlanner via API${NC}"
echo "================================"
echo "API Address: $BASE_URL"
echo "User ID: $USER_ID"
echo ""

# Helper function for API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local user=${4:-$USER_ID}
    
    if [ -n "$data" ]; then
        curl -s --max-time 10 -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "x-user-id: $user" \
            -d "$data"
    else
        curl -s --max-time 10 -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "x-user-id: $user"
    fi
}

# Check HTTP response
check_response() {
    local response="$1"
    local expected=${2:-"200|201"}
    
    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')
    
    if echo "$http_code" | grep -qE "$expected"; then
        return 0
    else
        echo "  Error: HTTP $http_code"
        echo "  Response: $body"
        return 1
    fi
}

# =====================
# Wait for API to be ready
# =====================
echo -e "${YELLOW}⏳ Waiting for API to be ready...${NC}"
API_READY=false
for i in {1..30}; do
    HTTP_CODE=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API is ready${NC}"
        API_READY=true
        break
    fi
    echo "Waiting for API... ($i/30) HTTP: $HTTP_CODE"
    sleep 2
done

if [ "$API_READY" = "false" ]; then
    echo -e "${RED}✗ API not ready after 30 attempts${NC}"
    echo ""
    echo "Debug: Trying to reach API directly..."
    curl -v "$BASE_URL/health" 2>&1 || true
    exit 1
fi
echo ""

# =====================
# Test API endpoints
# =====================
echo -e "${YELLOW}🧪 Testing API endpoints...${NC}"

# Test GET /trips
echo -n "GET /trips: "
RESPONSE=$(api_call GET "/trips")
if check_response "$RESPONSE"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test GET /users/me
echo -n "GET /users/me: "
RESPONSE=$(api_call GET "/users/me")
if check_response "$RESPONSE"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test GET /users (search)
echo -n "GET /users?q=test: "
RESPONSE=$(curl -s --max-time 10 -w "\n%{http_code}" -X GET "$BASE_URL/users?q=test" -H "x-user-id: $USER_ID")
if check_response "$RESPONSE"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ API tests failed ($ERRORS errors)${NC}"
    echo ""
    echo "Debug: Checking if backend is accessible..."
    curl -v "$BASE_URL/health" 2>&1 | head -30
    exit 1
fi

# =====================
# Create Trips (via API)
# =====================
echo -e "${YELLOW}✈️ Creating trips via API...${NC}"

# Trip 1: Paris Adventure
echo -n "Creating Paris Adventure... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Paris Adventure 2026",
    "description": "Exploring the city of lights with friends",
    "destination": "Paris, France",
    "startDate": "2026-06-15T00:00:00Z",
    "endDate": "2026-06-22T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP1_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ OK (ID: $TRIP1_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Trip 2: Summer Beach Trip
echo -n "Creating Summer Beach Trip... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Summer Beach Trip",
    "description": "Relaxing at the beach",
    "destination": "Miami, Florida",
    "startDate": "2026-07-01T00:00:00Z",
    "endDate": "2026-07-07T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP2_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ OK (ID: $TRIP2_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Trip 3: Tokyo Explorer
echo -n "Creating Tokyo Explorer... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Tokyo Explorer",
    "description": "Exploring Japanese culture",
    "destination": "Tokyo, Japan",
    "startDate": "2025-12-20T00:00:00Z",
    "endDate": "2025-12-30T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP3_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ OK (ID: $TRIP3_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Trip 4: Mountain Retreat
echo -n "Creating Mountain Retreat... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Mountain Retreat",
    "description": "Weekend getaway to the mountains",
    "destination": "Denver, Colorado",
    "startDate": "2026-02-20T00:00:00Z",
    "endDate": "2026-02-23T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP4_ID=$(echo "$RESPONSE" | sed '$d' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✓ OK (ID: $TRIP4_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# =====================
# Summary
# =====================
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Seeding complete!${NC}"
else
    echo -e "${RED}✗ Seeding completed with $ERRORS errors${NC}"
fi
echo "================================"
echo ""
echo "Test user: test@user.com (x-user-id: $USER_ID)"
echo "API URL: $BASE_URL"
echo ""
echo "Example API calls:"
echo "  curl -H 'x-user-id: test@user.com' $BASE_URL/trips"
echo "  curl -H 'x-user-id: test@user.com' $BASE_URL/users/me"

exit $ERRORS
