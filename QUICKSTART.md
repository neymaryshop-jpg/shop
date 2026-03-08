# 🚀 NeymaryShop - Быстрый старт

## ⚠️ Критические исправления v2.1

### Проблема с БД "neymary does not exist"
**Решение:**
```bash
# Полная очистка volume
docker-compose down -v

# Запуск заново
docker-compose up -d postgres

# Проверка
docker exec neymaryshop_db psql -U neymary -d neymaryshop -c "SELECT version();"
```

### Backend не находит middleware
**Причина:** Docker кэширует слои
**Решение:**
```bash
# Пересборка без кэша
docker-compose build --no-cache backend

# Запуск
docker-compose up -d backend
```

### Telegram бот не подключается
**Проблема:** Сеть/прокси блокирует api.telegram.org
**Решение:** Проверить подключение к Telegram API

---

## 📋 Полный сброс и запуск

```bash
# 1. Остановка и очистка
docker-compose down -v

# 2. Удаление всех volume NeymaryShop
docker volume rm $(docker volume ls -q -f name=neymaryshop)

# 3. Сборка без кэша
docker-compose build --no-cache

# 4. Запуск
docker-compose up -d

# 5. Проверка
docker-compose ps
docker logs neymaryshop_db --tail 10
docker logs neymaryshop_backend --tail 10
docker logs neymaryshop_telegram_bot --tail 10
```

---

## 🔧 Переменные окружения

### .env (основной)
```env
POSTGRES_DB=neymaryshop
POSTGRES_USER=neymary
POSTGRES_PASSWORD=neymary123secure
DATABASE_URL=postgresql://neymary:neymary123secure@postgres:5432/neymaryshop
REDIS_URL=redis://redis:6379
TELEGRAM_BOT_TOKEN=your_token_here
ADMIN_IDS=1661627681
```

---

## 📊 Проверка работы

### PostgreSQL
```bash
docker exec neymaryshop_db psql -U neymary -d neymaryshop -c "\dt"
```

### Backend
```bash
curl http://localhost:3002/health
```

### Telegram Bot
```bash
docker logs neymaryshop_telegram_bot | findstr "Ready"
```

---

## 🐛 Частые проблемы

### 1. БД "neymary" не существует
```bash
# Старые подключения еще активны
docker-compose restart postgres
```

### 2. Backend ModuleNotFoundError
```bash
# Очистка кэша Docker
docker builder prune -f
docker-compose build --no-cache backend
```

### 3. Бот не получает обновления
```bash
# Проверка токена
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Перезапуск бота
docker-compose restart telegram-bot
```

---

## 📝 Логи

```bash
# Все логи
docker-compose logs -f

# Только БД
docker logs -f neymaryshop_db

# Только Backend
docker logs -f neymaryshop_backend

# Только Бот
docker logs -f neymaryshop_telegram_bot
```

---

## 🎯 Готово!

- ✅ БД: `neymaryshop` создана
- ✅ Backend: middleware логирования работает
- ✅ Bot: логирование в stdout
- ✅ Volume: `/logs` примонтированы

**Версия:** 2.1 (Февраль 2026)
