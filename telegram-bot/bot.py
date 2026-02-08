import os
import asyncio
import logging
from datetime import datetime
from typing import Optional
import aiohttp
from pathlib import Path

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.redis import RedisStorage
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
import asyncpg
from redis import asyncio as aioredis

# Логирование
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Конфигурация
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DATABASE_URL = os.getenv('DATABASE_URL')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')
ADMIN_IDS = [int(x) for x in os.getenv('ADMIN_IDS', '').split(',') if x]
BACKEND_URL = os.getenv('BACKEND_URL', 'http://backend:3001')

# FSM States
class AddProductStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_category = State()
    waiting_for_cost = State()
    waiting_for_commission = State()
    waiting_for_image = State()

class AddCategoryStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_slug = State()
    waiting_for_description = State()
    waiting_for_icon = State()

class DeleteStates(StatesGroup):
    waiting_for_id = State()

class BroadcastStates(StatesGroup):
    waiting_for_message = State()

# Database pool
db_pool: Optional[asyncpg.Pool] = None

async def init_db():
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=5, command_timeout=60)
    logger.info("Database pool initialized")

async def close_db():
    global db_pool
    if db_pool:
        await db_pool.close()

def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

# Bot setup
redis = aioredis.from_url(REDIS_URL)
storage = RedisStorage(redis)
bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher(storage=storage)
router = Router()

# Функция загрузки файла в backend
async def upload_file(file_data: bytes, filename: str, mime_type: str) -> dict:
    try:
        async with aiohttp.ClientSession() as session:
            form = aiohttp.FormData()
            form.add_field('file', file_data, filename=filename, content_type=mime_type)
            async with session.post(f'{BACKEND_URL}/api/upload', data=form) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        logger.error(f"Upload error: {e}")
    return None

# === КОМАНДЫ ===

@router.message(Command("start"))
async def cmd_start(message: Message):
    if not is_admin(message.from_user.id):
        await message.answer("⛔ Доступ запрещён.")
        return
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📦 Добавить товар"), KeyboardButton(text="📂 Добавить категорию")],
            [KeyboardButton(text="📋 Список товаров"), KeyboardButton(text="📁 Список категорий")],
            [KeyboardButton(text="❌ Удалить товар"), KeyboardButton(text="🗑 Удалить категорию")],
            [KeyboardButton(text="📊 Статистика"), KeyboardButton(text="📢 Рассылка")]
        ],
        resize_keyboard=True
    )
    
    await message.answer(
        "🎮 <b>NeymaryShop Admin Bot</b>\n\n"
        "Используйте кнопки меню для управления магазином:",
        parse_mode="HTML",
        reply_markup=keyboard
    )

# === КАТЕГОРИИ ===

@router.message(F.text == "📂 Добавить категорию")
async def add_category_start(message: Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    await message.answer("Введите название категории:", reply_markup=ReplyKeyboardRemove())
    await state.set_state(AddCategoryStates.waiting_for_name)

@router.message(AddCategoryStates.waiting_for_name)
async def add_category_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    await message.answer("Введите slug (латиницей, без пробелов):")
    await state.set_state(AddCategoryStates.waiting_for_slug)

@router.message(AddCategoryStates.waiting_for_slug)
async def add_category_slug(message: Message, state: FSMContext):
    slug = message.text.lower().strip()
    if not slug.replace('-', '').replace('_', '').isalnum():
        await message.answer("❌ Только латиница, цифры и дефис:")
        return
    await state.update_data(slug=slug)
    await message.answer("Описание (или /skip):")
    await state.set_state(AddCategoryStates.waiting_for_description)

@router.message(AddCategoryStates.waiting_for_description)
async def add_category_desc(message: Message, state: FSMContext):
    desc = None if message.text == '/skip' else message.text
    await state.update_data(description=desc)
    await message.answer("Отправьте картинку или /skip:")
    await state.set_state(AddCategoryStates.waiting_for_icon)

@router.message(AddCategoryStates.waiting_for_icon, F.photo)
async def add_category_icon(message: Message, state: FSMContext):
    try:
        file = await bot.get_file(message.photo[-1].file_id)
        file_data = await bot.download_file(file.file_path)
        
        upload_result = await upload_file(
            file_data.read(),
            f'cat_{datetime.now().timestamp()}.jpg',
            'image/jpeg'
        )
        
        if upload_result:
            await state.update_data(icon_url=upload_result['url'])
        await save_category(message, state)
    except Exception as e:
        logger.error(f"Icon upload error: {e}")
        await message.answer("❌ Ошибка загрузки")
        await state.clear()

@router.message(AddCategoryStates.waiting_for_icon, F.text == "/skip")
async def add_category_skip_icon(message: Message, state: FSMContext):
    await save_category(message, state)

async def save_category(message: Message, state: FSMContext):
    try:
        data = await state.get_data()
        async with db_pool.acquire() as conn:
            cat_id = await conn.fetchval(
                "INSERT INTO categories (name, slug, description, icon_url, is_active) "
                "VALUES ($1, $2, $3, $4, true) RETURNING id",
                data['name'], data['slug'], data.get('description'), data.get('icon_url')
            )
        
        await message.answer(
            f"✅ Категория #{cat_id} создана!\n"
            f"Название: {data['name']}\n"
            f"Slug: {data['slug']}",
            parse_mode="HTML"
        )
        await state.clear()
    except Exception as e:
        logger.error(f"Save category error: {e}")
        await message.answer("❌ Ошибка сохранения")
        await state.clear()

@router.message(F.text == "📁 Список категорий")
async def list_categories(message: Message):
    if not is_admin(message.from_user.id):
        return
    try:
        async with db_pool.acquire() as conn:
            cats = await conn.fetch("SELECT id, name, slug, is_active FROM categories ORDER BY name")
        
        if not cats:
            await message.answer("📂 Категорий нет")
            return
        
        text = "📂 <b>Категории:</b>\n\n"
        for c in cats:
            status = "✅" if c['is_active'] else "❌"
            text += f"{status} #{c['id']} - {c['name']} (<code>{c['slug']}</code>)\n"
        
        await message.answer(text, parse_mode="HTML")
    except Exception as e:
        logger.error(f"List categories error: {e}")

# === ТОВАРЫ ===

@router.message(F.text == "📦 Добавить товар")
async def add_product_start(message: Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    await message.answer("Введите название товара:", reply_markup=ReplyKeyboardRemove())
    await state.set_state(AddProductStates.waiting_for_name)

@router.message(AddProductStates.waiting_for_name)
async def add_product_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    
    # Показываем доступные категории
    async with db_pool.acquire() as conn:
        cats = await conn.fetch("SELECT id, name, slug FROM categories WHERE is_active = true")
    
    cat_list = "\n".join([f"{c['id']} - {c['name']}" for c in cats])
    await message.answer(f"Выберите категорию (ID или slug):\n\n{cat_list}")
    await state.set_state(AddProductStates.waiting_for_category)

@router.message(AddProductStates.waiting_for_category)
async def add_product_category(message: Message, state: FSMContext):
    cat_input = message.text.strip()
    
    async with db_pool.acquire() as conn:
        if cat_input.isdigit():
            cat = await conn.fetchrow("SELECT id FROM categories WHERE id = $1", int(cat_input))
        else:
            cat = await conn.fetchrow("SELECT id FROM categories WHERE slug = $1", cat_input)
    
    if not cat:
        await message.answer("❌ Категория не найдена:")
        return
    
    await state.update_data(category_id=cat['id'])
    await message.answer("Себестоимость (₽):")
    await state.set_state(AddProductStates.waiting_for_cost)

@router.message(AddProductStates.waiting_for_cost)
async def add_product_cost(message: Message, state: FSMContext):
    try:
        cost = float(message.text)
        await state.update_data(cost_price=cost)
        await message.answer("Комиссия (%):")
        await state.set_state(AddProductStates.waiting_for_commission)
    except ValueError:
        await message.answer("❌ Введите число:")

@router.message(AddProductStates.waiting_for_commission)
async def add_product_commission(message: Message, state: FSMContext):
    try:
        commission = float(message.text)
        await state.update_data(commission=commission)
        await message.answer("Отправьте картинку товара или /skip:")
        await state.set_state(AddProductStates.waiting_for_image)
    except ValueError:
        await message.answer("❌ Введите число:")

@router.message(AddProductStates.waiting_for_image, F.photo)
async def add_product_image(message: Message, state: FSMContext):
    try:
        file = await bot.get_file(message.photo[-1].file_id)
        file_data = await bot.download_file(file.file_path)
        
        upload_result = await upload_file(
            file_data.read(),
            f'prod_{datetime.now().timestamp()}.jpg',
            'image/jpeg'
        )
        
        if upload_result:
            await state.update_data(image_url=upload_result['url'])
        
        await save_product(message, state)
    except Exception as e:
        logger.error(f"Image upload error: {e}")
        await message.answer("❌ Ошибка загрузки")
        await state.clear()

@router.message(AddProductStates.waiting_for_image, F.text == "/skip")
async def add_product_skip_image(message: Message, state: FSMContext):
    await save_product(message, state)

async def save_product(message: Message, state: FSMContext):
    try:
        data = await state.get_data()
        cost = data['cost_price']
        comm = data['commission']
        base_price = cost * (1 + comm / 100)
        
        async with db_pool.acquire() as conn:
            prod_id = await conn.fetchval(
                "INSERT INTO products (name, category_id, cost_price, commission_percent, "
                "price_android, price_pc, price_ios, image_url, is_active) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING id",
                data['name'], data['category_id'], cost, comm,
                base_price, base_price, base_price * 1.02, data.get('image_url')
            )
        
        await message.answer(
            f"✅ Товар #{prod_id} добавлен!\n"
            f"Название: {data['name']}\n"
            f"Цена: {base_price:.2f} ₽"
        )
        await state.clear()
    except Exception as e:
        logger.error(f"Save product error: {e}")
        await message.answer("❌ Ошибка")
        await state.clear()

@router.message(F.text == "📋 Список товаров")
async def list_products(message: Message):
    if not is_admin(message.from_user.id):
        return
    try:
        async with db_pool.acquire() as conn:
            prods = await conn.fetch(
                "SELECT p.id, p.name, c.name as cat, p.price_android "
                "FROM products p LEFT JOIN categories c ON p.category_id = c.id "
                "ORDER BY p.created_at DESC LIMIT 20"
            )
        
        if not prods:
            await message.answer("📦 Товаров нет")
            return
        
        text = "📦 <b>Товары (последние 20):</b>\n\n"
        for p in prods:
            text += f"#{p['id']} - {p['name']}\n   {p['cat']} • {p['price_android']:.2f} ₽\n\n"
        
        await message.answer(text, parse_mode="HTML")
    except Exception as e:
        logger.error(f"List products error: {e}")

# === УДАЛЕНИЕ ===

@router.message(F.text == "❌ Удалить товар")
async def delete_product_start(message: Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    await state.update_data(delete_type='product')
    await message.answer("Введите ID товара:", reply_markup=ReplyKeyboardRemove())
    await state.set_state(DeleteStates.waiting_for_id)

@router.message(F.text == "🗑 Удалить категорию")
async def delete_category_start(message: Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    await state.update_data(delete_type='category')
    await message.answer("Введите ID категории:", reply_markup=ReplyKeyboardRemove())
    await state.set_state(DeleteStates.waiting_for_id)

@router.message(DeleteStates.waiting_for_id)
async def delete_entity(message: Message, state: FSMContext):
    try:
        entity_id = int(message.text)
        data = await state.get_data()
        
        async with db_pool.acquire() as conn:
            if data['delete_type'] == 'product':
                await conn.execute("DELETE FROM products WHERE id = $1", entity_id)
                await message.answer(f"✅ Товар #{entity_id} удалён")
            else:
                await conn.execute("DELETE FROM categories WHERE id = $1", entity_id)
                await message.answer(f"✅ Категория #{entity_id} удалена")
        
        await state.clear()
    except ValueError:
        await message.answer("❌ Введите число:")
    except Exception as e:
        logger.error(f"Delete error: {e}")
        await message.answer("❌ Ошибка удаления")
        await state.clear()

# === РАССЫЛКА ===

@router.message(F.text == "📢 Рассылка")
async def broadcast_start(message: Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return
    
    # Проверяем уровень админа
    async with db_pool.acquire() as conn:
        admin = await conn.fetchrow(
            "SELECT ar.level FROM admin_users au "
            "JOIN admin_roles ar ON au.role_id = ar.id "
            "JOIN users u ON au.user_id = u.id "
            "WHERE u.telegram_id = $1",
            message.from_user.id
        )
    
    if not admin or admin['level'] < 80:
        await message.answer("⛔ Нужен уровень администратора 80+")
        return
    
    await message.answer("Введите текст рассылки:", reply_markup=ReplyKeyboardRemove())
    await state.set_state(BroadcastStates.waiting_for_message)

@router.message(BroadcastStates.waiting_for_message)
async def broadcast_send(message: Message, state: FSMContext):
    try:
        async with db_pool.acquire() as conn:
            users = await conn.fetch("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL")
        
        success_count = 0
        for user in users:
            try:
                await bot.send_message(user['telegram_id'], message.text)
                success_count += 1
                await asyncio.sleep(0.05)  # Защита от флуда
            except:
                pass
        
        await message.answer(f"✅ Рассылка завершена!\nОтправлено: {success_count} пользователям")
        await state.clear()
    except Exception as e:
        logger.error(f"Broadcast error: {e}")
        await message.answer("❌ Ошибка рассылки")
        await state.clear()

# === MAIN ===

dp.include_router(router)

async def main():
    await init_db()
    try:
        logger.info("Starting bot...")
        await dp.start_polling(bot)
    finally:
        await close_db()
        await bot.session.close()

if __name__ == '__main__':
    asyncio.run(main())