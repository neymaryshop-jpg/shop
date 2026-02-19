"""
Хэндлеры для профиля
"""
import logging
from aiogram import Router, F, types

from bot.keyboards import get_profile_menu, get_back_button
from bot.services.database import db
from bot.config import settings

logger = logging.getLogger(__name__)
router = Router()


@router.callback_query(F.data == "profile")
async def profile_callback(callback: types.CallbackQuery):
    """Профиль"""
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if not user:
        user = await db.get_or_create_user(
            telegram_id=callback.from_user.id,
            username=callback.from_user.username,
            first_name=callback.from_user.first_name
        )

    balance = await db.get_user_balance(user['id'])

    profile_text = (
        f"👤 <b>Профиль пользователя</b>\n\n"
        f"🆔 ID: <code>{callback.from_user.id}</code>\n"
        f"👤 Имя: {callback.from_user.first_name}\n\n"
        f"💰 <b>Баланс:</b> {balance.get('bonus_balance', 0):.2f}₽\n\n"
    )

    await callback.message.edit_text(
        profile_text,
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "order_history")
async def order_history_callback(callback: types.CallbackQuery):
    """История заказов"""
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return

    orders = await db.get_user_orders(user['id'])

    if not orders:
        await callback.message.edit_text(
            "📦 <b>История заказов</b>\n\n"
            "У вас пока нет заказов",
            reply_markup=get_profile_menu(),
            parse_mode='HTML'
        )
        await callback.answer()
        return

    orders_text = "📦 <b>Ваши заказы</b>\n\n"
    for order in orders[:10]:
        status_emoji = {"pending": "⏳", "paid": "💰", "completed": "✅", "cancelled": "❌"}.get(order.get('status', 'pending'), "⏳")
        orders_text += f"{status_emoji} <b>#{order['id']}</b> - {order.get('total_amount', 0)}₽\n"
        orders_text += f"   {order.get('created_at', 'N/A')}\n\n"

    await callback.message.edit_text(
        orders_text,
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "balance")
async def balance_callback(callback: types.CallbackQuery):
    """Баланс"""
    user = await db.get_user_by_telegram_id(callback.from_user.id)
    if not user:
        await callback.answer("❌ Ошибка", show_alert=True)
        return

    balance = await db.get_user_balance(user['id'])

    await callback.message.edit_text(
        f"💰 <b>Ваш баланс</b>\n\n"
        f"🟢 Бонусы: {balance.get('bonus_balance', 0):.2f}₽\n"
        f"📈 Заработано: {balance.get('total_earned', 0):.2f}₽\n"
        f"📉 Потрачено: {balance.get('total_spent', 0):.2f}₽",
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data == "my_promos")
async def my_promos_callback(callback: types.CallbackQuery):
    """Мои промокоды"""
    await callback.message.edit_text(
        "🎁 <b>Мои промокоды</b>\n\n"
        "У вас нет активных промокодов\n\n"
        "📢 Следите за новыми промокодами в нашем канале!",
        reply_markup=get_profile_menu(),
        parse_mode='HTML'
    )
    await callback.answer()
