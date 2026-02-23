#!/bin/bash

# TripPlanner API Seed Script
# Seeds data via API endpoints. Uses Prisma seed for initial users.
# IDs are now randomized (CUIDs) - script parses them from responses.
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
        curl -s --max-time 30 -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "x-user-id: $user" \
            -d "$data"
    else
        curl -s --max-time 30 -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "x-user-id: $user"
    fi
}

# Check HTTP response - accepts 200, 201
check_response() {
    local response="$1"
    local http_code=$(echo "$response" | tail -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        return 0
    else
        local body=$(echo "$response" | sed '$d')
        echo "  HTTP $http_code: $body"
        return 1
    fi
}

# Extract ID from JSON response
extract_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
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
    echo "Waiting... ($i/30) HTTP: $HTTP_CODE"
    sleep 2
done

if [ "$API_READY" = "false" ]; then
    echo -e "${RED}✗ API not ready${NC}"
    exit 1
fi
echo ""

# =====================
# Verify user exists
# =====================
echo -e "${YELLOW}Verifying test user...${NC}"
RESPONSE=$(api_call GET "/users/me" "" "$USER_ID")
if ! check_response "$RESPONSE"; then
    echo -e "${RED}✗ Test user not found. Run Prisma seed first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Test user verified${NC}"
echo ""

# =====================
# Create Trips
# =====================
echo -e "${YELLOW}✈️ Creating trips...${NC}"

# Trip 1: Paris Adventure
echo -n "Paris Adventure... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Paris Adventure 2026",
    "description": "Exploring the city of lights with friends",
    "destination": "Paris, France",
    "startDate": "2026-06-15T00:00:00Z",
    "endDate": "2026-06-22T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP1_ID=$(extract_id "$RESPONSE")
    echo -e "${GREEN}✓ (ID: $TRIP1_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Trip 2: Summer Beach Trip
echo -n "Summer Beach Trip... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Summer Beach Trip",
    "description": "Relaxing at the beach",
    "destination": "Miami, Florida",
    "startDate": "2026-07-01T00:00:00Z",
    "endDate": "2026-07-07T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP2_ID=$(extract_id "$RESPONSE")
    echo -e "${GREEN}✓ (ID: $TRIP2_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Trip 3: Tokyo Explorer
echo -n "Tokyo Explorer... "
RESPONSE=$(api_call POST "/trips" '{
    "name": "Tokyo Explorer",
    "description": "Exploring Japanese culture",
    "destination": "Tokyo, Japan",
    "startDate": "2025-12-20T00:00:00Z",
    "endDate": "2025-12-30T00:00:00Z"
}')
if check_response "$RESPONSE"; then
    TRIP3_ID=$(extract_id "$RESPONSE")
    echo -e "${GREEN}✓ (ID: $TRIP3_ID)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# =====================
# Verify trips created
# =====================
echo -e "${YELLOW}🔍 Verifying trips...${NC}"
echo -n "GET /trips... "
RESPONSE=$(api_call GET "/trips")
if check_response "$RESPONSE"; then
    TRIP_COUNT=$(echo "$RESPONSE" | sed '$d' | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓ ($TRIP_COUNT trips found)${NC}"
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
    echo -e "${RED}✗ Completed with $ERRORS errors${NC}"
fi
echo "================================"
echo ""
echo "Test user: $USER_ID"
echo "API URL: $BASE_URL"
echo ""
echo "Test with:"
echo "  curl -H 'x-user-id: $USER_ID' $BASE_URL/trips"

exit $ERRORS