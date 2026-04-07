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
        NEXTAUTH_URL="https://plan.eric-hu.com"
        NEXT_PUBLIC_APP_URL="https://plan.eric-hu.com"
        IMAGE_TAG="prod"
        ENV_FILE="$PROJECT_ROOT/.env.prod"
        ;;
    staging)
        NEXT_PUBLIC_API_URL="http://localhost:16198"
        NEXTAUTH_URL="http://localhost:16199"
        NEXT_PUBLIC_APP_URL="http://localhost:16199"
        IMAGE_TAG="staging"
        ENV_FILE="$PROJECT_ROOT/.env.staging"
        ;;
    dev)
        NEXT_PUBLIC_API_URL="http://localhost:4000"
        NEXTAUTH_URL="http://localhost:3000"
        NEXT_PUBLIC_APP_URL="http://localhost:3000"
        IMAGE_TAG="dev"
        ENV_FILE="$PROJECT_ROOT/.env"
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
log "  NEXTAUTH_URL=$NEXTAUTH_URL"
log "  Image tag: $IMAGE_TAG"

if [ "$ENVIRONMENT" != "dev" ]; then
    if [ ! -f "$ENV_FILE" ]; then
        error "$ENV_FILE not found. Please create it before deploying."
    fi
    log "Loading environment variables from $ENV_FILE..."
    source "$ENV_FILE"
fi

log "Cleaning previous build artifacts..."
rm -rf "$PROJECT_ROOT/backend/dist" || true
rm -rf "$PROJECT_ROOT/frontend/.next" || true
rm -rf "$PROJECT_ROOT/frontend/node_modules/.cache" || true

if [ "$ENVIRONMENT" = "dev" ]; then
    log "Dev environment — skipping Docker builds (using source mount)"
    log "Build complete. Run 'docker compose up' to start."
    exit 0
fi

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
npm run build

log "Building frontend Docker image..."
cd "$PROJECT_ROOT"
docker build \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    -f frontend/Dockerfile \
    -t "$FRONTEND_IMAGE" \
    ./frontend

log "Building backend Docker image..."
docker build -f backend/Dockerfile -t "$BACKEND_IMAGE" ./backend

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
    curl -s -o /dev/null -w "%{http_code}" "http://localhost:16199$route" || warn "Failed to warm up $route"
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

if [ "$ENVIRONMENT" = "prod" ]; then
    log "Copying deployment configuration..."
    cp "$PROJECT_ROOT/docker-compose.prod.yml" "$DIST_DIR/docker-compose.yml"
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$DIST_DIR/.env"
    fi

    # Ensure docker-compose.yml in dist uses images and not builds
    sed -i 's/build:/# build:/g' "$DIST_DIR/docker-compose.yml" 2>/dev/null || true
    sed -i 's/context:/# context:/g' "$DIST_DIR/docker-compose.yml" 2>/dev/null || true
    sed -i 's/dockerfile:/# dockerfile:/g' "$DIST_DIR/docker-compose.yml" 2>/dev/null || true
    sed -i 's/target:/# target:/g' "$DIST_DIR/docker-compose.yml" 2>/dev/null || true
    sed -i 's/args:/# args:/g' "$DIST_DIR/docker-compose.yml" 2>/dev/null || true

    # Update image tags to match
    sed -i "s/trip-planner-frontend:latest/trip-planner-frontend:prod/g" "$DIST_DIR/docker-compose.yml"
    sed -i "s/trip-planner-backend:latest/trip-planner-backend:prod/g" "$DIST_DIR/docker-compose.yml"

    # Create deploy script in dist
    cat > "$DIST_DIR/deploy.sh" <<EOF
#!/bin/bash
set -e
echo "🚀 Loading images..."
docker load < trip-planner-frontend-prod.tar.gz
docker load < trip-planner-backend-prod.tar.gz
echo "🚢 Starting services..."
docker compose up -d
echo "📦 Creating database tables (if needed)..."
docker compose exec -T backend npx prisma db push --skip-generate
echo "✅ Deployment complete!"
EOF
    chmod +x "$DIST_DIR/deploy.sh"
fi

echo ""
echo "Build artifacts:"
echo "  - trip-planner-frontend-$IMAGE_TAG.tar.gz"
echo "  - trip-planner-backend-$IMAGE_TAG.tar.gz"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "  - docker-compose.yml (updated for image use)"
    echo "  - .env"
    echo "  - deploy.sh"
fi
echo ""
echo "Usage:"
echo "  bash scripts/build-deploy.sh prod    # builds prod images, saves to dist/"
echo "  bash scripts/build-deploy.sh staging # builds staging images, saves to dist/"
echo "  bash scripts/build-deploy.sh dev     # dev mode, no Docker build"
