#!/bin/bash

# Запуск админ панели и бэкенда локально
echo "🔐 Запуск админ панели NeymaryShop..."
echo "📍 Адрес админки: http://adm.localhost:3003"
echo "🔗 Адрес бэкенда: http://localhost:3002"
echo "🔗 API: http://localhost:3002/api"
echo ""

# Проверяем, что Node.js установлен
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    exit 1
fi

# Проверяем, что npm установлен
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

# Установка зависимостей для админки
echo "📦 Установка зависимостей для админки..."
cd admin && npm install --silent

# Установка зависимостей для бэкенда
echo "📦 Установка зависимостей для бэкенда..."
cd ../backend && npm install --silent

# Возврат в корень
cd ..

# Запуск бэкенда в фоновом режиме
echo "🚀 Запуск бэкенда на порту 3002..."
cd backend
NODE_ENV=development PORT=3002 npm start &
BACKEND_PID=$!
cd ..

# Ожидание запуска бэкенда
sleep 3

# Запуск админ панели в фоновом режиме
echo "🚀 Запуск админ панели на порту 3003..."
cd admin
NEXT_PUBLIC_API_URL=http://localhost:3002/api npm run dev &
ADMIN_PID=$!
cd ..

echo ""
echo "✅ Сервисы запущены!"
echo "📍 Админ панель: http://adm.localhost:3003"
echo "📍 Локальный доступ: http://localhost:3003"
echo ""
echo "🔑 Данные для входа по умолчанию:"
echo "   Email: admin@neymaryshop.com"
echo "   Password: admin123"
echo ""
echo "Для остановки сервисов нажмите Ctrl+C"

# Ожидание сигнала для остановки
trap 'echo ""; echo "🛑 Остановка сервисов..."; kill $BACKEND_PID $ADMIN_PID 2>/dev/null; exit' INT

# Бесконечное ожидание
while true; do
    sleep 1
done