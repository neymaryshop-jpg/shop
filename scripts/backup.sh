#!/bin/bash

set -e

BACKUP_DIR="/home/$(whoami)/neymaryshop-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="neymaryshop_backup_${DATE}"
RETENTION_DAYS=7

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}NeymaryShop Backup Script${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

mkdir -p "${BACKUP_DIR}"
cd "${BACKUP_DIR}"

echo -e "${YELLOW}[1/4]${NC} Создание временной директории..."
TEMP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "${TEMP_DIR}"

echo -e "${YELLOW}[2/4]${NC} Бэкап базы данных PostgreSQL..."
docker exec neymaryshop_db pg_dump -U neymary neymaryshop | gzip > "${TEMP_DIR}/database.sql.gz"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} База данных сохранена"
else
    echo -e "${RED}✗${NC} Ошибка при бэкапе базы данных"
    exit 1
fi

echo -e "${YELLOW}[3/4]${NC} Бэкап конфигурационных файлов..."
cd ~/neymaryshop

cp docker-compose.yml "${TEMP_DIR}/"
cp -r nginx/nginx.conf "${TEMP_DIR}/"
cp .env.example "${TEMP_DIR}/"

if [ -d "backend/uploads" ]; then
    tar -czf "${TEMP_DIR}/uploads.tar.gz" backend/uploads/
    echo -e "${GREEN}✓${NC} Загруженные файлы сохранены"
fi

echo -e "${YELLOW}[4/4]${NC} Создание финального архива..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${TEMP_DIR}"

BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}✓${NC} Бэкап создан: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

echo ""
echo "Удаление старых бэкапов (старше ${RETENTION_DAYS} дней)..."
find "${BACKUP_DIR}" -name "neymaryshop_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo ""
echo "Доступные бэкапы:"
ls -lh "${BACKUP_DIR}"/neymaryshop_backup_*.tar.gz 2>/dev/null || echo "Нет бэкапов"

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Бэкап завершён успешно!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Расположение: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""

if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="✅ Бэкап NeymaryShop выполнен успешно!%0AРазмер: ${BACKUP_SIZE}%0AДата: ${DATE}" \
        > /dev/null
fi
