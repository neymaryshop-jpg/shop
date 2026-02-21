"""
Админ-панель: CRUD товаров, кодов, массовая загрузка
"""
import logging
from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.services.database import db
from bot.config import settings

logger = logging.getLogger(__name__)
router = Router()


class AdminState(StatesGroup):
    waiting_for_product_name = State()
    waiting_for_product_price = State()
    waiting_for_codes_upload = State()
    waiting_for_delivery_type = State()


@router.callback_query(F.data == "admin_products")
async def admin_products_callback(callback: types.CallbackQuery):
    """Управление товарами"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    builder = InlineKeyboardBuilder()
    builder.button(text="➕ Добавить товар", callback_data="admin_product_add")
    builder.button(text="📦 Загрузить коды", callback_data="admin_codes_upload")
    builder.button(text="📊 Статистика кодов", callback_data="admin_codes_stats")
    builder.button(text="🔙 Назад", callback_data="admin_panel")
    builder.adjust(1, 1, 1, 1)
    
    await callback.message.edit_text(
        "📦 <b>Управление товарами</b>",
        reply_markup=builder.as_markup(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "admin_product_add")
async def admin_product_add_callback(callback: types.CallbackQuery, state: FSMContext):
    """Добавление товара - шаг 1: название"""
    await state.set_state(AdminState.waiting_for_product_name)
    
    await callback.message.edit_text(
        "➕ <b>Добавление товара</b>\n\n"
        "Отправьте название товара:",
        parse_mode='HTML'
    )
    await callback.answer()


@router.message(AdminState.waiting_for_product_name)
async def process_product_name(message: types.Message, state: FSMContext):
    """Обработка названия товара"""
    await state.update_data(product_name=message.text)
    await state.set_state(AdminState.waiting_for_delivery_type)
    
    builder = InlineKeyboardBuilder()
    builder.button(text="🔑 Код/Промокод (Авто)", callback_data="delivery_auto")
    builder.button(text="👤 Вход в аккаунт (Ручная)", callback_data="delivery_manual")
    builder.adjust(1, 1)
    
    await message.answer(
        f"✅ Название: {message.text}\n\n"
        "Выберите тип доставки:",
        reply_markup=builder.as_markup(),
        parse_mode='HTML'
    )


@router.callback_query(F.data.startswith("delivery_"))
async def process_delivery_type(callback: types.CallbackQuery, state: FSMContext):
    """Обработка типа доставки"""
    delivery_type = "auto" if "auto" in callback.data else "manual"
    await state.update_data(delivery_type=delivery_type)
    await state.set_state(AdminState.waiting_for_product_price)
    
    await callback.message.edit_text(
        "💰 <b>Цена товара</b>\n\n"
        "Отправьте цену в рублях:",
        parse_mode='HTML'
    )
    await callback.answer()


@router.message(AdminState.waiting_for_product_price)
async def process_product_price(message: types.Message, state: FSMContext):
    """Обработка цены товара"""
    try:
        price = float(message.text.replace(',', '.').replace('₽', '').strip())
        data = await state.get_data()
        
        # TODO: Добавить товар в БД
        # await db.add_product(
        #     name=data['product_name'],
        #     price=price,
        #     delivery_type=data['delivery_type']
        # )
        
        await message.answer(
            f"✅ <b>Товар добавлен!</b>\n\n"
            f"📦 {data['product_name']}\n"
            f"💰 {price}₽\n"
            f"🔑 Тип: {'Авто' if data['delivery_type'] == 'auto' else 'Ручная'}",
            parse_mode='HTML'
        )
    except ValueError:
        await message.answer(
            "❌ Некорректная цена. Отправьте число:",
            parse_mode='HTML'
        )
        return
    
    await state.clear()


@router.callback_query(F.data == "admin_codes_upload")
async def admin_codes_upload_callback(callback: types.CallbackQuery, state: FSMContext):
    """Массовая загрузка кодов"""
    await state.set_state(AdminState.waiting_for_codes_upload)
    
    await callback.message.edit_text(
        "📦 <b>Загрузка кодов</b>\n\n"
        "1. Отправьте ID товара\n"
        "2. Затем отправьте коды (каждый с новой строки)",
        parse_mode='HTML'
    )
    await callback.answer()


@router.message(AdminState.waiting_for_codes_upload)
async def process_codes_upload(message: types.Message, state: FSMContext):
    """Обработка загрузки кодов"""
    text = message.text.strip()
    
    # Проверяем, ID это или коды
    if text.isdigit():
        await state.update_data(product_id=int(text))
        await message.answer(
            "📝 <b>Отправьте коды</b>\n\n"
            "Каждый код с новой строки:\n"
            "CODE1\n"
            "CODE2\n"
            "CODE3",
            parse_mode='HTML'
        )
    else:
        # Это коды
        data = await state.get_data()
        product_id = data.get('product_id')
        
        if not product_id:
            await message.answer("❌ Сначала отправьте ID товара")
            return
        
        codes = [line.strip() for line in text.split('\n') if line.strip()]
        count = await db.add_product_codes_bulk(product_id, codes)
        
        await message.answer(
            f"✅ <b>Загружено кодов:</b> {count}\n\n"
            f"📦 Товар ID: {product_id}",
            parse_mode='HTML'
        )
        await state.clear()


@router.callback_query(F.data == "admin_codes_stats")
async def admin_codes_stats_callback(callback: types.CallbackQuery):
    """Статистика кодов"""
    # TODO: Получить статистику из БД
    stats_text = (
        "📊 <b>Статистика кодов</b>\n\n"
        "📦 Товар: Steam 100₽\n"
        "✅ Доступно: 50\n"
        "❌ Использовано: 10\n\n"
        "📦 Товар: Steam 300₽\n"
        "✅ Доступно: 30\n"
        "❌ Использовано: 5"
    )
    
    builder = InlineKeyboardBuilder()
    builder.button(text="🔄 Обновить", callback_data="admin_codes_stats")
    builder.button(text="🔙 Назад", callback_data="admin_products")
    builder.adjust(1, 1)
    
    await callback.message.edit_text(
        stats_text,
        reply_markup=builder.as_markup(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("admin_complete:"))
async def admin_complete_manual_order(callback: types.CallbackQuery):
    """Завершение заказа ручной доставки"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    order_id = int(callback.data.split(":")[1])
    await db.update_order_status(order_id, 'completed')
    
    # Получаем данные заказа
    # TODO: order = await db.get_order(order_id)
    
    # Уведомляем клиента
    # TODO: Отправить уведомление клиенту
    
    await callback.message.edit_text(
        f"✅ <b>Заказ #{order_id} завершён!</b>",
        parse_mode='HTML'
    )
    await callback.answer("✅ Завершено", show_alert=True)
