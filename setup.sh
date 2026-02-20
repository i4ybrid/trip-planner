#!/bin/bash

# TripPlanner - Project Setup Script

set -e

echo "🚀 Setting up TripPlanner..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Create Next.js app
echo "📦 Creating Next.js app..."
npx create-next-app@latest . \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --use-npm \
    --yes

# Install additional dependencies
echo "📦 Installing dependencies..."
npm install \
    @prisma/client \
    next-auth \
    socket.io \
    socket.io-client \
    @sendgrid/mail \
    @aws-sdk/client-s3 \
    @aws-sdk/s3-request-presigner \
    zustand \
    react-hook-form \
    zod \
    date-fns \
    lucide-react \
    clsx \
    tailwind-merge

# Install dev dependencies
npm install -D \
    prisma \
    @types/node

# Initialize Prisma
echo "🗄️ Setting up Prisma..."
npx prisma init

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database URL and auth secrets"
echo "2. Copy prisma/schema.prisma with the database schema"
echo "3. Run: npx prisma db push"
echo "4. Run: npm run dev"
