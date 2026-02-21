# 🚀 NeymaryShop - Инструкция по запуску

## 📋 Содержание

1. [Требования](#требования)
2. [Быстрый запуск](#быстрый-запуск)
3. [Настройка Telegram ботов](#настройка-telegram-ботов)
4. [Запуск компонентов](#запуск-компонентов)
5. [Проверка работы](#проверка-работы)
6. [Административный доступ](#административный-доступ)

---

## 🔧 Требования

- **Docker** & **Docker Compose**
- **Node.js** 18+ (для локальной разработки)
- **Python** 3.11+ (для локальной разработки)
- **PostgreSQL** 15+ (в Docker)
- **Redis** 7+ (в Docker)

---

## ⚡ Быстрый запуск

### 1. Клонирование репозитория

```bash
cd neymaryshop
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# ==========================================
# TELEGRAM БОТЫ
# ==========================================
TELEGRAM_BOT_TOKEN=8389564463:AAGGMQrtAeWl6VpSvoSmfCRzOlUWcp__2WU
TELEGRAM_CUSTOMER_BOT_TOKEN=your_customer_bot_token_here
ADMIN_IDS=1661627681

# ==========================================
# БАЗА ДАННЫХ
# ==========================================
POSTGRES_DB=neymaryshop
POSTGRES_USER=neymary
POSTGRES_PASSWORD=neymary123

# ==========================================
# REDIS
# ==========================================
REDIS_PASSWORD=redis123

# ==========================================
# JWT
# ==========================================
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# ==========================================
# TON BLOCKCHAIN
# ==========================================
TON_NETWORK=mainnet
TON_WALLET_ADDRESS=your_wallet_address
```

### 3. Запуск всех сервисов

```bash
docker-compose up -d --build
```

### 4. Проверка статуса

```bash
docker-compose ps
```

Все сервисы должны быть в статусе `Up`.

---

## 🤖 Настройка Telegram ботов

### Административный бот (существующий)

1. Откройте @BotFather в Telegram
2. Создайте нового бота или используйте существующего
3. Получите токен
4. Добавьте токен в `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_admin_bot_token
   ```
5. Добавьте бота в `telegram-bot/.env`

### Клиентский бот (новый)

1. Откройте @BotFather в Telegram
2. Создайте нового бота (`/newbot`)
3. Назовите его, например: `NeymaryShop Bot`
4. Получите токен
5. Добавьте токен в `.env`:
   ```env
   TELEGRAM_CUSTOMER_BOT_TOKEN=your_customer_bot_token
   ```

### Настройка Admin IDs

Найдите свой Telegram ID:
1. Откройте @userinfobot в Telegram
2. Отправьте любое сообщение
3. Скопируйте свой ID
4. Добавьте в `.env`:
   ```env
   ADMIN_IDS=your_telegram_id
   ```

---

## 🏃 Запуск компонентов

### Все сервисы сразу

```bash
# Запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### Отдельные сервисы

```bash
# Backend
docker-compose up -d backend

# Frontend
docker-compose up -d frontend

# Admin panel
docker-compose up -d admin

# Customer bot
docker-compose up -d customer-bot

# Admin bot
docker-compose up -d telegram-bot
```

### Локальная разработка

```bash
# Backend (терминал 1)
cd backend
npm install
npm run dev

# Frontend (терминал 2)
cd frontend
npm install
npm run dev

# Admin panel (терминал 3)
cd admin
npm install
npm run dev

# Customer bot (терминал 4)
cd customer-bot
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt
python main.py
```

---

## ✅ Проверка работы

### 1. Проверка backend

```bash
curl http://localhost:3002/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. Проверка frontend

Откройте в браузере: http://localhost:3000

### 3. Проверка admin panel

Откройте в браузере: http://localhost:3003

### 4. Проверка ботов

1. Откройте клиентского бота в Telegram
2. Отправьте `/start`
3. Должно появиться главное меню

---

## 🔐 Административный доступ

### Веб-админка

- **URL:** http://localhost:3003
- **Email:** `admin@neymaryshop.com`
- **Пароль:** `admin123`

### Telegram боты

#### Административный бот
```
/start - Главное меню
/help - Справка
/stats - Статистика
/system - Системное меню
```

#### Клиентский бот
```
/start - Главное меню
/help - Справка
/admin - Админ панель (для сотрудников)
/setup_2fa - Настройка 2FA
```

---

## 📊 Архитектура проекта

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX (Reverse Proxy)                     │
│                         Port 80/443                              │
└──────────────┬──────────────────────┬───────────────────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌────────▼──────────┐
    │   Frontend (Next.js)│  │  Admin (Next.js)  │
    │   Port 3000         │  │  Port 3003        │
    └──────────┬──────────┘  └────────┬──────────┘
               │                      │
               └──────────┬───────────┘
                          │
               ┌──────────▼──────────┐
               │  Backend (Node.js)  │
               │  Port 3002          │
               └──────────┬──────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
┌────────▼───────┐ ┌─────▼──────┐ ┌───────▼────────┐
│  PostgreSQL    │ │   Redis    │ │  Telegram Bots │
│  Port 5432     │ │  Port 6379 │ │  (Python)      │
└────────────────┘ └────────────┘ └────────────────┘
```

---

## 🔧 Управление базой данных

### Подключение к PostgreSQL

```bash
docker exec -it neymaryshop_db psql -U neymary -d neymaryshop
```

### Просмотр таблиц

```sql
\dt                    # Список таблиц
SELECT * FROM users;   # Пользователи
SELECT * FROM products;# Товары
SELECT * FROM orders;  # Заказы
```

### Бэкап базы данных

```bash
# Создание бэкапа
docker exec neymaryshop_db pg_dump -U neymary neymaryshop > backup.sql

# Восстановление
docker exec -i neymaryshop_db psql -U neymary -d neymaryshop < backup.sql
```

---

## 🐛 Отладка

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f customer-bot
```

### Перезапуск сервисов

```bash
# Все сервисы
docker-compose restart

# Конкретный сервис
docker-compose restart backend
```

### Остановка и очистка

```bash
# Остановка
docker-compose down

# Остановка с удалением volumes
docker-compose down -v

# Остановка с удалением образов
docker-compose down --rmi all
```

---

## 📸 Синхронизация фото

Фото синхронизируются между:
- Веб-сайтом (админ панель)
- Административным Telegram ботом
- Клиентским Telegram ботом

### Загрузка фото через админку

1. Откройте админ панель: http://localhost:3003
2. Перейдите в раздел "Товары" или "Категории"
3. Добавьте фото

### Загрузка фото через Telegram

1. Откройте административного бота
2. Отправьте команду `/add_product_photo` или `/add_category_photo`
3. Следуйте инструкциям

### Автоматическая синхронизация

Клиентский бот автоматически синхронизирует фото при запуске.

---

## 💰 Реферальная система

### Уровни вознаграждения

| Уровень | Покупок рефералов | Процент |
|---------|------------------|---------|
| 🥉 Bronze | 0-5 | 2% |
| 🥈 Silver | 5-9 | 3% |
| 🥇 Gold | 10+ | 5% |

### Типы реферальных кодов

1. **Базовый** - автоматически генерируется (например: `ref_abc123xyz`)
2. **Кастомный** - пользователь задаёт сам (4-20 символов)

### Получение кастомного кода

- Купить за плату
- Пригласить 5 друзей с покупками

---

## 🔐 2FA для сотрудников

Все сотрудники обязаны настроить 2FA:

1. Отправьте `/setup_2fa` клиентскому боту
2. Отсканируйте QR-код в Google Authenticator
3. Введите 6-значный код
4. Готово!

При каждом входе потребуется ввод кода из приложения.

---

## 📞 Поддержка

- **Telegram:** @neymaryshop
- **Email:** support@neymaryshop.com

---

## 📄 Лицензия

MIT License
