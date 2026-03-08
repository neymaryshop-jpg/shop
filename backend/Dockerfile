# Build stage
FROM node:18.20-alpine AS builder

ARG NO_PROXY
ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV NO_PROXY=${NO_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM node:18.20-alpine

ARG NO_PROXY
ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV NO_PROXY=${NO_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NODE_ENV=production

WORKDIR /app

# Установка wget для healthcheck
RUN apk add --no-cache wget

# Установка зависимостей
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

EXPOSE 3002

CMD ["node", "dist/index.js"]
