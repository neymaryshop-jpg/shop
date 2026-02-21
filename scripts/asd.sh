#!/bin/bash

# ============================================
# NEYMARYSHOP УСТАНОВОЧНЫЙ СКРИПТ ДЛЯ UBUNTU
# ============================================
# Автоматическая установка маркетплейса для
# пополнения игровых счетов через TON Network
# ============================================

set -e  # Выход при ошибке
set -u  # Ошибка при использовании необъявленных переменных

# ============= КОНФИГУРАЦИЯ ===============
PROJECT_NAME="NeymaryShop"
PROJECT_DIR="/home/work/neymaryshop"
REPO_URL="https://github.com/neymaryshop-jpg/shop"
DOMAIN="neymaryshop.ton"
ADMIN_EMAIL="neymaryshop@gmail.com"

# Безопасные пароли
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 48)
ADMIN_TOKEN=$(openssl rand -base64 32)

# Логи
LOG_FILE="/var/log/neymaryshop_install.log"
# ============================================

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Функции вывода
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                  $PROJECT_NAME Установка                  ║"
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

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Функция логирования
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Проверка запуска от root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Этот скрипт должен запускаться от root!"
        echo "Используйте: sudo bash $0"
        exit 1
    fi
}

# Проверка системы
check_system() {
    print_step "Проверка системы..."
    
    if [[ ! -f /etc/os-release ]]; then
        print_error "Не удалось определить дистрибутив"
        exit 1
    fi
    
    source /etc/os-release
    
    if [[ "$ID" != "ubuntu" ]]; then
        print_warning "Скрипт тестировался на Ubuntu. Текущий: $NAME"
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
    
    print_success "Система: $NAME $VERSION"
    
    # Проверка памяти
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $TOTAL_MEM -lt 1024 ]]; then
        print_warning "Рекомендуется минимум 1GB RAM. Найдено: ${TOTAL_MEM}MB"
    fi
    
    # Проверка диска
    FREE_DISK=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $FREE_DISK -lt 5 ]]; then
        print_error "Требуется минимум 5GB свободного места. Найдено: ${FREE_DISK}GB"
        exit 1
    fi
}

# Обновление системы
update_system() {
    print_step "Обновление системы..."
    log_message "Обновление пакетов"
    
    export DEBIAN_FRONTEND=noninteractive
    
    apt-get update -y >> "$LOG_FILE" 2>&1
    apt-get upgrade -y >> "$LOG_FILE" 2>&1
    
    print_success "Система обновлена"
}

# Установка Docker и Docker Compose
install_docker() {
    print_step "Установка Docker и Docker Compose..."
    
    if command -v docker &> /dev/null; then
        print_success "Docker уже установлен"
    else
        log_message "Установка Docker"
        
        # Удаляем старые версии
        apt-get remove -y docker docker-engine docker.io containerd runc >> "$LOG_FILE" 2>&1
        
        # Устанавливаем зависимости
        apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release >> "$LOG_FILE" 2>&1
        
        # Добавляем репозиторий Docker
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
            gpg --dearmor -o /etc/apt/keyrings/docker.gpg >> "$LOG_FILE" 2>&1
        
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
            https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
            tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        apt-get update -y >> "$LOG_FILE" 2>&1
        
        # Устанавливаем Docker
        apt-get install -y \
            docker-ce \
            docker-ce-cli \
            containerd.io \
            docker-compose-plugin >> "$LOG_FILE" 2>&1
        
        # Проверяем установку
        docker --version >> "$LOG_FILE" 2>&1
        docker compose version >> "$LOG_FILE" 2>&1
        
        # Настройка Docker
        usermod -aG docker $SUDO_USER >> "$LOG_FILE" 2>&1
        systemctl enable docker >> "$LOG_FILE" 2>&1
        systemctl start docker >> "$LOG_FILE" 2>&1
        
        print_success "Docker и Docker Compose установлены"
    fi
}

# Установка дополнительных зависимостей
install_dependencies() {
    print_step "Установка дополнительных зависимостей..."
    
    apt-get install -y \
        git \
        curl \
        wget \
        vim \
        htop \
        net-tools \
        postgresql-client \
        redis-tools \
        python3 \
        python3-pip \
        python3-venv \
        nodejs \
        npm \
        nginx \
        certbot \
        python3-certbot-nginx \
        fail2ban \
        ufw \
        cron \
        unzip \
        jq \
        bc \
        pv \
        tree >> "$LOG_FILE" 2>&1
    
    # Обновление Node.js до актуальной версии
    if ! command -v node &> /dev/null || [[ $(node --version | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >> "$LOG_FILE" 2>&1
        apt-get install -y nodejs >> "$LOG_FILE" 2>&1
    fi
    
    print_success "Зависимости установлены"
}

# Создание структуры проекта
create_project_structure() {
    print_step "Создание структуры проекта..."
    
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Создаем полную структуру каталогов
    mkdir -p \
        frontend/app \
        frontend/components \
        frontend/public \
        backend/src/routes \
        backend/src/middleware \
        backend/src/services \
        backend/src/types \
        telegram-bot/handlers \
        telegram-bot/utils \
        database/migrations \
        database/seeds \
        nginx/ssl \
        nginx/sites-available \
        ton-config \
        scripts \
        docs \
        logs \
        backups \
        uploads
    
    print_success "Структура проекта создана"
}

# Создание файла docker-compose.yml
create_docker_compose() {
    print_step "Создание docker-compose.yml..."
    
    cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: neymaryshop_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: neymaryshop
      POSTGRES_USER: neymary
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    command: >
      postgres
      -c shared_buffers=256MB
      -c work_mem=4MB
      -c maintenance_work_mem=64MB
      -c max_connections=20
      -c effective_cache_size=1GB
      -c wal_buffers=1MB
      -c checkpoint_completion_target=0.9
      -c random_page_cost=1.1
      -c effective_io_concurrency=200
      -c min_wal_size=1GB
      -c max_wal_size=2GB
      -c max_worker_processes=2
      -c max_parallel_workers_per_gather=1
      -c max_parallel_workers=2
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.3'
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U neymary"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: neymaryshop_redis
    restart: unless-stopped
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
      --appendonly no
      --tcp-backlog 128
      --timeout 300
      --tcp-keepalive 60
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
        reservations:
          memory: 128M
          cpus: '0.2'
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: neymaryshop_backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://neymary:${DB_PASSWORD}@postgres:5432/neymaryshop
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      PORT: 3001
      ADMIN_TOKEN: ${ADMIN_TOKEN}
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/logs:/app/logs
      - ./uploads:/app/uploads
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.7'
        reservations:
          memory: 256M
          cpus: '0.4'
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    container_name: neymaryshop_frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend/logs:/app/logs
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.3'
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  telegram_bot:
    build:
      context: ./telegram-bot
      dockerfile: Dockerfile
    container_name: neymaryshop_bot
    restart: unless-stopped
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      DATABASE_URL: postgresql://neymary:${DB_PASSWORD}@postgres:5432/neymaryshop
      REDIS_URL: redis://redis:6379
      ADMIN_IDS: ${ADMIN_IDS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      backend:
        condition: service_healthy
    volumes:
      - ./telegram-bot/logs:/app/logs
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
        reservations:
          memory: 128M
          cpus: '0.2'

  nginx:
    image: nginx:alpine
    container_name: neymaryshop_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/sites-available/neymaryshop.conf:/etc/nginx/conf.d/default.conf:ro
      - nginx_cache:/var/cache/nginx
      - ./logs/nginx:/var/log/nginx
      - ./uploads:/usr/share/nginx/html/uploads:ro
    depends_on:
      - frontend
      - backend
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.2'
        reservations:
          memory: 64M
          cpus: '0.1'

volumes:
  postgres_data:
  redis_data:
  nginx_cache:
EOF
    
    print_success "docker-compose.yml создан"
}

# Создание файлов окружения
create_env_files() {
    print_step "Создание файлов окружения..."
    
    # Основной .env файл
    cat > .env << EOF
# ============================================
# NEYMARYSHOP КОНФИГУРАЦИЯ
# ============================================

# База данных
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://neymary:\${DB_PASSWORD}@postgres:5432/neymaryshop

# Redis
REDIS_URL=redis://redis:6379

# Бэкенд
NODE_ENV=production
PORT=3001
JWT_SECRET=$JWT_SECRET
ADMIN_TOKEN=$ADMIN_TOKEN
UPLOAD_DIR=/app/uploads

# Фронтенд
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
NEXT_PUBLIC_TON_ADDRESS=UQD3_your_ton_address_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
ADMIN_IDS=123456789,987654321

# Оплата
PAYMENT_CRYPTO_ADDRESS=UQD3_your_ton_address_here
PAYMENT_CARD_NUMBER=2202 2032 1234 5678
PAYMENT_CARD_HOLDER=Иван И.
PAYMENT_CARD_BANK=Сбербанк

# Домены
DOMAIN=$DOMAIN
ADMIN_EMAIL=$ADMIN_EMAIL

# Безопасность
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF
    
    # Файл для фронтенда
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
NEXT_TELEMETRY_DISABLED=1
EOF
    
    # Файл для бэкенда
    cat > backend/.env << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://neymary:$DB_PASSWORD@postgres:5432/neymaryshop
REDIS_URL=redis://redis:6379
JWT_SECRET=$JWT_SECRET
ADMIN_TOKEN=$ADMIN_TOKEN
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
UPLOAD_DIR=/app/uploads
EOF
    
    # Файл для телеграм бота
    cat > telegram-bot/.env << EOF
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
DATABASE_URL=postgresql://neymary:$DB_PASSWORD@postgres:5432/neymaryshop
REDIS_URL=redis://redis:6379
ADMIN_IDS=123456789,987654321
EOF
    
    chmod 600 .env frontend/.env.local backend/.env telegram-bot/.env
    
    print_success "Файлы окружения созданы"
}

# Создание файла .gitignore
create_gitignore() {
    print_step "Создание .gitignore..."
    
    cat > .gitignore << 'EOF'
.env
.env.local
node_modules/
__pycache__/
*.pyc
dist/
build/
.next/
*.log
*.db
*.sqlite
pgdata/
dump.rdb
logs/
.DS_Store
*.swp
.vscode/
.idea/
*.pem
*.key
ssl/
backups/
tmp/
ton-config/adnl-keys.txt
uploads/
*.tar.gz
dump.sql
EOF
    
    print_success ".gitignore создан"

}
