# NeymaryShop - Документация проекта V2.3

## 📋 Обзор

NeymaryShop - это современный интернет-магазин цифровых товаров с полной административной панелью, Telegram-ботом и расширенным функционалом для покупателей.

**Последнее обновление:** 2026-02-18
**Версия:** 2.3 (Docker Release)

## 🏗 Архитектура

### Фронтенд
- **Основной сайт:** Next.js 14.2.35 (Pages Router)
- **Админ панель:** Next.js 14.2.35 (Pages Router)
- **Стили:** Tailwind CSS 3.4
- **Стейт:** React Hooks + Context API
- **HTTP клиент:** Axios 1.8.2

### Бэкенд
- **Фреймворк:** Node.js + Express.js 4.21.2
- **База данных:** PostgreSQL 15
- **Кэш:** Redis 7
- **Аутентификация:** JWT + bcrypt 3.0.2
- **Типизация:** TypeScript 5.7

### Telegram Бот
- **Фреймворк:** aiogram 3.18.0
- **База данных:** SQLite + asyncpg 0.30.0
- **Кэш:** Redis 5.2.1

### Инфраструктура
- **Контейнеризация:** Docker + Docker Compose
- **Веб-сервер:** Nginx (reverse proxy)
- **Платежи:** TON Blockchain
- **Уведомления:** Telegram Bot (Admin + Customer)

## 📁 Структура проекта

```
neymaryshop/
├── admin/                    # Админ панель (Next.js)
│   ├── pages/
│   ├── styles/
│   ├── Dockerfile
│   └── package.json
├── backend/                  # API сервер (Node.js)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── features.ts   # Новые API (wishlist, reviews, etc.)
│   │   │   ├── upload.ts
│   │   │   └── adminOrders.ts
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Основной сайт (Next.js)
│   ├── pages/
│   │   ├── catalog.tsx       # Каталог с фильтрами
│   │   ├── cart.tsx          # Корзина
│   │   ├── compare.tsx       # Сравнение товаров
│   │   ├── wishlist-page.tsx # Избранное
│   │   ├── notifications.tsx # Уведомления
│   │   └── index.tsx         # Главная
│   ├── components/
│   │   └── Homepage.tsx
│   ├── context/
│   ├── styles/
│   ├── Dockerfile
│   └── package.json
├── database/                 # Миграции БД
│   ├── init.sql
│   └── migrations/
│       └── 002_add_new_features.sql  # Новые функции
├── telegram-bot/             # Telegram бот
│   ├── bot/
│   │   ├── handlers/
│   │   │   ├── extended.ts   # Новые обработчики
│   │   │   ├── start.ts
│   │   │   └── ...
│   │   ├── services/
│   │   ├── keyboards.py
│   │   └── keyboards_extended.py
│   ├── main.py
│   └── requirements.txt
├── nginx/                    # Конфигурация Nginx
├── docker-compose.yml        # Конфигурация Docker
└── .env                      # Переменные окружения
```

## 🚀 Запуск проекта

### Требования
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15
- Redis 7
- Python 3.9+ (для Telegram бота)

### Быстрый запуск
```bash
# Запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Доступ к сервисам
- **Основной сайт:** http://localhost:3000
- **Админ панель:** http://localhost:3003
- **API:** http://localhost:3002
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### Административный доступ
- **Email:** admin@neymaryshop.com
- **Пароль:** admin123

## 🔐 Аутентификация

### Пользователи
- JWT токены для доступа к API
- Регистрация через основной сайт
- Восстановление пароля
- 2FA (TOTP) поддержка

### Администраторы
- Отдельный механизм аутентификации
- Таблица `admin_roles` для разграничения прав
- Сессии с истечением срока действия
- Роли: `super_admin`, `admin`, `moderator`

## 📦 Основные функции

### Интернет-магазин
- 📋 Каталог товаров с категориями
- 🔍 Поиск и фильтрация товаров
- 🛒 Корзина с обновлением в реальном времени
- ❤️ Избранное (Wishlist)
- ⚖️ Сравнение товаров (до 4 товаров)
- 💳 Оформление заказа
- 📱 Мультиплатформенность (Android/PC/iOS)
- 👤 Профиль пользователя
- 🔔 Уведомления

### Новые функции (V2.2)
- ⭐ Отзывы и рейтинги товаров
- 📊 Сравнение товаров
- ❤️ Избранное (Wishlist)
- 🔔 Система уведомлений
- 👥 Реферальная программа (до 5% бонусов)
- 🎁 Промокоды и скидки
- 📧 Подписка на рассылку
- 📞 Тикеты поддержки

### Администрирование
- 📊 Статистика заказов и выручки
- 📦 Управление товарами и категориями
- 🔄 Управление статусами заказов
- 👥 Управление пользователями
- ⭐ Модерация отзывов
- 📊 Аналитика просмотров товаров
- ⚙️ Настройки системы

### Telegram Бот
- 🛍️ Режим покупок (customer)
- ⚙️ Режим админки (staff)
- 📦 Каталог товаров
- 🛒 Корзина
- ❤️ Избранное
- ⚖️ Сравнение товаров
- 🔔 Уведомления
- 👥 Реферальная система
- ⭐ Отзывы
- 📞 Поддержка

### Интеграции
- 💎 TON Blockchain платежи
- 📱 Telegram бот (aiogram 3.x)
- 📧 Email уведомления
- 🔐 2FA аутентификация

## 🗄 База данных

### Основные таблицы
- `users` - Пользователи
- `products` - Товары
- `categories` - Категории
- `orders` - Заказы
- `order_items` - Позиции заказов
- `cart_items` - Корзина
- `admin_roles` - Роли администраторов
- `admin_sessions` - Сессии админов

### Новые таблицы (V2.2)
- `wishlists` - Избранное
- `reviews` - Отзывы и рейтинги
- `review_votes` - Голосования за отзывы
- `notifications` - Уведомления
- `product_comparisons` - Сравнение товаров
- `referrals` - Реферальная система
- `referral_earnings` - Реферальные начисления
- `coupons` - Промокоды
- `user_coupons` - Использование купонов
- `newsletter_subscriptions` - Подписка на рассылку
- `support_tickets` - Тикеты поддержки
- `ticket_messages` - Сообщения тикетов
- `product_views` - Аналитика просмотров

### Миграции
```bash
# Применение миграций
docker-compose exec postgres psql -U neymary -d neymaryshop -f /docker-entrypoint-initdb.d/002_add_new_features.sql
```

## 🌐 API Endpoints

### Основные
- `GET /api/products` - Список товаров
- `GET /api/categories` - Список категорий
- `GET /api/payment-methods` - Способы оплаты
- `POST /api/orders` - Создание заказа

### Новые (V2.2)
- `GET /api/wishlist` - Список избранного
- `POST /api/wishlist/add` - Добавить в избранное
- `DELETE /api/wishlist/remove/:id` - Удалить из избранного
- `GET /api/products/:id/reviews` - Отзывы о товаре
- `POST /api/products/:id/reviews` - Создать отзыв
- `GET /api/notifications` - Уведомления
- `GET /api/compare` - Сравнение товаров
- `GET /api/referral` - Реферальная информация
- `POST /api/coupons/validate` - Проверить купон
- `POST /api/support/tickets` - Создать тикет

## ⚙️ Конфигурация

### Переменные окружения (.env)
```env
# База данных
POSTGRES_DB=neymaryshop
POSTGRES_USER=neymary
POSTGRES_PASSWORD=...

# Redis
REDIS_PASSWORD=...
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# TON Blockchain
TON_NETWORK=mainnet|testnet
TON_WALLET_ADDRESS=...
TON_WALLET_MNEMONIC=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=...
ADMIN_IDS=1661627681

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

## 🔧 Разработка

### Локальная разработка
```bash
# Фронтенд
cd frontend && npm run dev

# Админ панель
cd admin && npm run dev

# Бэкенд
cd backend && npm run dev

# Telegram бот
cd telegram-bot && python main.py
```

### Сборка
```bash
# Продакшн сборка
docker-compose up -d --build

# Отладка
docker-compose logs [service_name]

# Проверка уязвимостей
cd backend && npm audit
cd frontend && npm audit
```

### Безопасность
```bash
# Обновление зависимостей
cd backend && npm install
cd frontend && npm install
cd telegram-bot && pip install -r requirements.txt

# Проверка уязвимостей
npm audit fix
```

## 🚨 Проблемы и решения

### ✅ Решённые проблемы

#### 1. Next.js App Router конфигурация
**Проблема:** Конфликт между App Router и Pages Router  
**Решение:** Используется Pages Router с корректной конфигурацией

#### 2. Уязвимости зависимостей
**Проблема:** qs <= 6.14.1 уязвим для DoS  
**Решение:** Обновлён до 6.14.2 через overrides в package.json

#### 3. TypeScript ошибки
**Решение:** Исправлены типы, добавлен `--skipLibCheck`

#### 4. Redis интеграция
**Решение:** Добавлен Redis сервис в docker-compose.yml

#### 5. Устаревшие зависимости
**Решение:** Все зависимости обновлены до последних стабильных версий (2026-02-18)

### 🔴 Актуальные проблемы
- [ ] Добавить тестовое покрытие (Jest, Pytest)
- [ ] Оптимизировать сборку Docker образов
- [ ] Реализовать кэширование Redis для API
- [ ] Добавить CI/CD пайплайны

## 📊 Версии зависимостей

### Backend (Node.js)
| Пакет | Версия | Статус |
|-------|--------|--------|
| express | 4.21.2 | ✅ |
| express-rate-limit | 7.5.0 | ✅ |
| helmet | 8.0.0 | ✅ |
| jsonwebtoken | 9.0.2 | ✅ |
| bcryptjs | 3.0.2 | ✅ |
| pg | 8.13.3 | ✅ |
| redis | 4.7.0 | ✅ |
| typescript | 5.7.3 | ✅ |

### Frontend (Node.js)
| Пакет | Версия | Статус |
|-------|--------|--------|
| next | 14.2.35 | ✅ |
| react | 18.3.1 | ✅ |
| axios | 1.8.2 | ✅ |
| tailwindcss | 3.4.17 | ✅ |
| typescript | 5.7.3 | ✅ |

### Telegram Bot (Python)
| Пакет | Версия | Статус |
|-------|--------|--------|
| aiogram | 3.18.0 | ✅ |
| aiohttp | 3.11.13 | ✅ |
| asyncpg | 0.30.0 | ✅ |
| redis | 5.2.1 | ✅ |
| Pillow | 11.1.0 | ✅ |

## 🔮 Будущие улучшения

### Реализовано в V2.3 ✅
- [x] Полная Docker контейнеризация
- [x] Многоэтапная сборка образов
- [x] Health checks для всех сервисов
- [x] Оптимизация Docker образов
- [x] Исправление CORS для админ-панели
- [x] Исправление ошибок TypeScript в dashboard

### В ближайшее время (V2.4)
- [ ] Тестовое покрытие (Jest, Pytest)
- [ ] Redis кэширование для API
- [ ] GraphQL API

### Среднесрочные планы (V3.0)
- [ ] Микросервисная архитектура
- [ ] CI/CD пайплайны (GitHub Actions)
- [ ] Мониторинг (Prometheus + Grafana)
- [ ] API Rate Limiting
- [ ] WebSocket для реального времени

### Долгосрочные цели (V4.0)
- [ ] PWA версия
- [ ] Мобильное приложение (React Native)
- [ ] Система аналитики
- [ ] Multi-tenant архитектура
- [ ] Мультиязычность (i18n)

## 📞 Поддержка

### Логирование
```bash
# Просмотр логов всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs admin
docker-compose logs frontend

# Логи в реальном времени
docker-compose logs -f
```

### Диагностика
```bash
# Проверка здоровья сервисов
curl http://localhost:3002/health

# Статус контейнеров
docker-compose ps

# Перезапуск сервисов
docker-compose restart [service_name]

# Остановка всех сервисов
docker-compose down

# Полная очистка
docker-compose down -v
```

### Контакты
- **Email:** support@neymaryshop.com
- **Telegram:** @neymaryshop_support
- **Документация:** /README.md, /SETUP.md

## 📦 Релизы

### V2.3 (Docker Release) - 2026-02-18
- ✅ Полная Docker контейнеризация
- ✅ Многоэтапная сборка образов
- ✅ Health checks для всех сервисов
- ✅ Исправление CORS для админ-панели
- ✅ Исправление ошибок TypeScript в dashboard
- ✅ Оптимизация размеров образов

### V2.2 - 2026-02-18
- ✅ Новые функции (wishlist, reviews, compare, notifications)
- ✅ Реферальная программа
- ✅ Поддержка промокодов
- ✅ Тикеты поддержки
- ✅ Обновление зависимостей

### V2.1 - 2026-01-15
- ✅ Telegram бот с aiogram 3.x
- ✅ TON Blockchain платежи
- ✅ 2FA аутентификация

### V2.0 - 2025-12-01
- ✅ Next.js 14 frontend
- ✅ Admin панель
- ✅ Express backend

## 📝 Примечания

### Безопасность
- ✅ Все зависимости без известных CVE (на 2026-02-18)
- ✅ qs обновлён до 6.14.2 (защита от DoS)
- ✅ path-to-regexp зафиксирован на 0.1.12
- ✅ certifi обновлён до 2025.1.31

### Важные замечания
- Все данные администратора хранятся в безопасном виде (bcrypt)
- Платежи через TON Blockchain находятся в тестовом режиме
- Telegram бот требует настройки токена и webhook
- SSL сертификаты должны быть размещены в nginx/ssl/
- Для production измените все пароли в .env

### Лицензия
© 2021-2026 NeymaryShop. Все права защищены.

---

**Версия документа:** 2.2  
**Дата обновления:** 2026-02-18  
**Статус:** ✅ Актуально
