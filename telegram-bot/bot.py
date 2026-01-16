import os
import asyncio
import logging
from datetime import datetime
from typing import Optional

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.redis import RedisStorage
from aiogram.types import Message
import asyncpg
from redis import asyncio as aioredis

# Логирование
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Конфигурация
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DATABASE_URL = os.getenv('DATABASE_URL')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')
ADMIN_IDS = [int(x) for x in os.getenv('ADMIN_IDS', '').split(',') if x]

# FSM States для добавления товара
class AddProductStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_category = State()
    waiting_for_cost = State()
    waiting_for_commission = State()

# Database pool
db_pool: Optional[asyncpg.Pool] = None

async def init_db():
    """Инициализация пула подключений к БД"""
    global db_pool
    db_pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=2,
        max_size=5,
        command_timeout=60
    )
    logger.info("Database pool initialized")

async def close_db():
    """Закрытие пула подключений"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database pool closed")

# Проверка админа
def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

# Инициализация бота
redis = aioredis.from_url(REDIS_URL)
storage = RedisStorage(redis)
bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher(storage=storage)

# === КОМАНДЫ ===

@dp.message(Command("start"))
async def cmd_start(message: Message):
    """Приветственное сообщение"""
    if not is_admin(message.from_user.id):
        await message.answer("⛔ У вас нет доступа к этому боту.")
        return
    
    await message.answer(
        "🎮 <b>NeymaryShop Admin Bot</b>\n\n"
        "Доступные команды:\n"
        "/add_product - Добавить новый товар\n"
        "/list_products - Список всех товаров\n"
        "/update_price - Обновить цену товара\n"
        "/view_orders - Просмотр заказов\n"
        "/stats - Статистика продаж\n"
        "/toggle_payment - Вкл/выкл способ оплаты\n"
        "/broadcast - Рассылка пользователям\n"
        "/help - Помощь",
        parse_mode="HTML"
    )

@dp.message(Command("add_product"))
async def cmd_add_product(message: Message, state: FSMContext):
    """Начало процесса добавления товара"""
    if not is_admin(message.from_user.id):
        await message.answer("⛔ У вас нет доступа к этой команде.")
        return
    
    await message.answer(
        "📝 <b>Добавление нового товара</b>\n\n"
        "Введите название товара:",
        parse_mode="HTML"
    )
    await state.set_state(AddProductStates.waiting_for_name)

@dp.message(AddProductStates.waiting_for_name)
async def process_product_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    await message.answer("Введите категорию товара (games, subscriptions, currency, accounts, software, streaming):")
    await state.set_state(AddProductStates.waiting_for_category)

@dp.message(AddProductStates.waiting_for_category)
async def process_product_category(message: Message, state: FSMContext):
    await state.update_data(category=message.text)
    await message.answer("Введите себестоимость (в рублях):")
    await state.set_state(AddProductStates.waiting_for_cost)

@dp.message(AddProductStates.waiting_for_cost)
async def process_product_cost(message: Message, state: FSMContext):
    try:
        cost = float(message.text)
        await state.update_data(cost_price=cost)
        await message.answer("Введите комиссию (в процентах, например: 15):")
        await state.set_state(AddProductStates.waiting_for_commission)
    except ValueError:
        await message.answer("❌ Неверный формат. Введите число:")

@dp.message(AddProductStates.waiting_for_commission)
async def process_product_commission(message: Message, state: FSMContext):
    try:
        commission = float(message.text)
        data = await state.get_data()
        
        # Расчет цен для разных платформ
        cost_price = data['cost_price']
        base_price = cost_price * (1 + commission / 100)
        
        # Получаем category_id
        category_slug = data['category']
        async with db_pool.acquire() as conn:
            category = await conn.fetchrow(
                "SELECT id FROM categories WHERE slug = $1",
                category_slug
            )
            
            if not category:
                await message.answer("❌ Неверная категория. Используйте: games, subscriptions, currency, accounts, software, streaming")
                await state.clear()
                return
            
            # Добавление товара в БД
            product_id = await conn.fetchval(
                """
                INSERT INTO products (name, category_id, cost_price, commission_percent, 
                                     price_android, price_pc, price_ios, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                RETURNING id
                """,
                data['name'], category['id'], cost_price, commission,
                base_price, base_price, base_price * 1.02  # iOS +2%
            )
        
        await message.answer(
            f"✅ <b>Товар успешно добавлен!</b>\n\n"
            f"ID: {product_id}\n"
            f"Название: {data['name']}\n"
            f"Категория: {category_slug}\n"
            f"Себестоимость: {cost_price:.2f} ₽\n"
            f"Комиссия: {commission}%\n"
            f"Цена Android: {base_price:.2f} ₽\n"
            f"Цена PC: {base_price:.2f} ₽\n"
            f"Цена iOS: {base_price * 1.02:.2f} ₽",
            parse_mode="HTML"
        )
        await state.clear()
        
    except ValueError:
        await message.answer("❌ Неверный формат. Введите число:")
    except Exception as e:
        logger.error(f"Error adding product: {e}")
        await message.answer("❌ Ошибка при добавлении товара")
        await state.clear()

@dp.message(Command("list_products"))
async def cmd_list_products(message: Message):
    """Список всех товаров"""
    if not is_admin(message.from_user.id):
        return
    
    try:
        async with db_pool.acquire() as conn:
            products = await conn.fetch(
                """
                SELECT p.id, p.name, c.name as category_name, p.price_android, p.is_active
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY c.sort_order, p.name
                LIMIT 50
                """
            )
        
        if not products:
            await message.answer("📦 Товары не найдены")
            return
        
        text = "📦 <b>Список товаров:</b>\n\n"
        current_category = None
        
        for p in products:
            if p['category_name'] != current_category:
                current_category = p['category_name']
                text += f"\n<b>{current_category}</b>\n"
            
            status = "✅" if p['is_active'] else "❌"
            text += f"{status} ID:{p['id']} - {p['name']} ({p['price_android']:.2f} ₽)\n"
        
        await message.answer(text, parse_mode="HTML")
        
    except Exception as e:
        logger.error(f"Error listing products: {e}")
        await message.answer("❌ Ошибка при получении списка товаров")

@dp.message(Command("view_orders"))
async def cmd_view_orders(message: Message):
    """Просмотр последних заказов"""
    if not is_admin(message.from_user.id):
        return
    
    try:
        async with db_pool.acquire() as conn:
            orders = await conn.fetch(
                """
                SELECT o.id, o.status, o.total_amount, o.created_at,
                       o.customer_telegram, o.payment_method
                FROM orders o
                ORDER BY o.created_at DESC
                LIMIT 20
                """
            )
        
        if not orders:
            await message.answer("📋 Заказы не найдены")
            return
        
        text = "📋 <b>Последние заказы:</b>\n\n"
        
        for o in orders:
            status_emoji = {
                'pending': '⏳',
                'awaiting_confirmation': '⏰',
                'confirmed': '✅',
                'processing': '🔄',
                'completed': '✅',
                'failed': '❌'
            }.get(o['status'], '❓')
            
            text += (
                f"{status_emoji} <b>#{o['id']}</b> - {o['status']}\n"
                f"Сумма: {o['total_amount']:.2f} ₽\n"
                f"Оплата: {o['payment_method']}\n"
                f"Пользователь: @{o['customer_telegram'] or 'unknown'}\n"
                f"Дата: {o['created_at'].strftime('%d.%m.%Y %H:%M')}\n\n"
            )
        
        await message.answer(text, parse_mode="HTML")
        
    except Exception as e:
        logger.error(f"Error viewing orders: {e}")
        await message.answer("❌ Ошибка при получении заказов")

@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    """Статистика продаж"""
    if not is_admin(message.from_user.id):
        return
    
    try:
        async with db_pool.acquire() as conn:
            stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
                    COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
                    COUNT(DISTINCT customer_telegram) as unique_customers
                FROM orders
                WHERE created_at >= NOW() - INTERVAL '30 days'
                """
            )
            
            today_stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as today_orders,
                    COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as today_revenue
                FROM orders
                WHERE created_at >= CURRENT_DATE
                """
            )
        
        text = (
            "📊 <b>Статистика за последние 30 дней:</b>\n\n"
            f"Всего заказов: {stats['total_orders']}\n"
            f"Выполнено: {stats['completed_orders']}\n"
            f"Выручка: {stats['total_revenue']:.2f} ₽\n"
            f"Уникальных клиентов: {stats['unique_customers']}\n\n"
            f"<b>Сегодня:</b>\n"
            f"Заказов: {today_stats['today_orders']}\n"
            f"Выручка: {today_stats['today_revenue']:.2f} ₽"
        )
        
        await message.answer(text, parse_mode="HTML")
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        await message.answer("❌ Ошибка при получении статистики")

@dp.message(Command("toggle_payment"))
async def cmd_toggle_payment(message: Message):
    """Переключить способ оплаты"""
    if not is_admin(message.from_user.id):
        return
    
    try:
        # Получаем текущее состояние
        async with db_pool.acquire() as conn:
            crypto_enabled = await conn.fetchval(
                "SELECT value FROM settings WHERE key = 'payment_crypto_enabled'"
            )
            card_enabled = await conn.fetchval(
                "SELECT value FROM settings WHERE key = 'payment_card_enabled'"
            )
        
        text = (
            "💳 <b>Способы оплаты:</b>\n\n"
            f"Криптовалюта (TON): {'✅ Включено' if crypto_enabled == 'true' else '❌ Выключено'}\n"
            f"Карты РФ: {'✅ Включено' if card_enabled == 'true' else '❌ Выключено'}\n\n"
            "Используйте:\n"
            "/toggle_crypto - переключить криптовалюту\n"
            "/toggle_card - переключить карты"
        )
        
        await message.answer(text, parse_mode="HTML")
        
    except Exception as e:
        logger.error(f"Error getting payment status: {e}")
        await message.answer("❌ Ошибка при получении статуса")

@dp.message(Command("toggle_crypto"))
async def cmd_toggle_crypto(message: Message):
    """Переключить криптовалюту"""
    if not is_admin(message.from_user.id):
        return
    
    try:
        async with db_pool.acquire() as conn:
            current = await conn.fetchval(
                "SELECT value FROM settings WHERE key = 'payment_crypto_enabled'"
            )
            new_value = 'false' if current == 'true' else 'true'
            
            await conn.execute(
                """
                INSERT INTO settings (key, value, updated_at)
                VALUES ('payment_crypto_enabled', $1, NOW())
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
                """,
                new_value
            )
        
        status = "✅ Включена" if new_value == 'true' else "❌ Выключена"
        await message.answer(f"💎 Криптовалюта (TON): {status}")
        
    except Exception as e:
        logger.error(f"Error toggling crypto: {e}")
        await message.answer("❌ Ошибка при переключении")

@dp.message(Command("toggle_card"))
async def cmd_toggle_card(message: Message):
    """Переключить карты"""
    if not is_admin(message.from_user.id):
        return
    
    try:
        async with db_pool.acquire() as conn:
            current = await conn.fetchval(
                "SELECT value FROM settings WHERE key = 'payment_card_enabled'"
            )
            new_value = 'false' if current == 'true' else 'true'
            
            await conn.execute(
                """
                INSERT INTO settings (key, value, updated_at)
                VALUES ('payment_card_enabled', $1, NOW())
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
                """,
                new_value
            )
        
        status = "✅ Включены" if new_value == 'true' else "❌ Выключены"
        await message.answer(f"💳 Карты РФ: {status}")
        
    except Exception as e:
        logger.error(f"Error toggling card: {e}")
        await message.answer("❌ Ошибка при переключении")

@dp.message(Command("help"))
async def cmd_help(message: Message):
    """Помощь"""
    if not is_admin(message.from_user.id):
        return
    
    text = """
📚 <b>Руководство по использованию</b>

<b>Управление товарами:</b>
/add_product - Добавить товар (пошаговый процесс)
/list_products - Список всех товаров

<b>Заказы:</b>
/view_orders - Последние 20 заказов

<b>Статистика:</b>
/stats - Статистика за 30 дней

<b>Способы оплаты:</b>
/toggle_payment - Показать статус
/toggle_crypto - Вкл/выкл криптовалюту
/toggle_card - Вкл/выкл карты РФ

<b>Категории товаров:</b>
• games - Игры
• subscriptions - Подписки
• currency - Валюта
• accounts - Аккаунты
• software - ПО
• streaming - Стриминг
    """
    
    await message.answer(text, parse_mode="HTML")

# === ОСНОВНОЙ ЗАПУСК ===

async def main():
    """Главная функция запуска бота"""
    await init_db()
    
    try:
        logger.info("Starting bot...")
        await dp.start_polling(bot)
    finally:
        await close_db()
        await bot.session.close()

if __name__ == '__main__':
    asyncio.run(main())
