#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.tar.gz>"
    exit 1
fi

BACKUP_FILE=$1

echo "Восстановление из бэкапа: $BACKUP_FILE"

# Остановка сервисов
docker compose down

# Распаковка
tar -xzf "$BACKUP_FILE"
BACKUP_DIR=$(basename "$BACKUP_FILE" .tar.gz)

# Восстановление БД
docker compose up -d postgres
sleep 5
gunzip < "$BACKUP_DIR/database.sql.gz" | docker exec -i neymaryshop_db psql -U neymary neymaryshop

# Восстановление файлов
if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
    tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C ./
fi

# Запуск всех сервисов
docker compose up -d

echo "Восстановление завершено!"
