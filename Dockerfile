FROM node:24.14.0-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:24.14.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/content ./content
COPY --from=builder --chown=node:node /app/database ./database
COPY --from=builder --chown=node:node /app/pages/support/source.html ./pages/support/source.html
COPY --from=builder --chown=node:node /app/scripts/migrate-db.ts ./scripts/migrate-db.ts
USER node
EXPOSE 3000
CMD ["node", "server.js"]
