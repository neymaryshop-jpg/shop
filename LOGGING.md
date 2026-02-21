# 📝 Логирование в NeymaryShop

## 📂 Структура логов

```
logs/
├── telegram-bot/
│   └── bot_YYYY-MM-DD.log    # Логи Telegram бота
├── backend/
│   └── website_YYYY-MM-DD.log # Логи веб-сайта (backend)
└── nginx/
    └── access.log             # Логи Nginx
```

## 🔍 Что логируется

### Telegram Бот
- 🔘 **Нажатия кнопок** (callback queries)
  ```
  🔘 CALLBACK User:123456789 (@username) Data:game_steam
  ```
- 💬 **Сообщения пользователей**
  ```
  💬 MESSAGE User:123456789 (@username) Text:/start
  ```
- 📝 **Системные события**
  ```
  ✅ Routers registered!
  🤖 Запуск GameDonat Bot...
  ```

### Backend (Сайт)
- 🌐 **HTTP запросы**
  ```json
  {
    "timestamp": "2026-02-21T07:40:00Z",
    "level": "INFO",
    "message": "HTTP Request",
    "method": "POST",
    "url": "/api/auth/login",
    "status": 200,
    "duration": "45ms",
    "userId": 123,
    "ip": "192.168.1.1"
  }
  ```
- 👤 **Действия пользователей**
  ```json
  {
    "timestamp": "2026-02-21T07:40:00Z",
    "level": "INFO",
    "message": "User Action: add_to_cart",
    "userId": 123,
    "action": "add_to_cart"
  }
  ```
- 🔐 **Аутентификация**
  ```json
  {
    "timestamp": "2026-02-21T07:40:00Z",
    "level": "INFO",
    "message": "Auth: login",
    "email": "user@example.com",
    "success": true
  }
  ```
- ❌ **Ошибки**
  ```json
  {
    "timestamp": "2026-02-21T07:40:00Z",
    "level": "ERROR",
    "message": "Server Error",
    "error": "Database connection failed"
  }
  ```

## 📊 Просмотр логов

### Docker контейнеры
```bash
# Telegram бот
docker logs -f neymaryshop_telegram_bot

# Backend
docker logs -f neymaryshop_backend

# Файлы логов внутри контейнера
docker exec neymaryshop_telegram_bot cat logs/bot_2026-02-21.log
docker exec neymaryshop_backend cat logs/website_2026-02-21.log
```

### Локальные файлы
```bash
# Telegram бот
cat logs/telegram-bot/bot_2026-02-21.log

# Backend
cat logs/backend/website_2026-02-21.log
```

## 🔧 Настройка логирования

### Telegram бот
Файл: `telegram-bot/main.py`
```python
logging.basicConfig(
    level=logging.INFO,  # Изменить на DEBUG для подробных логов
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
```

### Backend
Файл: `backend/src/middleware/logger.js`
```javascript
// Изменить уровень логирования
if (level === 'INFO') console.log(consoleMsg);
if (level === 'WARN') console.warn(consoleMsg);
if (level === 'ERROR') console.error(consoleMsg);
```

## 📈 Анализ логов

### Поиск ошибок
```bash
# Telegram бот
grep "ERROR" logs/telegram-bot/bot_2026-02-21.log

# Backend
grep "ERROR" logs/backend/website_2026-02-21.log
```

### Действия пользователя
```bash
# Все нажатия кнопок
grep "CALLBACK" logs/telegram-bot/bot_2026-02-21.log

# Все сообщения
grep "MESSAGE" logs/telegram-bot/bot_2026-02-21.log
```

### HTTP запросы
```bash
# POST запросы
grep '"method": "POST"' logs/backend/website_2026-02-21.log

# Ошибки 4xx/5xx
grep '"status": [45][0-9][0-9]' logs/backend/website_2026-02-21.log
```

## 🎯 Примеры использования

### Отладка проблем с заказом
1. Найти ID пользователя в логах бота
2. Найти все действия пользователя
3. Проверить HTTP запросы к backend
4. Проверить ошибки в логах

### Мониторинг активности
1. Считать количество CALLBACK за период
2. Посчитать уникальных пользователей
3. Проверить популярные действия

### Безопасность
1. Мониторить неудачные попытки входа
2. Отслеживать подозрительные IP
3. Логировать изменения прав доступа

## 📁 Ротация логов

Логи автоматически создаются ежедневно:
- `bot_YYYY-MM-DD.log`
- `website_YYYY-MM-DD.log`

Для очистки старых логов:
```bash
# Удалить логи старше 30 дней
find logs/ -name "*.log" -mtime +30 -delete
```
