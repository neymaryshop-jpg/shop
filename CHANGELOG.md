# 📝 CHANGELOG - NeymaryShop Telegram Bot

## Версия 2.1 (Февраль 2026)

### 🔧 Критические исправления

#### 1. Middleware логирования
- **Исправлена ошибка**: `TypeError: log_message() takes 1 positional argument`
- **Новая сигнатура**: `(handler, event, data)` для aiogram 3.x
- **Файл**: `bot/middlewares/logging.py`

#### 2. База данных
- **Унифицировано имя БД**: `neymaryshop` (было разночтение)
- **Обновлены переменные**:
  - `POSTGRES_DB=neymaryshop`
  - `DATABASE_URL=postgresql://neymary:neymary123secure@postgres:5432/neymaryshop`

#### 3. Логирование для Docker
- **Вывод в stdout**: Все логи идут в `sys.stdout`
- **Формат**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- **Docker volume**: `./logs/telegram-bot:/app/logs`

### 🎮 Новые функции

#### 1. Типы доставки
**Автовыдача (Код/Промокод)**:
- Бот выдает код из БД сразу после оплаты
- Статус заказа: `pending` → `paid` → `completed`

**Ручная доставка (Вход в аккаунт)**:
- Бот запрашивает логин/пароль у клиента
- Данные отправляются админу
- Срок: до 24 часов
- Статус: `pending` → `paid` → `waiting_data` → `completed`

#### 2. Админ-панель
- **CRUD товаров**: Добавление/редактирование/удаление
- **Массовая загрузка кодов**: Загрузка списком (каждый с новой строки)
- **Статистика кодов**: Доступно/Использовано
- **Управление заказами**: Подтверждение/отмена/завершение

#### 3. Оплата с юридическим блоком
```
⚖️ Юридическая информация:
Владелец: Ионцев К.К. (2012 г.р.)
Сделка между физическими лицами

❗ Важно:
Нажимая 'Оплатить', вы принимаете:
- Пользовательское соглашение
- Политика конфиденциальности

📄 Ссылки на Telegra.ph
```

#### 4. Система отзывов
- **Автозапрос** после завершения заказа
- **Пересылка в канал**: `-1002168687623`
- **Формат**: 
  ```
  ⭐ Новый отзыв!
  👤 От: username
  📝 Текст: ...
  ```

### 📁 Структура БД

#### Таблица `products`
```sql
delivery_type TEXT DEFAULT 'auto'  -- 'auto' или 'manual'
```

#### Таблица `product_codes`
```sql
- id INTEGER PRIMARY KEY
- product_id INTEGER
- code TEXT
- is_used BOOLEAN DEFAULT FALSE
- used_at TIMESTAMP
- order_id INTEGER
```

#### Таблица `orders`
```sql
- delivery_type TEXT DEFAULT 'auto'
- customer_data TEXT  -- для manual доставки
- status TEXT  -- pending, paid, waiting_data, completed, cancelled
```

### 🐳 Docker команды

#### Полная очистка БД
```bash
# Остановка
docker-compose down

# Удаление volume
docker volume rm neymaryshop_postgres_data
docker volume rm neymaryshop_redis_data

# Или все сразу
docker volume rm $(docker volume ls -q -f name=neymaryshop)

# Пересоздание
docker-compose up -d postgres redis
```

#### Скрипт автоматизации
```bash
bash scripts/reset-database.sh
```

### 📊 Логи

#### Telegram бот
```
🔘 CALLBACK | User:1661627681 (@username) | Data:game_steam
💬 MESSAGE | User:1661627681 (@username) | Text:/start
```

#### Backend
```json
{
  "timestamp": "2026-02-21T07:46:00Z",
  "level": "INFO",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/auth/login",
  "status": 200,
  "duration": "45ms",
  "userId": 123
}
```

### 🔧 Технические детали

#### Middleware (aiogram 3.x)
```python
class LoggingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[Update, Dict[str, Any]], Awaitable[Any]],
        event: Update,
        data: Dict[str, Any]
    ) -> Any:
        # Логирование
        return await handler(event, data)
```

#### Пересылка отзывов
```python
FEEDBACK_CHANNEL_ID = -1002168687623

await bot.send_message(
    FEEDBACK_CHANNEL_ID,
    f"⭐ Новый отзыв!\n\n"
    f"👤 От: {username}\n"
    f"📝 {feedback_text}",
    parse_mode='HTML'
)
```

### 📝 Файлы

#### Новые
- `bot/middlewares/logging.py` - Middleware логирования
- `bot/handlers/payment.py` - Оплата и доставка
- `bot/handlers/admin_products.py` - Админка товаров
- `scripts/reset-database.sh` - Скрипт сброса БД
- `LOGGING.md` - Документация логирования

#### Измененные
- `bot/__init__.py` - Регистрация middleware
- `bot/services/database.py` - Новые методы для кодов
- `main.py` - Вывод в stdout, регистрация роутеров
- `docker-compose.yml` - Volumes для логов
- `.env` - Унифицированные имена БД

### 🚀 Развертывание

```bash
# 1. Очистка старой БД
bash scripts/reset-database.sh

# 2. Сборка
docker-compose build telegram-bot

# 3. Запуск
docker-compose up -d telegram-bot

# 4. Логи
docker logs -f neymaryshop_telegram_bot
```

### ⚠️ Breaking Changes

- **Middleware signature**: Теперь `(handler, event, data)` вместо `(event, handler)`
- **Database name**: Только `neymaryshop` (старые volume нужно удалить)
- **Logging**: Только stdout (файлы внутри контейнера не сохраняются без volume)

### 📞 Поддержка

- Telegram: @neymaryshop_support
- Канал отзывов: `-1002168687623`
