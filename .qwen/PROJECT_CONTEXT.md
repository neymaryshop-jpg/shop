# NeymaryShop - Контекст Проекта

**Версия:** 2.5 (последнее обновление: 2026-03-08)  
**Статус:** ✅ Production Ready  
**Последний коммит:** 🔧 v2.5: Исправления сборки и конфигурации

---

## 📋 Общая информация

**NeymaryShop** — это маркетплейс цифровых товаров с автоматической выдачей. Проект включает в себя:

- **Frontend** (Next.js 14 + React 18) — основной сайт для покупателей
- **Backend** (Node.js + Express) — API сервер
- **Admin Panel** (Next.js 14) — панель администратора
- **Telegram Bot** (Python + aiogram) — бот для уведомлений и продаж
- **База данных** — PostgreSQL 15
- **Кэш** — Redis 7
- **Reverse Proxy** — Nginx

---

## 🏗 Архитектура

### Frontend
- **Framework:** Next.js 14.2.35 (Pages Router)
- **Styling:** Tailwind CSS 3.4.17
- **State:** React Hooks + Context API
- **HTTP Client:** Axios 1.13.6
- **TypeScript:** 5.7.3
- **Порт:** 3000

### Backend
- **Framework:** Node.js 18 + Express.js 4.21.2
- **Database:** PostgreSQL 15 (через pg)
- **Cache:** Redis 7
- **Auth:** JWT + bcrypt 3.0.2
- **TypeScript:** 5.7.3
- **Порт:** 3002

### Admin Panel
- **Framework:** Next.js 14.2.35 (Pages Router)
- **Styling:** Tailwind CSS 3.4.17
- **TypeScript:** 5.7.3
- **Порт:** 3003

### Telegram Bot
- **Framework:** Python 3.9+ + aiogram 3.18.0
- **Database:** SQLite + asyncpg 0.30.0
- **Cache:** Redis 5.2.1

### Инфраструктура
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **Payments:** Manual (Card + SBP + Crypto)
- **Notifications:** Telegram Bot

---

## 📁 Структура проекта

```
neymaryshop/
├── frontend/           # Next.js frontend (порт 3000)
│   ├── pages/         # Страницы (Pages Router)
│   ├── components/    # React компоненты
│   ├── src/data/      # Данные (категории и т.д.)
│   ├── utils/         # Утилиты
│   └── styles/        # Стили
├── backend/           # Express backend (порт 3002)
│   ├── src/
│   │   ├── routes/    # API роуты
│   │   ├── middleware/# Middleware (auth, logger)
│   │   ├── services/  # Сервисы (Telegram, 2FA)
│   │   └── auth/      # Аутентификация
│   └── dist/          # Скомпилированный код
├── admin/             # Admin panel (порт 3003)
│   ├── pages/         # Страницы админки
│   ├── components/    # Компоненты
│   └── styles/        # Стили
├── telegram-bot/      # Telegram bot
│   └── bot/
│       ├── handlers/  # Обработчики
│       ├── services/  # Сервисы (БД)
│       └── middlewares/# Middleware
├── database/          # База данных
│   ├── init.sql       # Инициализация
│   └── migrations/    # Миграции
├── nginx/             # Nginx конфигурация
├── docker-compose.yml # Docker Compose
├── .env               # Переменные окружения
└── .qwen/             # Контекст проекта
```

---

## 🔧 Последние изменения (v2.5)

### Frontend
- ✅ Исправлен `next.config.js` (удалена некорректная опция `turbopack`)
- ✅ Обновлен `axios` до ^1.13.6
- ✅ Downgrade Next.js до 14.2.35 (стабильная версия)
- ✅ Добавлены `.env.local` для frontend и admin
- ✅ Добавлены компоненты: Header, Footer, TrustBadges, ConversionCTA
- ✅ Обновлены страницы: cart, catalog, index, checkout
- ✅ Добавлены legal страницы: privacy, terms
- ✅ Platform-aware детекция (Windows/Android vs macOS/iOS)

### Backend
- ✅ Исправлен CORS (flexible origin policy)
- ✅ Оптимизирована работа с Redis (graceful degradation)
- ✅ Улучшена структура `index.ts`
- ✅ Добавлены роуты: adminProducts, orders
- ✅ Выделен `database.ts` в отдельный файл
- ✅ Добавлен `logger.ts` middleware

### Nginx
- ✅ Исправлен upstream admin (`localhost:3003` → `admin:3003`)

### Docker
- ✅ Добавлены proxy переменные для всех сервисов
- ✅ Улучшены health checks
- ✅ Оптимизированы Dockerfile

### Telegram Bot
- ✅ Исправлен `handlers/admin_products.py` (добавлено сохранение в БД)
- ✅ Обновлен `payment.py` (реквизиты + юр. информация)
- ✅ Улучшено логирование (Docker-compatible)
- ✅ Добавлен метод `add_product` в `database.py`

### База данных
- ✅ Миграции: категории, FAQ, delivery_type
- ✅ Seed данные для 38 категорий
- ✅ Новые поля: `source`, `rating_avg`, `reviews_count`

---

## 🚀 Быстрый старт

### Docker (рекомендуется)
```bash
# Запуск всех сервисов
docker-compose up -d redis postgres backend frontend admin

# Проверка статуса
docker-compose ps

# Логи
docker-compose logs -f backend
docker-compose logs -f frontend

# Остановка
docker-compose down
```

### Локальная разработка
```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=neymaryshop \
  -e POSTGRES_USER=neymary \
  -e POSTGRES_PASSWORD=neymary123 \
  postgres:15-alpine

# Terminal 3: Backend
cd backend && npm install && npm run dev

# Terminal 4: Frontend
cd frontend && npm install && npm run dev

# Terminal 5: Admin
cd admin && npm install && npm run dev
```

### URL
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3002/api
- **Admin Panel:** http://localhost:3003

### Admin Credentials
- **Email:** admin@neymaryshop.com
- **Password:** admin123

---

## 🎨 Design System

### Colors
- **BG Primary:** `#0a0a0a`
- **BG Secondary:** `#111111`
- **BG Card:** `#16213e`
- **Text Primary:** `#e0e0e0`
- **Accent:** `#00ff9d`
- **Accent Hover:** `#00cc7d`

### Font
- **Monospace:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`

### Компоненты
- **TrustBadges:** ⚡ Мгновенная выдача, 🔒 TON защита, 🎧 Поддержка 24/7
- **Category Cards:** Large grid с emoji, hover эффекты
- **Sticky Footer:** Всегда внизу через flexbox

---

## 📊 Database Schema

### Categories (новые поля)
```sql
source VARCHAR(10) DEFAULT 'web'  -- 'web' или 'tg'
art_url VARCHAR(500)              -- Category art image
long_description TEXT             -- SEO описание
faq_json JSONB DEFAULT '[]'       -- FAQ массив
emoji_set VARCHAR(100)            -- Набор emoji
show_on_main BOOLEAN DEFAULT true -- Показывать на главной
```

### Products (новые поля)
```sql
source VARCHAR(10) DEFAULT 'web'  -- 'web' или 'tg'
rating DECIMAL(3,2) DEFAULT 0     -- Рейтинг товара
reviews_count INTEGER DEFAULT 0   -- Количество отзывов
```

---

## 🔐 Environment Variables

### .env (main)
```env
# Database
POSTGRES_DB=neymaryshop
POSTGRES_USER=neymary
POSTGRES_PASSWORD=neymary123
DATABASE_URL=postgresql://neymary:neymary123@postgres:5432/neymaryshop

# Redis
REDIS_URL=redis://redis:6379

# API
NEXT_PUBLIC_API_URL=http://localhost:3002/api

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_IDS=your_admin_id
```

---

## ✅ Testing Checklist

### Cart
- [x] Cart позволяет дубликаты (увеличивает quantity)
- [x] Decrement ниже 1 удаляет товар
- [x] increment/decrement методы работают

### Checkout
- [x] Checkout показывает платежные реквизиты
- [x] Success page показывает информацию об оплате
- [x] Только Card и SBP способы оплаты

### UI
- [x] Header показывает только cart icon
- [x] Homepage показывает grid категорий
- [x] Footer sticky внизу
- [x] Все 38 категорий в базе данных

### Backend
- [x] CORS работает для admin panel
- [x] Admin может войти и просматривать заказы
- [x] Image upload endpoints работают

---

## 📝 Changelog

### V2.5 (2026-03-08)
- 🔧 Исправления сборки (next.config.js, axios, Next.js)
- 🔧 CORS и Redis оптимизации
- 🔧 Nginx upstream исправления
- 🔧 Telegram Bot улучшения
- 🔧 Миграции БД и seed данные

### V2.4 (2026-02-24)
- ✅ Frontend conversion редизайн
- ✅ Trust badges компонент
- ✅ Urgency banners
- ✅ 2-step checkout
- ✅ Post-purchase modal с рефералами
- ✅ A/B тестирование CTA кнопок

### V2.3 (2026-02-18)
- ✅ Docker релиз
- ✅ Полная настройка инфраструктуры
- ✅ Интеграция admin panel
- ✅ Интеграция Telegram bot

---

## 📞 Support

- **Telegram:** @neymaryshop_support
- **Email:** support@neymaryshop.com
- **Owner:** ИП Ионцев К.К. (сделка между физ. лицами)

---

## 📄 License

MIT License

---

**Generated:** 2026-03-08  
**Status:** ✅ Все задачи выполнены успешно  
**Build:** ✅ Frontend compiled successfully (Next.js 14.2.35)
