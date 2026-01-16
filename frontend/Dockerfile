FROM node:22-alpine AS deps

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Builder stage
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные для сборки
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Сборка Next.js приложения
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=384"

# Создаём пользователя без прав root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Копируем только необходимые файлы для production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
