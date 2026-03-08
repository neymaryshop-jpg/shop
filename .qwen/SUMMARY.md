# NeymaryShop Project Summary

**Version:** 2.5  
**Last Update:** 2026-03-08  
**Status:** ✅ Production Ready

---

## 🎯 Project Overview

**NeymaryShop** is a modern digital goods marketplace with automatic delivery. Built with TypeScript, Next.js (Pages Router), Express, PostgreSQL, and Redis. Full Docker support for production deployment.

### Key Features
- 🛒 E-commerce platform for digital goods (games, subscriptions, accounts)
- 🤖 Telegram bot integration for notifications and sales
- 🔐 Admin panel with full CRUD management
- 💳 Manual payment system (Card + SBP)
- 📦 Automatic delivery codes
- 🎨 Dark theme with monospace font
- 📱 Mobile-first responsive design
- ⚡ Platform-aware content (iOS/macOS vs Windows/Android)

---

## 🏗 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Next.js (Pages Router) | 14.2.35 |
| **Frontend UI** | React + Tailwind CSS | 18.3.1 + 3.4.17 |
| **Frontend HTTP** | Axios | 1.13.6 |
| **Backend** | Node.js + Express | 18 + 4.21.2 |
| **Database** | PostgreSQL | 15 |
| **Cache** | Redis | 7 |
| **Bot** | Python + aiogram | 3.9+ + 3.18.0 |
| **Proxy** | Nginx | Alpine |
| **Language** | TypeScript | 5.7.3 |

---

## 📁 Project Structure

```
neymaryshop/
├── frontend/          # Next.js website (port 3000)
│   ├── pages/        # Pages (index, catalog, cart, checkout)
│   ├── components/   # Reusable components
│   ├── src/data/     # Static data (categories)
│   └── utils/        # Platform detection
├── backend/          # Express API (port 3002)
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/ # Auth, logging
│   │   └── services/ # Telegram, 2FA
│   └── dist/         # Compiled code
├── admin/            # Admin panel (port 3003)
│   ├── pages/        # Dashboard, orders, products
│   └── styles/       # Dark theme CSS
├── telegram-bot/     # Telegram bot
│   └── bot/
│       ├── handlers/ # Message handlers
│       ├── services/ # Database
│       └── middlewares/ # Logging
├── database/         # PostgreSQL
│   ├── init.sql      # Schema
│   └── migrations/   # Migrations
├── nginx/            # Reverse proxy
└── docker-compose.yml # Orchestration
```

---

## 🚀 Quick Start

### Docker (Recommended)
```bash
# Start all services
docker-compose up -d redis postgres backend frontend admin

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Local Development
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

### URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3002/api
- **Admin Panel:** http://localhost:3003

### Admin Login
- **Email:** admin@neymaryshop.com
- **Password:** admin123

---

## 📊 Database Schema

### Main Tables
- **users** — Customers and admins
- **products** — Digital goods
- **categories** — Product categories (38 total)
- **orders** — Customer orders
- **order_items** — Order line items
- **product_codes** — Auto-delivery codes
- **admin_sessions** — Admin auth
- **settings** — App settings

### New Fields (v2.5)
```sql
-- Categories
source VARCHAR(10) DEFAULT 'web'
art_url VARCHAR(500)
long_description TEXT
faq_json JSONB DEFAULT '[]'
emoji_set VARCHAR(100)
show_on_main BOOLEAN DEFAULT true

-- Products
source VARCHAR(10) DEFAULT 'web'
rating DECIMAL(3,2) DEFAULT 0
reviews_count INTEGER DEFAULT 0
```

---

## 🎨 Design System

### Colors
```css
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-card: #16213e;
--text-primary: #e0e0e0;
--accent: #00ff9d;
--accent-hover: #00cc7d;
```

### Font
```css
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
```

### Components
- **TrustBadges:** ⚡ Мгновенная выдача, 🔒 TON защита, 🎧 Поддержка 24/7
- **Category Cards:** Large grid with emoji, hover effects
- **Sticky Footer:** Always at bottom via flexbox
- **Platform Badge:** Shows recommended platform

---

## 💰 Pricing & Commission

### Base Commission
- **Standard** (Windows/Android): **+13%**
- **Premium** (macOS/iOS): **+15%**

### Loyalty Discounts
| Tier | Discount | Requirements |
|------|----------|--------------|
| 🥉 Bronze | 0% | 0 purchases |
| 🥈 Silver | 3% | 3+ purchases OR 3000₽+ |
| 🥇 Gold | 5% | 7+ purchases OR 10000₽+ |
| 💎 Platinum | 8% | 15+ purchases OR 25000₽+ |

### Formula
```
Final Price = Cost × (1 + PlatformRate) × (1 - LoyaltyDiscount)
```

---

## ✅ Recent Changes (v2.5)

### Frontend
- ✅ Fixed `next.config.js` (removed invalid `turbopack` option)
- ✅ Updated `axios` to ^1.13.6
- ✅ Downgraded Next.js to 14.2.35 (stable)
- ✅ Added `.env.local` files
- ✅ New components: Header, Footer, TrustBadges, ConversionCTA
- ✅ Platform-aware detection (Windows/Android vs macOS/iOS)
- ✅ Category auto-sorting by platform

### Backend
- ✅ Fixed CORS (flexible origin policy)
- ✅ Optimized Redis (graceful degradation)
- ✅ Refactored `index.ts` structure
- ✅ New routes: `adminProducts`, `orders`
- ✅ Extracted `database.ts` module
- ✅ Added `logger.ts` middleware

### Nginx
- ✅ Fixed admin upstream (`localhost:3003` → `admin:3003`)

### Docker
- ✅ Added proxy variables for all services
- ✅ Improved health checks
- ✅ Optimized Dockerfiles

### Telegram Bot
- ✅ Fixed `admin_products.py` (added DB save)
- ✅ Updated `payment.py` (details + legal info)
- ✅ Improved logging (Docker-compatible)
- ✅ Added `add_product` method to database

### Database
- ✅ Migrations: categories, FAQ, delivery_type
- ✅ Seed data for 38 categories
- ✅ New fields: `source`, `rating_avg`, `reviews_count`

---

## 📝 Changelog

### V2.5 (2026-03-08)
- 🔧 Build fixes (next.config.js, axios, Next.js)
- 🔧 CORS and Redis optimizations
- 🔧 Nginx upstream fixes
- 🔧 Telegram Bot improvements
- 🔧 DB migrations and seed data

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

---

## 🔐 Security

- **qs** locked to 6.14.2 (DoS protection)
- **path-to-regexp** locked to 0.1.12
- **bcryptjs** 3.0.2 for password hashing
- **Helmet** with relaxed CSP for development
- **Rate limiting** on API endpoints
- **JWT** authentication with separate admin sessions

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
**Status:** ✅ All builds successful  
**Build:** Frontend ✓ Backend ✓ Admin ✓
