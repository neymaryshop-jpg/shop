#!/bin/bash

# ============================================
# NEYMARYSHOP STARTUP SCRIPT WITH MONITORING
# ============================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           NEYMARYSHOP STARTUP WITH MONITORING            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Функция проверки здоровья сервиса
check_service_health() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}🔍 Проверка $service_name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "$service_name готов (попытка $attempt)"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Попытка $attempt/$max_attempts: $service_name еще не готов...${NC}"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name не запустился за $max_attempts попыток"
    return 1
}

# Функция получения логов
get_service_logs() {
    local service_name=$1
    local container_name=$2
    
    echo -e "${CYAN}📋 Логи $service_name:${NC}"
    echo "----------------------------------------"
    if docker logs "$container_name" --tail=20 2>&1; then
        echo "----------------------------------------"
        print_success "Логи $service_name получены"
    else
        print_error "Ошибка получения логов $service_name"
    fi
    echo ""
}

# Основной процесс запуска
main() {
    print_header
    
    # Проверка прав root
    if [[ $EUID -ne 0 ]]; then
        print_error "Скрипт должен запускаться от root!"
        echo "Используйте: sudo bash $0"
        exit 1
    fi
    
    print_step "Переход в директорию проекта..."
    cd /home/neymaryshop/Рабочий\ стол/neymaryshop
    
    print_step "Остановка старых контейнеров..."
    docker-compose down 2>/dev/null || true
    
    print_step "Сборка и запуск контейнеров..."
    if docker-compose up -d --build; then
        print_success "Контейнеры успешно запущены"
    else
        print_error "Ошибка запуска контейнеров"
        
        # Получаем логи при ошибке
        get_service_logs "BUILD PROCESS" "neymaryshop_frontend"
        exit 1
    fi
    
    print_step "Ожидание запуска сервисов..."
    sleep 30
    
    # Проверяем каждый сервис
    services_ok=true
    
    print_step "Проверка здоровья сервисов..."
    
    # Проверка frontend
    if ! check_service_health "Фронтенд" "http://localhost:3000"; then
        get_service_logs "Фронтенд" "neymaryshop_frontend"
        services_ok=false
    fi
    
    # Проверка backend
    if ! check_service_health "Бэкенд" "http://localhost:3002/health"; then
        get_service_logs "Бэкенд" "neymaryshop_backend"
        services_ok=false
    fi
    
    # Проверка admin панели
    if ! check_service_health "Админ панель" "http://localhost:3003"; then
        get_service_logs "Админ панель" "neymaryshop_admin"
        services_ok=false
    fi
    
    # Проверка базы данных
    print_step "Проверка базы данных..."
    if docker exec neymaryshop_db pg_isready -U neymary > /dev/null 2>&1; then
        print_success "База данных готова"
    else
        print_error "База данных не готова"
        get_service_logs "База данных" "neymaryshop_db"
        services_ok=false
    fi
    
    # Проверка Redis
    print_step "Проверка Redis..."
    if docker exec neymaryshop_redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis готов"
    else
        print_error "Redis не готов"
        get_service_logs "Redis" "neymaryshop_redis"
        services_ok=false
    fi
    
    # Проверка Telegram бота
    print_step "Проверка Telegram бота..."
    sleep 10
    if docker logs neymaryshop_bot --tail=5 2>&1 | grep -q "Запуск Telegram бота"; then
        print_success "Telegram бот готов"
    else
        print_error "Telegram бот не готов"
        get_service_logs "Telegram бот" "neymaryshop_bot"
        services_ok=false
    fi
    
    # Итоговый результат
    echo ""
    echo "==============================================="
    
    if $services_ok; then
        print_success "🎉 ВСЕ СЕРВИСЫ ЗАПУЩЕНЫ УСПЕШНО!"
        echo ""
        echo -e "${GREEN}📍 Магазин включен!${NC}"
        echo -e "${GREEN}😴 Я иду спать, как закончишь выключи пк${NC}"
        echo ""
        echo "📊 Доступные сервисы:"
        echo "• Фронтенд: http://localhost:3000"
        echo "• Бэкенд: http://localhost:3002"
        echo "• Админ панель: http://localhost:3003"
        echo "• Telegram Bot: Активен"
        echo ""
        echo "🔧 Управление через Telegram:"
        echo "• /health - Проверить здоровье системы"
        echo "• /shutdown - Выключить систему"
        echo ""
        
        # Отправляем уведомление в Telegram через API
        if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$SUPER_ADMIN_TELEGRAM_ID" ]; then
            echo "📱 Отправка уведомления в Telegram..."
            
            message="🎉*Магазин NeymaryShop успешно запущен!*

📍*Магазин включен!* 😴
📍*Я иду спать, как закончишь выключи пк*

📊*Сервисы работают:*
✅ Фронтенд: http://localhost:3000
✅ Бэкенд: http://localhost:3002  
✅ Админ панель: http://localhost:3003
✅ База данных: Готова
✅ Redis: Готов
✅ Telegram бот: Активен

🔧*Команды управления:*
/health - Проверить здоровье
/shutdown - Выключить систему"

            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                -d chat_id="$SUPER_ADMIN_TELEGRAM_ID" \
                -d text="$message" \
                -d parse_mode="Markdown" > /dev/null 2>&1 || echo "⚠️ Не удалось отправить уведомление в Telegram"
        fi
        
        exit 0
    else
        print_error "❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ!"
        echo ""
        echo "Проверьте логи выше для диагностики проблем."
        echo ""
        echo "🔧 Полезные команды:"
        echo "• docker-compose logs -f [service_name] - Просмотр логов"
        echo "• docker-compose restart [service_name] - Перезапуск сервиса"
        echo "• docker-compose down - Остановка всех сервисов"
        echo ""
        
        exit 1
    fi
}

# Запуск основной функции
main "$@"