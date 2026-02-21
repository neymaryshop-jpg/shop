#!/bin/bash

echo "🚀 Запуск NeymaryShop с правами Docker..."
echo ""

# Переходим в директорию проекта
cd "/home/neymaryshop/Рабочий стол/neymaryshop"

# Запускаем контейнеры
echo "📦 Запуск контейнеров..."
sudo docker compose up -d

echo ""
echo "⏳ Ожидание запуска..."
sleep 10

echo ""
echo "📊 Статус контейнеров:"
sudo docker compose ps

echo ""
echo "🔍 Проверка работы сервисов:"
echo "Frontend (3000): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "Backend (3002): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health)"
echo "Bot logs:"
sudo docker logs neymaryshop_bot --tail 5

echo ""
echo "✅ Готово! NeymaryShop запущен."
echo ""
echo "📋 Доступные сервисы:"
echo "• Сайт: http://localhost:3000"
echo "• API: http://localhost:3002"
echo "• Telegram Bot: @cvxdxcvcxvbot"