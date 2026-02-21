# NeymaryShop - Документация проекта V2

## 📋 Обзор

NeymaryShop - это интернет-магазин цифровых товаров с полной административной панелью, построенный на современном стеке технологий.

## 🏗 Архитектура

### Фронтенд
- **Основной сайт:** Next.js 14.2.15 (App Router)
- **Админ панель:** Next.js 14.2.35 (Pages Router)
- **Стили:** Tailwind CSS
- **Стейт:** React Hooks
- **HTTP клиент:** Axios

### Бэкенд
- **Фреймворк:** Node.js + Express.js
- **База данных:** PostgreSQL 15
- **Кэш:** Redis 7
- **Аутентификация:** JWT + bcrypt
- **Типизация:** TypeScript

### Инфраструктура
- **Контейнеризация:** Docker + Docker Compose
- **Веб-сервер:** Nginx (reverse proxy)
- **Платежи:** TON Blockchain
- **Уведомления:** Telegram Bot

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
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Основной сайт (Next.js)
│   ├── app/
│   │   ├── (page.tsx)
│   │   ├── cart/
│   │   ├── catalog/
│   │   └── contacts/
│   ├── styles/
│   ├── Dockerfile
│   └── package.json
├── database/                 # Миграции БД
│   ├── init.sql
│   └── migrations/
├── nginx/                    # Конфигурация Nginx
├── telegram-bot/              # Telegram бот
├── docker-compose.yml         # Конфигурация Docker
└── .env                     # Переменные окружения
```

## 🚀 Запуск проекта

### Требования
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15
- Redis 7

### Быстрый запуск
```bash
# Запуск всех сервисов
docker-compose up -d --build

# Проверка статуса
docker-compose ps
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

### Администраторы
- Отдельный механизм аутентификации
- Таблица admin_roles для разграничения прав
- Сессии с истечением срока действия

## 📦 Основные функции

### Интернет-магазин
- 📋 Каталог товаров с категориями
- 🛒 Корзина с обновлением в реальном времени
- 💳 Оформление заказа
- 📱 Мультиплатформенность (Android/PC/iOS)
- 👤 Профиль пользователя

### Администрирование
- 📊 Статистика заказов и выручки
- 📦 Управление товарами и категориями
- 🔄 Управление статусами заказов
- 👥 Управление пользователями
- ⚙️ Настройки системы

### Интеграции
- 💎 TON Blockchain платежи
- 📱 Telegram бот для уведомлений
- 📧 Email уведомления

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

### Миграции
Автоматический запуск миграций при старте PostgreSQL через Docker volumes.

## ⚙️ Конфигурация

### Переменные окружения (.env)
```env
# База данных
POSTGRES_DB=neymaryshop
POSTGRES_USER=neymary
POSTGRES_PASSWORD=...

# Redis
REDIS_PASSWORD=...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# TON Blockchain
TON_NETWORK=mainnet|testnet
TON_WALLET_ADDRESS=...
TON_WALLET_MNEMONIC=...

# Telegram
TELEGRAM_BOT_TOKEN=...

# URLs
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
```

### Сборка
```bash
# Продакшн сборка
docker-compose up -d --build

# Отладка
docker-compose logs [service_name]
```

## 🚨 Текущие проблемы и пути решения

### 1. ❌ Next.js App Router проблемы
**Проблема:** Конфликт между App Router в frontend и Pages Router в admin
**Симптомы:** Ошибки компиляции frontend с VAR_ORIGINAL_PATHNAME
**Решение:** 
- Использовать Pages Router для обоих проектов
- Или настроить Next.js 15 для корректной работы App Router

### 2. ❌ Несовместимость версий
**Проблема:** Next.js 15.5.9 требует Node.js 20+
**Симптомы:** Предупреждения о версии Node.js
**Решение:** Понижение до Next.js 14.2.15

### 3. ❌ TypeScript ошибки в бэкенде
**Проблема:** TonPaymentService.ts имеет ошибки типов
**Симптомы:** Ошибки компиляции TypeScript
**Решение:** Исправлены типы и инициализация переменных

### 4. ❌ Отсутствие Redis в docker-compose
**Проблема:** Backend требует Redis, но он не объявлен
**Симптомы:** ECONNREFUSED при подключении к Redis
**Решение:** Добавлен Redis сервис в docker-compose.yml

### 5. ❌ Некорректная команда запуска admin
**Проблема:** Next.js standalone требует специальную команду
**Симптомы:** Предупреждение о невозможности запустить "npm start"
**Решение:** Использовать "node .next/standalone/server.js"

## 🔮 Будущие улучшения

### В ближайшее время
- [ ] Исправить App Router конфигурацию
- [ ] Добавить тестовое покрытие
- [ ] Оптимизировать сборку Docker образов
- [ ] Реализовать кэширование Redis

### Среднесрочные планы
- [ ] Микросервисная архитектура
- [ ] CI/CD пайплайны
- [ ] Мониторинг и логирование
- [ ] API Rate Limiting

### Долгосрочные цели
- [ ] PWA версия
- [ ] Мобильное приложение
- [ ] Система аналитики
- [ ] Multi-tenant архитектура

## 📞 Поддержка

### Логирование
```bash
# Просмотр логов всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs admin
docker-compose logs frontend
```

### Диагностика
```bash
# Проверка здоровья сервисов
curl http://localhost:3002/health

# Статус контейнеров
docker-compose ps

# Перезапуск сервисов
docker-compose restart [service_name]
```

## 📝 Примечания

- Все данные администратора хранятся в безопасном виде
- Платежи через TON Blockchain находятся в тестовом режиме
- Telegram бот требует настройки токена и webhook
- SSL сертификаты должны быть размещены в nginx/ssl/

---

**Версия документа:** 2.0  
**Дата обновления:** 2026-02-10