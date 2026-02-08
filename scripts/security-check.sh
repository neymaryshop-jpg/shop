#!/bin/bash
# scripts/security-check.sh

echo "🔒 Проверка безопасности NeymaryShop..."
echo "========================================"

# Проверка переменных окружения
echo "1. Проверка переменных окружения:"
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET не установлен"
else
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo "⚠️  JWT_SECRET слишком короткий (рекомендуется минимум 32 символа)"
    else
        echo "✅ JWT_SECRET установлен"
    fi
fi

# Проверка зависимостей
echo -e "\n2. Проверка зависимостей:"
cd backend && npm audit --production
cd ..

# Проверка конфигурации базы данных
echo -e "\n3. Проверка конфигурации БД:"
if docker-compose exec -T postgres psql -U neymary -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Подключение к БД успешно"
else
    echo "❌ Не удалось подключиться к БД"
fi

# Проверка Redis
echo -e "\n4. Проверка Redis:"
if docker-compose exec -T redis redis-cli -a $REDIS_PASSWORD ping | grep -q PONG; then
    echo "✅ Redis работает и защищен паролем"
else
    echo "❌ Проблемы с Redis"
fi

# Проверка SSL/TLS
echo -e "\n5. Проверка SSL:"
if [ -f "./nginx/ssl/fullchain.pem" ] && [ -f "./nginx/ssl/privkey.pem" ]; then
    echo "✅ SSL сертификаты найдены"
else
    echo "⚠️  SSL сертификаты отсутствуют (рекомендуется для production)"
fi

# Проверка прав доступа
echo -e "\n6. Проверка прав доступа:"
find . -name "*.sh" -exec ls -la {} \; | grep -E '^-rwx'

# Проверка открытых портов
echo -e "\n7. Проверка открытых портов:"
netstat -tulpn | grep -E ':(80|443|3000|3001)'

echo -e "\n========================================"
echo "Проверка завершена!"
