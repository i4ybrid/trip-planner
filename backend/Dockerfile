# Backend Dockerfile
FROM node:20-bookworm AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npx tsx prisma/seed.ts --help 2>/dev/null || true

# Production Runner
FROM node:20-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
RUN mkdir -p /app/uploads /app/log/crashes && chown -R nextjs:nodejs /app/uploads /app/log

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package.json ./

USER nextjs
EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/index.js"]
