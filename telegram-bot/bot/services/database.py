"""
Сервис для работы с базой данных
"""
import logging
import asyncio
from typing import Optional, List, Dict
from datetime import datetime
import aiosqlite
import random
import string

from bot.config import settings

logger = logging.getLogger(__name__)


class Database:
    """Сервис для работы с SQLite"""
    
    def __init__(self):
        self.db_path = "bot_data.db"
        self._conn: Optional[aiosqlite.Connection] = None
    
    async def connect(self):
        """Подключение к базе данных"""
        try:
            self._conn = await aiosqlite.connect(self.db_path)
            self._conn.row_factory = aiosqlite.Row
            await self.init_tables()
            logger.info(f"✅ База данных подключена: {self.db_path}")
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к БД: {e}")
            raise
    
    async def disconnect(self):
        """Отключение от базы данных"""
        if self._conn:
            await self._conn.close()
    
    async def init_tables(self):
        """Инициализация таблиц"""
        await self._conn.executescript("""
            -- Категории
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT DEFAULT '📦',
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Товары
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price_android DECIMAL(10, 2) DEFAULT 0,
                price_ios DECIMAL(10, 2) DEFAULT 0,
                image_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            );

            -- Пользователи
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                language_code TEXT DEFAULT 'ru',
                is_bot BOOLEAN DEFAULT FALSE,
                mode TEXT DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Реферальные коды
            CREATE TABLE IF NOT EXISTS referral_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                code TEXT UNIQUE NOT NULL,
                is_custom BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            -- Реферальные связи
            CREATE TABLE IF NOT EXISTS referrals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                referrer_id INTEGER NOT NULL,
                referred_id INTEGER NOT NULL,
                referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                made_purchase BOOLEAN DEFAULT FALSE,
                purchase_amount DECIMAL(10, 2) DEFAULT 0,
                reward_earned DECIMAL(10, 2) DEFAULT 0,
                FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(referrer_id, referred_id)
            );
            
            -- Балансы пользователей
            CREATE TABLE IF NOT EXISTS user_balances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                bonus_balance DECIMAL(10, 2) DEFAULT 0,
                total_earned DECIMAL(10, 2) DEFAULT 0,
                total_spent DECIMAL(10, 2) DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            
            -- Избранные товары
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, product_id)
            );
            
            -- Корзина
            CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                platform TEXT DEFAULT 'android',
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, product_id, platform)
            );
            
            -- Заказы
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                telegram_id INTEGER NOT NULL,
                email TEXT,
                status TEXT DEFAULT 'pending',
                total_amount DECIMAL(10, 2) NOT NULL,
                payment_method TEXT,
                payment_status TEXT DEFAULT 'pending',
                items_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            
            -- Позиции заказов
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER,
                product_name TEXT NOT NULL,
                product_price DECIMAL(10, 2) NOT NULL,
                quantity INTEGER DEFAULT 1,
                subtotal DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );
            
            -- Фото продуктов
            CREATE TABLE IF NOT EXISTS product_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                photo_url TEXT NOT NULL,
                photo_file_id TEXT,
                is_primary BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            );
            
            -- Фото категорий
            CREATE TABLE IF NOT EXISTS category_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                photo_url TEXT NOT NULL,
                photo_file_id TEXT,
                is_primary BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            );
            
            -- Индексы
            CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_referral_codes ON referral_codes(code);
            CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

            -- Уведомления
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT DEFAULT 'info',
                title TEXT NOT NULL,
                message TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

            -- Промокоды
            CREATE TABLE IF NOT EXISTS promo_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                used_by INTEGER,
                used_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
            );
            CREATE INDEX IF NOT EXISTS idx_promo_codes ON promo_codes(code);
        """)
        await self._conn.commit()
        logger.info("✅ Таблицы базы данных инициализированы")
    
    async def get_or_create_user(self, telegram_id: int, username: str = None,
                                  first_name: str = None, last_name: str = None,
                                  language_code: str = 'ru') -> Dict:
        """Получить или создать пользователя"""
        logger.info(f"get_or_create_user called, db object id: {id(self)}, conn: {self._conn}")
        async with self._conn.execute(
            "SELECT * FROM users WHERE telegram_id = ?", (telegram_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
        
        async with self._conn.execute(
            """INSERT INTO users (telegram_id, username, first_name, last_name, language_code)
               VALUES (?, ?, ?, ?, ?)""",
            (telegram_id, username, first_name, last_name, language_code)
        ) as cursor:
            await self._conn.commit()
            user_id = cursor.lastrowid
        
        await self._conn.execute("INSERT INTO user_balances (user_id) VALUES (?)", (user_id,))
        await self._conn.commit()
        
        random_code = 'ref_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        await self._conn.execute(
            "INSERT INTO referral_codes (user_id, code) VALUES (?, ?)", (user_id, random_code)
        )
        await self._conn.commit()
        
        return {'id': user_id, 'telegram_id': telegram_id, 'mode': 'customer'}
    
    async def get_user_by_telegram_id(self, telegram_id: int) -> Optional[Dict]:
        """Получить пользователя по Telegram ID"""
        async with self._conn.execute(
            "SELECT * FROM users WHERE telegram_id = ?", (telegram_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def set_user_mode(self, telegram_id: int, mode: str) -> bool:
        """Установить режим пользователя (admin/customer)"""
        await self._conn.execute(
            "UPDATE users SET mode = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?",
            (mode, telegram_id)
        )
        await self._conn.commit()
        return True
    
    async def get_referral_code(self, user_id: int) -> Optional[Dict]:
        """Получить реферальный код пользователя"""
        async with self._conn.execute(
            "SELECT * FROM referral_codes WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def get_user_by_referral_code(self, code: str) -> Optional[Dict]:
        """Получить пользователя по реферальному коду"""
        async with self._conn.execute(
            """SELECT u.* FROM users u
               JOIN referral_codes rc ON u.id = rc.user_id
               WHERE rc.code = ?""", (code,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None
    
    async def set_custom_referral_code(self, user_id: int, code: str) -> bool:
        """Установить кастомный реферальный код"""
        try:
            await self._conn.execute(
                "UPDATE referral_codes SET code = ?, is_custom = TRUE WHERE user_id = ?",
                (code, user_id)
            )
            await self._conn.commit()
            return True
        except Exception as e:
            logger.error(f"Ошибка установки кастомного кода: {e}")
            return False
    
    async def get_referral_count(self, user_id: int, with_purchases_only: bool = False) -> int:
        """Получить количество рефералов"""
        query = "SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?"
        if with_purchases_only:
            query += " AND made_purchase = TRUE"
        
        async with self._conn.execute(query, (user_id,)) as cursor:
            row = await cursor.fetchone()
            return row['count'] if row else 0
    
    async def get_referral_tier(self, user_id: int) -> Dict:
        """Получить текущий реферальный уровень"""
        count = await self.get_referral_count(user_id, with_purchases_only=True)
        
        if count >= settings.REFERRAL_TIER_3['min']:
            return settings.REFERRAL_TIER_3
        elif count >= settings.REFERRAL_TIER_2['min']:
            return settings.REFERRAL_TIER_2
        else:
            return settings.REFERRAL_TIER_1
    
    async def get_user_balance(self, user_id: int) -> Dict:
        """Получить баланс пользователя"""
        async with self._conn.execute(
            "SELECT * FROM user_balances WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else {'bonus_balance': 0, 'total_earned': 0, 'total_spent': 0}
    
    async def add_bonus(self, user_id: int, amount: float):
        """Добавить бонусы на баланс"""
        await self._conn.execute(
            """UPDATE user_balances 
               SET bonus_balance = bonus_balance + ?, total_earned = total_earned + ?,
                   updated_at = CURRENT_TIMESTAMP WHERE user_id = ?""",
            (amount, amount, user_id)
        )
        await self._conn.commit()
    
    async def add_to_favorites(self, user_id: int, product_id: int) -> bool:
        """Добавить в избранное"""
        try:
            await self._conn.execute(
                "INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)",
                (user_id, product_id)
            )
            await self._conn.commit()
            return True
        except Exception as e:
            logger.error(f"Ошибка добавления в избранное: {e}")
            return False
    
    async def remove_from_favorites(self, user_id: int, product_id: int) -> bool:
        """Удалить из избранного"""
        await self._conn.execute(
            "DELETE FROM favorites WHERE user_id = ? AND product_id = ?", (user_id, product_id)
        )
        await self._conn.commit()
        return True
    
    async def get_favorites(self, user_id: int) -> List[Dict]:
        """Получить избранные товары"""
        async with self._conn.execute(
            """SELECT f.*, p.name, p.price_android, p.image_url
               FROM favorites f
               JOIN products p ON f.product_id = p.id
               WHERE f.user_id = ?""", (user_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def add_to_cart(self, user_id: int, product_id: int, quantity: int = 1, 
                          platform: str = 'android') -> bool:
        """Добавить в корзину"""
        try:
            await self._conn.execute(
                """INSERT INTO cart (user_id, product_id, quantity, platform)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(user_id, product_id, platform) 
                   DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP""",
                (user_id, product_id, quantity, platform, quantity)
            )
            await self._conn.commit()
            return True
        except Exception as e:
            logger.error(f"Ошибка добавления в корзину: {e}")
            return False
    
    async def get_cart(self, user_id: int) -> List[Dict]:
        """Получить корзину"""
        async with self._conn.execute(
            """SELECT c.*, p.name, p.price_android, p.image_url
               FROM cart c
               JOIN products p ON c.product_id = p.id
               WHERE c.user_id = ?""", (user_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def clear_cart(self, user_id: int):
        """Очистить корзину"""
        await self._conn.execute("DELETE FROM cart WHERE user_id = ?", (user_id,))
        await self._conn.commit()
    
    async def get_product_photos(self, product_id: int) -> List[Dict]:
        """Получить фото продукта"""
        async with self._conn.execute(
            "SELECT * FROM product_photos WHERE product_id = ? ORDER BY sort_order, is_primary DESC",
            (product_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def add_product_photo(self, product_id: int, photo_url: str, 
                                photo_file_id: str = None, is_primary: bool = False):
        """Добавить фото продукта"""
        await self._conn.execute(
            """INSERT INTO product_photos (product_id, photo_url, photo_file_id, is_primary)
               VALUES (?, ?, ?, ?)""",
            (product_id, photo_url, photo_file_id, is_primary)
        )
        await self._conn.commit()
    
    async def get_category_photos(self, category_id: int) -> List[Dict]:
        """Получить фото категории"""
        async with self._conn.execute(
            "SELECT * FROM category_photos WHERE category_id = ? ORDER BY sort_order, is_primary DESC",
            (category_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
    
    async def add_category_photo(self, category_id: int, photo_url: str,
                                 photo_file_id: str = None, is_primary: bool = False):
        """Добавить фото категории"""
        await self._conn.execute(
            """INSERT INTO category_photos (category_id, photo_url, photo_file_id, is_primary)
               VALUES (?, ?, ?, ?)""",
            (category_id, photo_url, photo_file_id, is_primary)
        )
        await self._conn.commit()

    # ==========================================
    # НОВЫЕ МЕТОДЫ ДЛЯ РАСШИРЕННЫХ ФУНКЦИЙ
    # ==========================================

    async def get_wishlist(self, user_id: int) -> List[Dict]:
        """Получить список избранного (wishlist)"""
        async with self._conn.execute(
            """SELECT f.*, p.name, p.price_android, p.rating_avg, p.image_url
               FROM favorites f
               JOIN products p ON f.product_id = p.id
               WHERE f.user_id = ?
               ORDER BY f.added_at DESC""",
            (user_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def get_wishlist_count(self, user_id: int) -> int:
        """Получить количество товаров в избранном"""
        async with self._conn.execute(
            "SELECT COUNT(*) as count FROM favorites WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return row['count'] if row else 0

    async def get_products_by_ids(self, product_ids: List[int]) -> List[Dict]:
        """Получить товары по списку ID"""
        if not product_ids:
            return []
        
        placeholders = ','.join('?' * len(product_ids))
        async with self._conn.execute(
            f"SELECT * FROM products WHERE id IN ({placeholders})", product_ids
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

    async def get_product(self, product_id: int) -> Optional[Dict]:
        """Получить товар по ID"""
        async with self._conn.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_notifications(self, user_id: int, limit: int = 10, 
                                unread_only: bool = False) -> List[Dict]:
        """Получить уведомления пользователя"""
        query = """
            SELECT * FROM notifications 
            WHERE user_id = ?
        """
        params = [user_id]
        
        if unread_only:
            query += " AND is_read = FALSE"
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        async with self._conn.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def mark_notifications_read_all(self, user_id: int):
        """Отметить все уведомления как прочитанные"""
        await self._conn.execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?", (user_id,)
        )
        await self._conn.commit()

    async def get_referral_info(self, user_id: int) -> Dict:
        """Получить реферальную информацию"""
        balance = await self.get_user_balance(user_id)
        referrals_count = await self.get_referral_count(user_id)
        
        # Получаем общую сумму заработанных бонусов
        async with self._conn.execute(
            """SELECT COALESCE(SUM(reward_earned), 0) as total 
               FROM referrals WHERE referrer_id = ?""", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            total_earned = row['total'] if row else 0
        
        return {
            'balance': balance.get('bonus_balance', 0),
            'referrals_count': referrals_count,
            'total_earned': total_earned
        }

    async def get_referral_stats(self, user_id: int) -> Dict:
        """Получить статистику рефералов"""
        async with self._conn.execute(
            """SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN made_purchase THEN 1 ELSE 0 END) as active,
                COUNT(DISTINCT CASE WHEN made_purchase THEN id END) as orders,
                COALESCE(SUM(reward_earned), 0) as bonuses
               FROM referrals WHERE referrer_id = ?""", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else {'total': 0, 'active': 0, 'orders': 0, 'bonuses': 0}

    async def get_referrals_count(self, user_id: int) -> int:
        """Получить количество рефералов"""
        async with self._conn.execute(
            "SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return row['count'] if row else 0

    async def get_product_reviews(self, product_id: int, limit: int = 10) -> List[Dict]:
        """Получить отзывы о товаре"""
        async with self._conn.execute(
            """SELECT r.*, u.first_name as user_name
               FROM reviews r
               LEFT JOIN users u ON r.user_id = u.id
               WHERE r.product_id = ? AND r.is_approved = TRUE
               ORDER BY r.created_at DESC
               LIMIT ?""", (product_id, limit)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def get_user_orders_count(self, user_id: int) -> int:
        """Получить количество заказов пользователя"""
        async with self._conn.execute(
            "SELECT COUNT(*) as count FROM orders WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return row['count'] if row else 0

    async def add_review(self, user_id: int, product_id: int, rating: int,
                         comment: str = None, pros: str = None, 
                         cons: str = None) -> bool:
        """Добавить отзыв"""
        try:
            await self._conn.execute(
                """INSERT INTO reviews (user_id, product_id, rating, comment, pros, cons, 
                                       is_verified_purchase, is_approved)
                   VALUES (?, ?, ?, ?, ?, ?, FALSE, FALSE)""",
                (user_id, product_id, rating, comment, pros, cons)
            )
            await self._conn.commit()
            return True
        except Exception as e:
            logger.error(f"Ошибка добавления отзыва: {e}")
            return False

    async def get_user_referral_code(self, user_id: int) -> Optional[str]:
        """Получить реферальный код пользователя"""
        async with self._conn.execute(
            "SELECT code FROM referral_codes WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return row['code'] if row else None

    async def create_notification(self, user_id: int, type: str, title: str,
                                  message: str, data: str = None):
        """Создать уведомление"""
        await self._conn.execute(
            """INSERT INTO notifications (user_id, type, title, message, data)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, type, title, message, data)
        )
        await self._conn.commit()

    async def add_referral(self, referrer_id: int, referred_id: int):
        """Добавить реферальную связь"""
        try:
            await self._conn.execute(
                """INSERT OR IGNORE INTO referrals (referrer_id, referred_id)
                   VALUES (?, ?)""",
                (referrer_id, referred_id)
            )
            await self._conn.commit()
        except Exception as e:
            logger.error(f"Ошибка добавления реферала: {e}")

    async def get_categories(self) -> List[Dict]:
        """Получить все категории"""
        async with self._conn.execute(
            "SELECT * FROM categories ORDER BY sort_order, id"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def get_products_by_category(self, category_id: int) -> List[Dict]:
        """Получить товары по категории"""
        async with self._conn.execute(
            """SELECT * FROM products 
               WHERE category_id = ? AND is_active = TRUE
               ORDER BY sort_order, id""",
            (category_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def get_product(self, product_id: int) -> Optional[Dict]:
        """Получить товар по ID"""
        async with self._conn.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_notifications(self, user_id: int, limit: int = 10,
                                unread_only: bool = False) -> List[Dict]:
        """Получить уведомления пользователя"""
        query = """
            SELECT * FROM notifications
            WHERE user_id = ?
        """
        params = [user_id]

        if unread_only:
            query += " AND is_read = FALSE"

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        async with self._conn.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def mark_notification_read_all(self, user_id: int):
        """Отметить все уведомления как прочитанные"""
        await self._conn.execute(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?", (user_id,)
        )
        await self._conn.commit()

    async def clear_notifications(self, user_id: int):
        """Удалить все уведомления"""
        await self._conn.execute(
            "DELETE FROM notifications WHERE user_id = ?", (user_id,)
        )
        await self._conn.commit()

    async def set_custom_referral_code(self, user_id: int, code: str) -> bool:
        """Установить кастомный реферальный код"""
        try:
            # Проверяем уникальность
            async with self._conn.execute(
                "SELECT id FROM referral_codes WHERE code = ?", (code,)
            ) as cursor:
                if await cursor.fetchone():
                    return False
            
            await self._conn.execute(
                "UPDATE referral_codes SET code = ?, is_custom = TRUE WHERE user_id = ?",
                (code, user_id)
            )
            await self._conn.commit()
            return True
        except Exception as e:
            logger.error(f"Ошибка установки кастомного кода: {e}")
            return False

    async def deduct_balance(self, user_id: int, amount: float) -> bool:
        """Списать средства с баланса"""
        async with self._conn.execute(
            "SELECT bonus_balance FROM user_balances WHERE user_id = ?", (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row or row['bonus_balance'] < amount:
                return False
        
        await self._conn.execute(
            """UPDATE user_balances
               SET bonus_balance = bonus_balance - ?, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ?""",
            (amount, user_id)
        )
        await self._conn.commit()
        return True

    async def create_order(self, user_id: int, telegram_id: int, amount: float,
                          payment_method: str, items_json: str,
                          status: str = 'pending') -> int:
        """Создать заказ"""
        async with self._conn.execute(
            """INSERT INTO orders (user_id, telegram_id, total_amount, payment_method,
                                   items_json, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, telegram_id, amount, payment_method, items_json, status)
        ) as cursor:
            await self._conn.commit()
            return cursor.lastrowid

    async def update_order_status(self, order_id: int, status: str) -> bool:
        """Обновить статус заказа"""
        await self._conn.execute(
            "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (status, order_id)
        )
        await self._conn.commit()
        return True

    async def get_user_orders(self, user_id: int) -> List[Dict]:
        """Получить заказы пользователя"""
        async with self._conn.execute(
            """SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10""",
            (user_id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows] if rows else []

    async def get_promo(self, code: str) -> Optional[Dict]:
        """Получить промокод"""
        async with self._conn.execute(
            "SELECT * FROM promo_codes WHERE code = ?", (code,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def activate_promo(self, code: str, user_id: int) -> bool:
        """Активировать промокод"""
        await self._conn.execute(
            """UPDATE promo_codes SET is_used = TRUE, used_by = ?, used_at = CURRENT_TIMESTAMP
               WHERE code = ?""",
            (user_id, code)
        )
        await self._conn.commit()
        return True

    async def update_order_email(self, order_id: int, email: str) -> bool:
        """Обновить email заказа"""
        await self._conn.execute(
            "UPDATE orders SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (email, order_id)
        )
        await self._conn.commit()
        return True

    async def get_order(self, order_id: int) -> Optional[Dict]:
        """Получить заказ"""
        async with self._conn.execute(
            "SELECT * FROM orders WHERE id = ?", (order_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_orders_by_status(self, status: str = None) -> List[Dict]:
        """Получить заказы по статусу"""
        if status:
            async with self._conn.execute(
                "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20",
                (status,)
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows] if rows else []
        else:
            async with self._conn.execute(
                "SELECT * FROM orders ORDER BY created_at DESC LIMIT 20"
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows] if rows else []

    async def get_shop_stats(self) -> Dict:
        """Получить статистику магазина"""
        stats = {}
        
        async with self._conn.execute("SELECT COUNT(*) as count FROM users") as cursor:
            row = await cursor.fetchone()
            stats['users'] = row['count'] if row else 0
        
        async with self._conn.execute("SELECT COUNT(*) as count FROM orders") as cursor:
            row = await cursor.fetchone()
            stats['orders'] = row['count'] if row else 0
        
        async with self._conn.execute("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'") as cursor:
            row = await cursor.fetchone()
            stats['revenue'] = row['total'] if row else 0
        
        async with self._conn.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'") as cursor:
            row = await cursor.fetchone()
            stats['pending'] = row['count'] if row else 0
        
        async with self._conn.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'") as cursor:
            row = await cursor.fetchone()
            stats['completed'] = row['count'] if row else 0
        
        return stats

    async def get_users_count(self) -> int:
        """Получить количество пользователей"""
        async with self._conn.execute("SELECT COUNT(*) as count FROM users") as cursor:
            row = await cursor.fetchone()
            return row['count'] if row else 0

    async def set_user_mode(self, telegram_id: int, mode: str) -> bool:
        """Установить режим пользователя (admin/customer)"""
        await self._conn.execute(
            "UPDATE users SET mode = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?",
            (mode, telegram_id)
        )
        await self._conn.commit()
        return True


# Глобальный экземпляр
db = Database()
