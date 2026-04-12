#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT="${1:-prod}"
FRONTEND_ROUTES=(
    "/"
    "/login"
    "/dashboard"
    "/feed"
    "/friends"
    "/messages"
    "/notifications"
    "/settings"
    "/settings/notifications"
    "/forgot-password"
    "/reset-password"
    "/invite"
    "/invites/pending"
    "/trip/new"
)

log() {
    echo "📦 $1"
}

warn() {
    echo "⚠️  $1"
}

error() {
    echo "❌ $1" >&2
    exit 1
}

# Environment-specific settings
case "$ENVIRONMENT" in
    prod)
        NEXT_PUBLIC_API_URL="https://plan-api.eric-hu.com/api"
        IMAGE_TAG="prod"
        ENV_FILE="$PROJECT_ROOT/.env.prod"
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
        ;;
    staging)
        NEXT_PUBLIC_API_URL="http://192.168.0.189:16198/api"
        NEXTAUTH_URL="http://192.168.0.189:16199"
        IMAGE_TAG="staging"
        ENV_FILE="$PROJECT_ROOT/.env.staging"
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
        ;;
    dev)
        log "Dev environment — skipping Docker builds (using start-dev.sh)"
        log "Build complete."
        exit 0
        ;;
    *)
        error "Unknown environment: $ENVIRONMENT. Use: prod, staging, or dev"
        ;;
esac

FRONTEND_IMAGE="trip-planner-frontend:$IMAGE_TAG"
BACKEND_IMAGE="trip-planner-backend:$IMAGE_TAG"

cd "$PROJECT_ROOT"

log "Building for environment: $ENVIRONMENT"
log "  NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
log "  Image tag: $IMAGE_TAG"

if [ ! -f "$ENV_FILE" ]; then
    error "$ENV_FILE not found. Please create it before deploying."
fi

log "Loading environment variables from $ENV_FILE..."
source "$ENV_FILE"

log "Cleaning previous build artifacts..."
rm -rf "$PROJECT_ROOT/backend/dist" || true
rm -rf "$PROJECT_ROOT/frontend/.next" || true
rm -rf "$PROJECT_ROOT/frontend/node_modules/.cache" || true

log "Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
npm install --legacy-peer-deps

log "Building backend..."
npm run build

log "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install --legacy-peer-deps

log "Building frontend..."
rm -rf .next || true
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

log "Building frontend Docker image..."
cd "$PROJECT_ROOT"
docker build \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    --build-arg NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    --build-arg NEXTAUTH_URL="$NEXTAUTH_URL" \
    --build-arg AUTH_TRUST_HOST="$AUTH_TRUST_HOST" \
    -f frontend/Dockerfile \
    -t "$FRONTEND_IMAGE" \
    ./frontend

log "Building backend Docker image..."
docker build -f backend/Dockerfile -t "$BACKEND_IMAGE" ./backend

# Stop any containers using the warmup port
log "Cleaning up port 16199..."
docker ps --filter "publish=16199" -q | xargs -r docker stop 2>/dev/null || true

log "Warming up frontend routes..."

FRONTEND_CONTAINER=$(docker run -d --rm \
    -e NODE_ENV=production \
    -e NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    -e NEXTAUTH_URL="$NEXTAUTH_URL" \
    -e NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
    -p 16199:16199 \
    "$FRONTEND_IMAGE")

sleep 10

for route in "${FRONTEND_ROUTES[@]}"; do
    log "Warming up $route..."
    curl -s -o /dev/null -w "%{http_code}" "${NEXTAUTH_URL}$route" || warn "Failed to warm up $route"
    sleep 1
done

docker stop "$FRONTEND_CONTAINER" 2>/dev/null || true
log "All builds complete!"

DIST_DIR="$PROJECT_ROOT/dist"
log "Preparing distribution artifacts in $DIST_DIR..."
rm -rf "$DIST_DIR" || true
mkdir -p "$DIST_DIR"

log "Saving frontend Docker image..."
docker save "$FRONTEND_IMAGE" | gzip > "$DIST_DIR/trip-planner-frontend-$IMAGE_TAG.tar.gz"

log "Saving backend Docker image..."
docker save "$BACKEND_IMAGE" | gzip > "$DIST_DIR/trip-planner-backend-$IMAGE_TAG.tar.gz"

# Create deploy script (uses docker-compose.yml in project root)
log "Creating deploy script..."
ENV_FILE=".env.$ENVIRONMENT"
cat > "$DIST_DIR/deploy.sh" <<EOF
#!/bin/bash
set -e
PROJECT_ROOT="/mnt/user/development/trip-planner"
cd "$PROJECT_ROOT"

# Stop and remove existing containers and volumes for fresh deploy
echo "🧹 Cleaning up existing containers and volumes..."
docker compose --env-file .env.$ENVIRONMENT down -v 2>/dev/null || true

echo "🚀 Loading images..."
docker load < dist/trip-planner-frontend-$IMAGE_TAG.tar.gz
docker load < dist/trip-planner-backend-$IMAGE_TAG.tar.gz
echo "🚢 Starting services..."
docker compose --env-file .env.$ENVIRONMENT up -d
echo "📦 Creating database tables (if needed)..."
docker compose exec -T backend npx prisma db push --skip-generate
echo "✅ Deployment complete!"
EOF
chmod +x "$DIST_DIR/deploy.sh"

