#!/bin/bash

# Запуск Telegram бота для управления ролями
echo "🤖 Запуск Telegram бота NeymaryShop..."
echo "📍 Бот для управления администраторами и ролями"
echo ""

cd telegram-bot

# Проверка зависимостей
if [ ! -f "requirements.txt" ] || [ ! -s "requirements.txt" ]; then
    echo "❌ requirements.txt пуст или отсутствует"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
pip install -r requirements.txt

# Запуск бота
echo "🚀 Запуск бота..."
python bot.py