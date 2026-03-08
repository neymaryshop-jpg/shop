# Build stage
FROM node:20-alpine AS builder

ARG NO_PROXY
ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV NO_PROXY=${NO_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Production stage
FROM node:20-alpine

ARG NO_PROXY
ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV NO_PROXY=${NO_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Установка wget для healthcheck
RUN apk add --no-cache wget

# Установка зависимостей
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["node", "server.js"]
