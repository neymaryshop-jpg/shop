"""
Хэндлеры для бота - NeymaryShop (Донат в игры)
"""
import logging
import re
from datetime import datetime
from aiogram import Router, F, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.keyboards import (
    get_main_menu, get_games_menu, get_topup_countries, get_steam_packages,
    get_payment_methods, get_profile_menu, get_support_keyboard,
    get_admin_panel, get_back_keyboard, get_email_input_keyboard,
    get_code_confirmation_keyboard, get_admin_order_keyboard,
    get_admin_orders_menu, get_admin_promos_keyboard
)
from bot.keyboards_extended import get_main_menu_extended
from bot.services.database import db
from bot.config import settings

logger = logging.getLogger(__name__)
router = Router()

# Хранилище навигации: user_id -> список предыдущих состояний
user_navigation = {}


# ==========================================
# СОСТОЯНИЯ FSM
# ==========================================

class OrderState(StatesGroup):
    waiting_for_email = State()
    waiting_for_code = State()
    waiting_for_promo = State()
    waiting_for_promo_amount = State()


# ==========================================
# НАВИГАЦИЯ
# ==========================================

def get_user_state(user_id: int) -> str:
    """Получить текущее состояние пользователя"""
    return user_navigation.get(user_id, "main_menu")


def set_user_state(user_id: int, state: str):
    """Установить состояние пользователя"""
    user_navigation[user_id] = state


def clear_user_state(user_id: int):
    """Очистить состояние"""
    if user_id in user_navigation:
        del user_navigation[user_id]


# ==========================================
# ОСНОВНЫЕ КОМАНДЫ
# ==========================================

@router.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    """Обработчик команды /start"""
    await state.clear()
    clear_user_state(message.from_user.id)

    user = await db.get_or_create_user(
        telegram_id=message.from_user.id,
        username=message.from_user.username if message.from_user.username else None,
        first_name=message.from_user.first_name if message.from_user.first_name else None,
        last_name=message.from_user.last_name if message.from_user.last_name else None,
        language_code=message.from_user.language_code or 'ru'
    )

    is_admin = message.from_user.id in settings.ADMIN_IDS
    user_mode = user.get('mode', 'customer')

    welcome_text = (
        f"👋 Привет, {message.from_user.first_name}!\n\n"
        f"🎮 Игры: Steam, Valorant, CS2, PUBG\n"
        f"💳 Страны: РФ, УК, КЗ, УЗ, ТР, США, ЕС\n"
        f"🎁 Промокоды: только Steam\n\n"
        f"Выберите раздел:"
    )

    await message.answer(
        welcome_text,
        reply_markup=get_main_menu_extended(is_admin, user_mode),
        parse_mode='HTML'
    )


@router.message(Command("admin-panel"))
async def cmd_admin_panel(message: types.Message, state: FSMContext):
    """Команда /admin-panel для админов"""
    if message.from_user.id not in settings.ADMIN_IDS:
        await message.answer("❌ Доступ запрещён")
        return
    
    await state.clear()
    clear_user_state(message.from_user.id)
    
    user = await db.get_user_by_telegram_id(message.from_user.id)
    if user:
        await db.set_user_mode(message.from_user.id, 'admin')
    
    await message.answer(
        "⚙️ Админ панель",
        reply_markup=get_admin_panel(),
        parse_mode='HTML'
    )


@router.callback_query(F.data == "main_menu")
async def main_menu_callback(callback: types.CallbackQuery, state: FSMContext):
    """Главное меню"""
    await state.clear()
    clear_user_state(callback.from_user.id)
    
    is_admin = callback.from_user.id in settings.ADMIN_IDS
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    user_mode = user.get('mode', 'customer') if user else 'customer'

    await callback.message.edit_text(
        "🎮 <b>NeymaryShop - Главное меню</b>\n\n"
        "👇 <b>Выберите раздел:</b>",
        reply_markup=get_main_menu_extended(is_admin, user_mode),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "nav_back")
async def nav_back_callback(callback: types.CallbackQuery):
    """Кнопка назад - возврат на шаг"""
    current_state = get_user_state(callback.from_user.id)
    
    # Карта переходов назад
    back_map = {
        "games": "main_menu",
        "game_steam": "games",
        "steam_package": "game_steam",
        "payment_method": "steam_package",
        "topup": "main_menu",
        "country_select": "topup",
        "profile": "main_menu",
        "support": "main_menu",
        "admin_panel": "main_menu",
        "admin_orders": "admin_panel",
        "admin_orders_list": "admin_orders"
    }
    
    prev_state = back_map.get(current_state, "main_menu")
    set_user_state(callback.from_user.id, prev_state)
    
    # Вызываем нужный хэндлер
    handlers = {
        "main_menu": main_menu_callback,
        "games": games_callback,
        "game_steam": game_steam_callback,
        "topup": topup_callback,
        "profile": profile_callback,
        "support": support_callback,
        "admin_panel": admin_panel_callback,
        "admin_orders": admin_orders_callback
    }
    
    handler = handlers.get(prev_state)
    if handler:
        await handler(callback)
    else:
        await main_menu_callback(callback)
    
    await callback.answer()


# ==========================================
# ИГРЫ
# ==========================================

@router.callback_query(F.data == "games")
async def games_callback(callback: types.CallbackQuery):
    """Меню игр"""
    set_user_state(callback.from_user.id, "games")
    
    await callback.message.edit_text(
        "🎮 <b>Выберите игру:</b>",
        reply_markup=get_games_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "game_steam")
async def game_steam_callback(callback: types.CallbackQuery):
    """Steam"""
    set_user_state(callback.from_user.id, "game_steam")
    
    await callback.message.edit_text(
        "🎮 <b>Steam - Пополнение</b>\n\n"
        "📝 <b>Как это работает:</b>\n"
        "1️⃣ Выберите сумму\n"
        "2️⃣ Оплатите\n"
        "3️⃣ Укажите почту\n"
        "4️⃣ Получите код\n"
        "5️⃣ Отправьте код боту\n"
        "6️⃣ Готово!\n\n"
        "💰 <b>Выберите сумму:</b>",
        reply_markup=get_steam_packages(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("steam_"))
async def steam_package_callback(callback: types.CallbackQuery, state: FSMContext):
    """Выбор пакета Steam"""
    package = callback.data.split("_")[1]
    amounts = {"100": 100, "300": 300, "500": 500, "1000": 1000, "2000": 2000, "5000": 5000}
    amount = amounts.get(package, 0)
    
    set_user_state(callback.from_user.id, "steam_package")
    await state.update_data(package=package, amount=amount, game="steam")
    
    await callback.message.edit_text(
        f"💰 <b>Steam - {amount}₽</b>\n\n"
        f"📦 Steam Wallet {amount}₽\n"
        f"⏱️ Доставка: 5-15 мин\n\n"
        f"Выберите способ оплаты:",
        reply_markup=get_payment_methods(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("pay_"))
async def payment_method_callback(callback: types.CallbackQuery, state: FSMContext):
    """Выбор способа оплаты"""
    set_user_state(callback.from_user.id, "payment_method")
    
    data = await state.get_data()
    amount = data.get('amount', 0)
    payment_method = callback.data.split("_")[1]
    
    await state.update_data(payment_method=payment_method)
    
    # Создаём заказ
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if user:
        order_id = await db.create_order(
            user_id=user['id'],
            telegram_id=callback.from_user.id,
            amount=amount,
            payment_method=payment_method,
            items_json=f"Steam Wallet {amount}₽",
            status='pending'
        )
        await state.update_data(order_id=order_id)
        
        # Уведомляем админов
        for admin_id in settings.ADMIN_IDS:
            try:
                await callback.bot.send_message(
                    admin_id,
                    f"🔔 <b>Новый заказ!</b>\n\n"
                    f"📦 <b>Заказ #{order_id}</b>\n"
                    f"👤 Пользователь: {callback.from_user.first_name}\n"
                    f"💰 Сумма: {amount}₽\n"
                    f"🏧 Оплата: {payment_method}\n\n"
                    f"Требуется подтверждение!",
                    reply_markup=get_admin_order_keyboard(order_id),
                    parse_mode='HTML'
                )
            except Exception as e:
                logger.error(f"Не удалось отправить уведомление админу {admin_id}: {e}")
    
    await callback.message.edit_text(
        f"✅ <b>Заказ #{data.get('order_id', 'N/A')} создан!</b>\n\n"
        f"💰 Сумма: {amount}₽\n"
        f"🏧 Способ: {payment_method}\n\n"
        f"📧 <b>Отправьте вашу почту от Steam:</b>",
        parse_mode='HTML'
    )
    await state.set_state(OrderState.waiting_for_email)
    await callback.answer()


@router.message(OrderState.waiting_for_email)
async def process_email(message: types.Message, state: FSMContext):
    """Обработка почты"""
    email = message.text.strip()
    
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        await message.answer(
            "❌ <b>Некорректный email</b>\n\n"
            "Введите правильный email",
            parse_mode='HTML'
        )
        return
    
    await state.update_data(email=email)
    
    data = await state.get_data()
    await db.update_order_email(data.get('order_id'), email)
    
    await message.answer(
        f"✅ <b>Почта принята:</b> {email}\n\n"
        f"📧 <b>Следующий шаг:</b>\n"
        f"1. Проверьте почту\n"
        f"2. Найдите письмо от Steam\n"
        f"3. Скопируйте код\n"
        f"4. Отправьте код боту",
        reply_markup=get_code_confirmation_keyboard(),
        parse_mode='HTML'
    )
    await state.set_state(OrderState.waiting_for_code)


@router.message(OrderState.waiting_for_code)
async def process_code(message: types.Message, state: FSMContext):
    """Обработка кода"""
    code = message.text.strip()
    
    if len(code) < 4 or len(code) > 10:
        await message.answer(
            "❌ <b>Некорректный код</b>\n\n"
            "Код Steam: 5 символов (ABCD1)",
            parse_mode='HTML'
        )
        return
    
    await state.update_data(code=code)
    
    data = await state.get_data()
    await db.update_order_status(data.get('order_id'), 'waiting_code')
    
    # Уведомляем админа
    for admin_id in settings.ADMIN_IDS:
        try:
            await message.bot.send_message(
                admin_id,
                f"📧 <b>Клиент отправил код!</b>\n\n"
                f"📦 <b>Заказ #{data.get('order_id')}</b>\n"
                f"🔑 Код: <code>{code}</code>\n\n"
                f"Проверьте и подтвердите.",
                reply_markup=get_admin_order_keyboard(data.get('order_id')),
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    await message.answer(
        f"✅ <b>Код отправлен!</b>\n\n"
        f"🔑 Ваш код: <code>{code}</code>\n\n"
        f"⏳ Ожидайте подтверждения админа.",
        reply_markup=get_back_keyboard("main_menu"),
        parse_mode='HTML'
    )
    await state.clear()


@router.callback_query(F.data == "code_received")
async def code_received_callback(callback: types.CallbackQuery, state: FSMContext):
    """Код получен"""
    await callback.message.answer(
        "📧 <b>Отправьте код из письма Steam</b>\n\n"
        "Формат: ABCD1",
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "code_issue")
async def code_issue_callback(callback: types.CallbackQuery, state: FSMContext):
    """Проблема с кодом"""
    await callback.message.edit_text(
        "❌ <b>Проблема с кодом?</b>\n\n"
        "📞 Напишите в поддержку:",
        reply_markup=get_support_keyboard(),
        parse_mode='HTML'
    )
    await state.clear()
    await callback.answer()


# ==========================================
# ПРОМОКОДЫ
# ==========================================

@router.callback_query(F.data == "promo")
async def promo_callback(callback: types.CallbackQuery, state: FSMContext):
    """Промокод"""
    set_user_state(callback.from_user.id, "promo")
    await state.set_state(OrderState.waiting_for_promo)
    
    await callback.message.edit_text(
        "🎁 <b>Активация промокода</b>\n\n"
        "💡 Только для Steam!\n\n"
        "👇 Отправьте промокод:",
        parse_mode='HTML'
    )
    await callback.answer()


@router.message(OrderState.waiting_for_promo)
async def process_promo(message: types.Message, state: FSMContext):
    """Обработка промокода"""
    promo = message.text.strip().upper()
    
    if len(promo) < 8:
        await message.answer("❌ Некорректный промокод", parse_mode='HTML')
        return
    
    promo_data = await db.get_promo(promo)
    
    if not promo_data or promo_data.get('is_used'):
        await message.answer(
            "❌ Промокод не найден или использован",
            reply_markup=get_main_menu(),
            parse_mode='HTML'
        )
        await state.clear()
        return
    
    user = await db.get_user_by_telegram_id(message.from_user.id)
    if user:
        await db.activate_promo(promo, user['id'])
        await db.add_bonus(user['id'], promo_data.get('amount', 0))
        
        await message.answer(
            f"✅ Промокод активирован!\n\n"
            f"🎁 Бонус: {promo_data.get('amount', 0)}₽",
            reply_markup=get_main_menu(),
            parse_mode='HTML'
        )
    
    await state.clear()


# ==========================================
# ПРОФИЛЬ
# ==========================================

@router.callback_query(F.data == "profile")
async def profile_callback(callback: types.CallbackQuery):
    """Профиль"""
    set_user_state(callback.from_user.id, "profile")
    
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if not user:
        user = await db.get_or_create_user(
            telegram_id=callback.from_user.id,
            username=callback.from_user.username,
            first_name=callback.from_user.first_name
        )
    
    balance = await db.get_user_balance(user['id'])
    
    await callback.message.edit_text(
        f"👤 <b>Профиль</b>\n\n"
        f"🆔 ID: <code>{callback.from_user.id}</code>\n"
        f"💰 Баланс: {balance.get('bonus_balance', 0):.2f}₽",
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "my_orders")
async def my_orders_callback(callback: types.CallbackQuery):
    """Мои заказы"""
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return
    
    orders = await db.get_user_orders(user['id'])
    
    if not orders:
        await callback.message.edit_text(
            "📦 Нет заказов",
            reply_markup=get_main_menu(),
            parse_mode='HTML'
        )
        return
    
    text = "📦 <b>Ваши заказы</b>\n\n"
    for order in orders[:10]:
        status_emoji = {"pending": "⏳", "paid": "💰", "completed": "✅", "cancelled": "❌"}.get(order.get('status'), "⏳")
        text += f"{status_emoji} #{order['id']} - {order.get('total_amount', 0)}₽\n"
    
    await callback.message.edit_text(
        text,
        reply_markup=get_back_keyboard("main_menu"),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "order_history")
async def order_history_callback(callback: types.CallbackQuery):
    await my_orders_callback(callback)


@router.callback_query(F.data == "balance")
async def balance_callback(callback: types.CallbackQuery):
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return
    
    balance = await db.get_user_balance(user['id'])
    
    await callback.message.edit_text(
        f"💰 Баланс: {balance.get('bonus_balance', 0):.2f}₽",
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "my_promos")
async def my_promos_callback(callback: types.CallbackQuery):
    await callback.message.edit_text(
        "🎁 Нет активных промокодов",
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


# ==========================================
# ПОДДЕРЖКА
# ==========================================

@router.callback_query(F.data == "support")
async def support_callback(callback: types.CallbackQuery):
    set_user_state(callback.from_user.id, "support")
    
    await callback.message.edit_text(
        "📞 <b>Поддержка</b>\n\n"
        "✈️ @neymaryshop_support",
        reply_markup=get_support_keyboard(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "support_faq")
async def support_faq_callback(callback: types.CallbackQuery):
    await callback.message.edit_text(
        "❓ <b>FAQ</b>\n\n"
        "📦 Доставка: 5-15 мин\n"
        "💰 Оплата: Карты, СБП, Crypto\n"
        "🎁 Промокоды: только Steam",
        reply_markup=get_support_keyboard(),
        parse_mode='HTML'
    )
    await callback.answer()


# ==========================================
# ПОПОЛНЕНИЕ
# ==========================================

@router.callback_query(F.data == "topup")
async def topup_callback(callback: types.CallbackQuery):
    set_user_state(callback.from_user.id, "topup")
    
    await callback.message.edit_text(
        "💳 <b>Пополнение</b>\n\n"
        "🌍 Страна:",
        reply_markup=get_topup_countries(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("country_"))
async def country_callback(callback: types.CallbackQuery):
    set_user_state(callback.from_user.id, "country_select")
    
    country = callback.data.split("_")[1]
    countries_info = {
        "ru": ("🇷🇺 Россия", "₽"),
        "ua": ("🇺🇦 Украина", "₴"),
        "kz": ("🇰🇿 Казахстан", "₸"),
        "uz": ("🇺🇿 Узбекистан", "so'm"),
        "tr": ("🇹🇷 Турция", "₺"),
        "us": ("🇺🇸 США", "$"),
        "eu": ("🇪🇺 Европа", "€")
    }
    
    country_name, currency = countries_info.get(country, ("", ""))
    
    await callback.message.edit_text(
        f"{country_name} выбрана ({currency})\n\n"
        "🎮 Игра:",
        reply_markup=get_games_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


# ==========================================
# АДМИН ПАНЕЛЬ
# ==========================================

@router.callback_query(F.data == "admin_panel")
async def admin_panel_callback(callback: types.CallbackQuery):
    """Админ панель"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    set_user_state(callback.from_user.id, "admin_panel")
    
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if user:
        await db.set_user_mode(callback.from_user.id, 'admin')
    
    await callback.message.edit_text(
        "⚙️ <b>Админ панель</b>",
        reply_markup=get_admin_panel(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "switch_to_customer")
async def switch_to_customer_callback(callback: types.CallbackQuery):
    """Переключение в режим клиента"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if user:
        await db.set_user_mode(callback.from_user.id, 'customer')
    
    clear_user_state(callback.from_user.id)
    
    await callback.message.edit_text(
        "✅ Режим клиента включён",
        reply_markup=get_main_menu(True, 'customer'),
        parse_mode='HTML'
    )
    await callback.answer("✅ Включён режим клиента", show_alert=True)


@router.callback_query(F.data == "admin_stats")
async def admin_stats_callback(callback: types.CallbackQuery):
    """Статистика"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    stats = await db.get_shop_stats()
    
    await callback.message.edit_text(
        f"📊 Статистика:\n\n"
        f"👥 {stats.get('users', 0)}\n"
        f"📦 {stats.get('orders', 0)}\n"
        f"💰 {stats.get('revenue', 0)}₽\n"
        f"⏳ {stats.get('pending', 0)}\n"
        f"✅ {stats.get('completed', 0)}",
        reply_markup=get_admin_panel(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "admin_orders")
async def admin_orders_callback(callback: types.CallbackQuery):
    """Заказы - меню"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    set_user_state(callback.from_user.id, "admin_orders")
    
    await callback.message.edit_text(
        "📦 Заказы:",
        reply_markup=get_admin_orders_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("admin_orders_"))
async def admin_orders_list_callback(callback: types.CallbackQuery):
    """Список заказов"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    set_user_state(callback.from_user.id, "admin_orders_list")
    
    filter_type = callback.data.split("_")[2]
    orders = await db.get_orders_by_status(filter_type if filter_type != "all" else None)
    
    if not orders:
        await callback.message.edit_text(
            "📦 Нет заказов",
            reply_markup=get_admin_orders_menu(),
            parse_mode='HTML'
        )
        return
    
    text = f"📦 Заказы ({filter_type}):\n\n"
    for order in orders[:10]:
        status_emoji = {"pending": "⏳", "paid": "💰", "completed": "✅", "cancelled": "❌"}.get(order.get('status'), "⏳")
        text += f"{status_emoji} #{order['id']} - {order.get('total_amount', 0)}₽\n"
    
    builder = InlineKeyboardBuilder()
    builder.button(text="🔄 Обновить", callback_data=f"admin_orders_{filter_type}")
    builder.button(text="🔙 Назад", callback_data="admin_panel")
    builder.adjust(1, 1)
    
    await callback.message.edit_text(
        text,
        reply_markup=builder.as_markup(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("admin_confirm:"))
async def admin_confirm_order_callback(callback: types.CallbackQuery):
    """Подтверждение заказа"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    order_id = int(callback.data.split(":")[1])
    await db.update_order_status(order_id, 'paid')
    
    order = await db.get_order(order_id)
    if order:
        try:
            await callback.bot.send_message(
                order['telegram_id'],
                f"✅ Заказ #{order_id} подтверждён!\n\nОтправьте код от Steam.",
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    await callback.message.edit_text(
        f"✅ Заказ #{order_id} подтверждён",
        reply_markup=get_back_keyboard("admin_orders"),
        parse_mode='HTML'
    )
    await callback.answer("✅ Подтверждено", show_alert=True)


@router.callback_query(F.data.startswith("admin_cancel:"))
async def admin_cancel_order_callback(callback: types.CallbackQuery):
    """Отмена заказа"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    order_id = int(callback.data.split(":")[1])
    await db.update_order_status(order_id, 'cancelled')
    
    order = await db.get_order(order_id)
    if order:
        try:
            await callback.bot.send_message(
                order['telegram_id'],
                f"❌ Заказ #{order_id} отменён",
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    await callback.message.edit_text(
        f"❌ Заказ #{order_id} отменён",
        reply_markup=get_back_keyboard("admin_orders"),
        parse_mode='HTML'
    )
    await callback.answer("❌ Отменено", show_alert=True)


@router.callback_query(F.data.startswith("admin_complete:"))
async def admin_complete_order_callback(callback: types.CallbackQuery):
    """Завершение заказа"""
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    order_id = int(callback.data.split(":")[1])
    await db.update_order_status(order_id, 'completed')
    
    order = await db.get_order(order_id)
    if order:
        try:
            await callback.bot.send_message(
                order['telegram_id'],
                f"✅ Заказ #{order_id} выполнен!\n\nСредства зачислены.",
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Ошибка: {e}")
    
    await callback.message.edit_text(
        f"✅ Заказ #{order_id} завершён",
        reply_markup=get_back_keyboard("admin_orders"),
        parse_mode='HTML'
    )
    await callback.answer("✅ Завершено", show_alert=True)


@router.callback_query(F.data == "admin_promos")
async def admin_promos_callback(callback: types.CallbackQuery):
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    await callback.message.edit_text(
        "🎁 Промокоды:",
        reply_markup=get_admin_promos_keyboard(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "admin_users")
async def admin_users_callback(callback: types.CallbackQuery):
    if callback.from_user.id not in settings.ADMIN_IDS:
        await callback.answer("❌ Только для админов!", show_alert=True)
        return
    
    users_count = await db.get_users_count()
    
    await callback.message.edit_text(
        f"👥 Пользователей: {users_count}",
        reply_markup=get_back_keyboard("admin_panel"),
        parse_mode='HTML'
    )
    await callback.answer()


# ==========================================
# ДРУГИЕ ИГРЫ
# ==========================================

@router.callback_query(F.data.startswith("game_"))
async def other_game_callback(callback: types.CallbackQuery):
    game = callback.data.split("_")[1]
    
    games_info = {
        "valorant": "Valorant",
        "cs2": "CS2",
        "pubg": "PUBG",
        "genshin": "Genshin Impact",
        "hsr": "Honkai Star Rail",
        "breakout": "Arena Breakout",
        "lostlight": "Lost Light"
    }
    
    game_name = games_info.get(game, "Игра")
    
    await callback.message.edit_text(
        f"🎮 {game_name}\n\n⚠️ В разработке",
        reply_markup=get_support_keyboard(),
        parse_mode='HTML'
    )
    await callback.answer()
