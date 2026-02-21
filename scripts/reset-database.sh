#!/bin/bash
# Полная очистка Docker volume для пересоздания БД с нуля

echo "🗑️ Очистка старых volume..."

# Остановка контейнеров
docker-compose down

# Удаление volume с базой данных
docker volume rm neymaryshop_postgres_data 2>/dev/null || echo "Volume postgres_data не найден"
docker volume rm neymaryshop_redis_data 2>/dev/null || echo "Volume redis_data не найден"

# Или через filter (альтернативный способ)
# docker volume rm $(docker volume ls -q -f name=neymaryshop)

echo "✅ Volume удалены"
echo "🔄 Пересоздание БД..."

# Запуск заново
docker-compose up -d postgres redis

echo "⏳ Ожидание инициализации БД (10 сек)..."
sleep 10

# Проверка статуса
docker-compose ps

echo "✅ Готово! БД пересоздана с нуля"
