#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}NeymaryShop Deploy Script${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Ошибка: docker-compose.yml не найден${NC}"
    echo "Запустите скрипт из корневой директории проекта"
    exit 1
fi

run_step() {
    local step_num=$1
    local step_name=$2
    shift 2
    
    echo -e "${YELLOW}[${step_num}]${NC} ${step_name}..."
    if "$@"; then
        echo -e "${GREEN}✓${NC} ${step_name} завершён"
    else
        echo -e "${RED}✗${NC} Ошибка: ${step_name}"
        exit 1
    fi
}

run_step "1/8" "Создание бэкапа" bash scripts/backup.sh

if [ -d ".git" ]; then
    echo -e "${YELLOW}[2/8]${NC} Получение обновлений из Git..."
    git pull origin main || git pull origin master
    echo -e "${GREEN}✓${NC} Обновления получены"
else
    echo -e "${YELLOW}[2/8]${NC} Git не используется, пропускаем..."
fi

run_step "3/8" "Остановка контейнеров" docker compose down

echo -e "${YELLOW}[4/8]${NC} Очистка старых образов..."
docker image prune -f
echo -e "${GREEN}✓${NC} Очистка завершена"

run_step "5/8" "Сборка Docker образов" docker compose build --no-cache

echo -e "${YELLOW}[6/8]${NC} Проверка миграций базы данных..."
if [ -d "database/migrations" ]; then
    docker compose up -d postgres
    sleep 5
    
    for migration in database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Применение $(basename $migration)..."
            docker exec -i neymaryshop_db psql -U neymary -d neymaryshop < "$migration"
        fi
    done
    
    docker compose down
    echo -e "${GREEN}✓${NC} Миграции применены"
else
    echo -e "${YELLOW}⚠${NC} Миграции не найдены, пропускаем..."
fi

run_step "7/8" "Запуск сервисов" docker compose up -d

echo -e "${YELLOW}[8/8]${NC} Проверка работоспособности..."
sleep 10

services=("postgres" "redis" "backend" "frontend")
all_healthy=true

for service in "${services[@]}"; do
    if docker compose ps | grep -q "${service}.*Up"; then
        echo -e "${GREEN}✓${NC} ${service} запущен"
    else
        echo -e "${RED}✗${NC} ${service} не запущен"
        all_healthy=false
    fi
done

echo ""
echo "Проверка Backend API..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend API работает"
else
    echo -e "${RED}✗${NC} Backend API не отвечает"
    all_healthy=false
fi

echo "Проверка Frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend работает"
else
    echo -e "${RED}✗${NC} Frontend не отвечает"
    all_healthy=false
fi

echo ""
echo -e "${BLUE}==================================${NC}"

if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}✓ Деплой завершён успешно!${NC}"
    echo -e "${GREEN}==================================${NC}"
    echo ""
    echo "Сервисы доступны:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo "  API Docs: http://localhost:3001/health"
    echo ""
    
    if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="✅ NeymaryShop успешно обновлён и запущен!" \
            > /dev/null
    fi
else
    echo -e "${RED}✗ Деплой завершён с ошибками${NC}"
    echo -e "${RED}==================================${NC}"
    echo ""
    echo "Проверьте логи:"
    echo "  docker compose logs -f"
    echo ""
    exit 1
fi
