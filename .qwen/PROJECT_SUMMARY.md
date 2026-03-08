# NeymaryShop Marketplace - Complete Project Summary

**Version:** 2.5 (Latest Update: 2026-03-01)  
**Tech Stack:** TypeScript, Next.js 14, Express, PostgreSQL 15, Redis 7, Docker Compose  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Completed Tasks (2026-03-01)](#completed-tasks-2026-03-01)
4. [File Structure](#file-structure)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Design System](#design-system)
8. [Quick Start](#quick-start)
9. [Environment Variables](#environment-variables)
10. [Testing Checklist](#testing-checklist)
11. [Changelog](#changelog)

---

## 📊 Project Overview

**NeymaryShop** is a modern digital goods marketplace with automatic delivery. Built with TypeScript, Next.js (Pages Router), Express, PostgreSQL, and Redis. Full Docker support for production deployment.

### Key Features
- 🛒 E-commerce platform for digital goods (games, subscriptions, accounts)
- 🤖 Telegram bot integration for notifications and sales
- 🔐 Admin panel with full CRUD management
- 💳 Manual payment system (Card + SBP)
- 📦 Automatic delivery codes
- 🎨 Dark theme with monospace font
- 📱 Mobile-first responsive design
- 🔄 Platform-aware content (iOS/macOS vs Windows/Android)

---

## 🏗 Architecture

### Frontend
- **Framework:** Next.js 14.2.35 (Pages Router)
- **Styling:** Tailwind CSS 3.4.17
- **State:** React Hooks + Context API
- **HTTP Client:** Axios 1.8.2
- **TypeScript:** 5.7.3

### Backend
- **Framework:** Node.js + Express.js 4.21.2
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Auth:** JWT + bcrypt 3.0.2
- **TypeScript:** 5.7.3

### Telegram Bot
- **Framework:** Python 3.9+ + aiogram 3.18.0
- **Database:** SQLite + asyncpg 0.30.0
- **Cache:** Redis 5.2.1

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **Payments:** Manual (Card + SBP)
- **Notifications:** Telegram Bot

---

## ✅ Completed Tasks (2026-03-01)

### 1. Categories Data Integration ✅
- **Created:** `frontend/src/data/categories.ts`
- **Source:** `steam.txt` file with 38 categories
- **Interface:** Category with id, category, slug, emojis[], description, faq[]
- **Features:**
  - Type-safe category data
  - FAQ with emoji icons
  - Long-form descriptions
  - Export functions: `getCategoryBySlug()`, `getAllCategories()`, `searchCategories()`

### 2. Cart Logic Improvements ✅
- **Fixed:** Duplicate items now increment quantity instead of creating duplicates
- **Added:** `increment(id)` and `decrement(id)` methods
- **Auto-remove:** Items with quantity < 1 are automatically removed
- **Files modified:**
  - `frontend/pages/product/[id].tsx` - handleAddToCart with duplicate check
  - `frontend/pages/cart.tsx` - increment/decrement methods, auto-remove logic

### 3. Checkout & Payment Redesign ✅
- **Removed:** External payment API calls
- **Removed:** TON cryptocurrency payment (will be added later)
- **Added:** Manual payment details display
- **Payment methods:**
  - Card (RF) - 2200 7012 3242 4173 (Константин И., Т-Банк)
  - SBP - +7 (931) 104-38-39 (Т-Банк)
- **Files modified:**
  - `frontend/pages/checkout.tsx` - getPaymentDetails function (card + SBP only)
  - `frontend/pages/checkout/success.tsx` - Payment details UI with copy buttons

### 4. Header Redesign ✅
- **Simplified:** Only logo and cart icon
- **Removed:** Support link, catalog link from header
- **File modified:** `frontend/components/Header.tsx`

### 5. Homepage Redesign ✅
- **Removed:** Old hero banner "Цифровые товары с мгновенной выдачей..."
- **Removed:** "ПЕРЕЙТИ В КАТАЛОГ" button
- **Added:** Large category cards grid (donatov.net style)
- **Features:**
  - Category cards with emoji icons
  - Hover effects and gradients
  - Category descriptions
  - Emoji set preview
- **File modified:** `frontend/pages/index.tsx`

### 6. Category Page with FAQ ✅
- **Data source:** `frontend/src/data/categories.ts`
- **Features:**
  - Category icon and title at top
  - FAQ block with emoji icons (❓ questions)
  - Long description before products
- **File created:** `frontend/src/data/categories.ts`

### 7. Sticky Footer Implementation ✅
- **CSS:** flex flex-col min-h-screen
- **Content:** flex-grow
- **Footer:** mt-auto (always at bottom)
- **File modified:** `frontend/styles/globals.css`

### 8. Footer Content Update ✅
- **Brand:** NeymaryShop
- **Links:** Каталог, Соглашение, Политика, Поддержка, TG канал
- **Copyright:** © 2021-2026 NeymaryShop
- **Owner:** ИП Ионцев К.К. (сделка между физлицами)
- **Origin marker:** Origin: Web
- **File modified:** `frontend/components/Footer.tsx`

### 9. Database Migration ✅
- **Added 38 categories** with full content:
  - Games (15): Steam, Epic Games, Origin, Ubisoft, Battle.net, Xbox, PlayStation, Nintendo, Roblox, Fortnite, Minecraft, Genshin, PUBG, Valorant, LoL
  - Subscriptions (11): Telegram Premium, YouTube Premium, Spotify, Netflix, Disney+, HBO Max, Amazon Prime, Apple Music, Яндекс Плюс, VK Музыка
  - Accounts (5): Discord, FACEIT, ESEA, ChatGPT Plus, Midjourney
  - VPN & Security (2): VPN, Антивирусы
  - Education (3): Coursera, Udemy, Skillshare
  - Other (3): Gift Cards, Software, Mobile Apps
- **File:** `database/migrations/004_add_categories.sql`

---

## 📁 File Structure

```
neymaryshop/
├── frontend/
│   ├── src/data/
│   │   └── categories.ts          # 38 categories with FAQ
│   ├── pages/
│   │   ├── index.tsx              # Homepage with category grid
│   │   ├── cart.tsx               # Cart with increment/decrement
│   │   ├── checkout.tsx           # Manual payment details
│   │   └── checkout/success.tsx   # Order success with payment info
│   ├── components/
│   │   ├── Header.tsx             # Logo + cart only
│   │   └── Footer.tsx             # Full footer with links
│   └── styles/
│       └── globals.css            # Sticky footer CSS
├── backend/
│   └── src/
│       ├── index.ts               # Main server with CORS fix
│       ├── database.ts            # Shared DB pool
│       └── routes/
│           ├── adminOrders.ts     # Admin orders (no pool.end)
│           ├── adminProducts.ts   # Admin products CRUD
│           └── upload.ts          # Image upload endpoints
├── database/
│   └── migrations/
│       ├── 003_add_faq_and_source_fields.sql
│       └── 004_add_categories.sql
├── admin/
│   └── pages/
│       ├── index.tsx              # Admin login
│       ├── dashboard.tsx          # Admin dashboard
│       ├── orders.tsx             # Orders management
│       └── products.tsx           # Products management
├── telegram-bot/
│   └── bot/
│       ├── handlers/
│       ├── services/
│       └── middlewares/
├── .qwen/
│   └── PROJECT_SUMMARY.md         # This file
├── docker-compose.yml
├── README.md
├── CHANGELOG.md
├── QUICKSTART.md
└── SETUP.md
```

---

## 📊 Database Schema

### Categories (new fields)
```sql
source VARCHAR(10) DEFAULT 'web'  -- 'web' or 'tg'
art_url VARCHAR(500)              -- Category art image
long_description TEXT             -- SEO description
faq_json JSONB DEFAULT '[]'       -- FAQ array
emoji_set VARCHAR(100)            -- Emoji set
show_on_main BOOLEAN DEFAULT true -- Show on homepage
```

### Products (new fields)
```sql
source VARCHAR(10) DEFAULT 'web'  -- 'web' or 'tg'
rating DECIMAL(3,2) DEFAULT 0     -- Product rating
reviews_count INTEGER DEFAULT 0   -- Review count
```

### Orders
```sql
id, user_id, status, payment_method, customer_email, customer_telegram
subtotal, discount_amount, total_amount, payment_status
created_at, updated_at, completed_at
```

---

## 🔗 API Endpoints

### Categories
- `GET /api/categories` - All categories
- `GET /api/admin/products` - Admin products (no cache)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order with code
- `GET /api/admin/orders` - Admin orders list

### Upload
- `POST /api/upload/product-image` - Upload product image
- `POST /api/upload/category-image` - Upload category image

### Auth
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - User profile

---

## 🎨 Design System

### Colors
- BG Primary: `#0a0a0a`
- BG Secondary: `#111111`
- BG Card: `#16213e`
- Text Primary: `#e0e0e0`
- Accent: `#00ff9d`
- Accent Hover: `#00cc7d`

### Font
- Monospace: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`

### Components
- **TrustBadges:** ⚡ Мгновенная выдача, 🔒 TON защита, 🎧 Поддержка 24/7
- **Category Cards:** Large grid with emoji, hover effects
- **Sticky Footer:** Always at bottom with flexbox

---

## 🚀 Quick Start

### Docker (recommended)
```bash
# Start all services
docker-compose up -d redis postgres backend frontend admin

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all
docker-compose down
```

### Local development
```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_DB=neymaryshop -e POSTGRES_USER=neymary -e POSTGRES_PASSWORD=neymary123 postgres:15-alpine

# Terminal 3: Backend
cd backend && npm install && npm run dev

# Terminal 4: Frontend
cd frontend && npm install && npm run dev

# Terminal 5: Admin
cd admin && npm install && npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002/api
- Admin Panel: http://localhost:3003

### Admin Credentials
- Email: admin@neymaryshop.com
- Password: admin123

---

## 🔧 Environment Variables

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
- [x] Cart allows duplicate items (increments quantity)
- [x] Decrement below 1 removes item
- [x] increment/decrement methods work

### Checkout
- [x] Checkout shows payment details
- [x] Success page shows payment info
- [x] Only Card and SBP payment methods available

### UI
- [x] Header shows only cart icon
- [x] Homepage shows category grid
- [x] Footer sticky at bottom
- [x] All 38 categories in database

### Backend
- [x] CORS works for admin panel
- [x] Admin can login and view orders
- [x] Image upload endpoints work

---

## 📝 Changelog

### V2.5 (2026-03-01)
- ✅ Added 38 categories with FAQ from steam.txt
- ✅ Fixed cart duplicate items logic
- ✅ Added manual payment system (Card + SBP)
- ✅ Removed crypto payment (TON)
- ✅ Redesigned homepage with category grid
- ✅ Simplified header (logo + cart only)
- ✅ Implemented sticky footer
- ✅ Updated footer with all legal links

### V2.4 (2026-02-24)
- ✅ Frontend conversion redesign
- ✅ Trust badges component
- ✅ Urgency banners
- ✅ 2-step checkout
- ✅ Post-purchase modal with referrals
- ✅ A/B testing for CTA buttons

### V2.3 (2026-02-18)
- ✅ Docker release
- ✅ Full infrastructure setup
- ✅ Admin panel integration
- ✅ Telegram bot integration

### V2.2 (2026-02-15)
- ✅ New features API (wishlist, reviews, compare)
- ✅ Frontend pages (catalog, compare, wishlist, notifications)
- ✅ Dependency updates with security patches

### V2.1 (2026-02-10)
- ✅ Telegram bot critical fixes
- ✅ Database name unification (neymaryshop)
- ✅ Logging improvements for Docker

---

## 📞 Support

- **Telegram:** @neymaryshop_support
- **Email:** support@neymaryshop.com
- **Owner:** ИП Ионцев К.К. (сделка между физическими лицами)

---

## 📄 License

MIT License

---

**Generated:** 2026-03-01  
**Status:** ✅ All tasks completed successfully  
**Build:** ✅ Frontend compiled successfully (Next.js 14.2.35)
  
  
## ?? Commission Rates & Loyalty System  
  
### Base Commission  
- Standard (Windows/Android/Linux): +13%% from cost  
- Premium (macOS/iOS): +15%% from cost  
  
### Loyalty Tiers  
- ?? Bronze: 0%% discount (0 purchases)  
- ?? Silver: 3%% discount (3+ purchases OR 3000?+ spent)  
- ?? Gold: 5%% discount (7+ purchases OR 10000?+ spent)  
- ?? Platinum: 8%% discount (15+ purchases OR 25000?+ spent)  
  
### Formula  
```  
Final Price = Cost ? (1 + PlatformRate) ? (1 - LoyaltyDiscount)  
```  
  
### Examples  
- 1000? cost, Standard, Bronze: 1130?  
- 1000? cost, Premium, Bronze: 1150?  
- 1000? cost, Standard, Gold: 1073.50? (save 56.50?!)  
- 1000? cost, Premium, Platinum: 1058? (save 92?!) 
