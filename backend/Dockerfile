FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY . .
RUN npm run build || true

FROM node:22-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app
USER nodejs
ENV NODE_ENV=production NODE_OPTIONS="--max-old-space-size=384"
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
