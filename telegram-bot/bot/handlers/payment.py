"""
Хендлеры оплаты и доставки
"""
import logging
from aiogram import Router, F, types, Bot
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.services.database import db
from bot.config import settings

logger = logging.getLogger(__name__)
router = Router()


class PaymentState(StatesGroup):
    waiting_for_legal_accept = State()
    waiting_for_customer_data = State()
    waiting_for_feedback = State()


# Канал для отзывов
FEEDBACK_CHANNEL_ID = -1002168687623

# Реквизиты
PAYMENT_CARD = "2200 0000 0000 0000"
PAYMENT_CARD_HOLDER = "ИОНЦЕВ К.К."
PAYMENT_YOOMONEY = "410010000000000"
PAYMENT_TON = "EQD..."

# Юридические ссылки
AGREEMENT_URL = "https://telegra.ph/Polzaovatelskoe-soglashenie"
PRIVACY_URL = "https://telegra.ph/Politika-konfidencialnosti"


@router.callback_query(F.data.startswith("pay_"))
async def start_payment_callback(callback: types.CallbackQuery, state: FSMContext):
    """Начало оплаты - показываем реквизиты и юридический блок"""
    await state.clear()

    # Получаем данные о товаре
    parts = callback.data.split(":")
    product_name = parts[0].replace("pay_", "") if len(parts) > 0 else "Товар"
    amount = parts[1] if len(parts) > 1 else "0"

    payment_text = (
        f"💳 <b>Оплата заказа</b>\n\n"
        f"📦 <b>Товар:</b> {product_name}\n"
        f"💰 <b>Сумма:</b> {amount}₽\n\n"
        f"🏦 <b>Реквизиты для оплаты:</b>\n"
        f"• Карта: <code>{PAYMENT_CARD}</code> ({PAYMENT_CARD_HOLDER})\n"
        f"• ЮMoney: <code>{PAYMENT_YOOMONEY}</code>\n"
        f"• Crypto (TON): <code>{PAYMENT_TON}</code>\n\n"
        f"📝 <b>Инструкция:</b>\n"
        f"1. Переведите сумму {amount}₽\n"
        f"2. Нажмите '✅ Я оплатил'\n"
        f"3. Ожидайте подтверждения\n\n"
        f"⚖️ <b>Юридическая информация:</b>\n"
        f"ИП Ионцев К.К.\n"
        f"Сделка между физическими лицами\n\n"
        f"🔗 <a href='{AGREEMENT_URL}'>Пользовательское соглашение</a>\n"
        f"🔗 <a href='{PRIVACY_URL}'>Политика конфиденциальности</a>\n\n"
        f"❗ <b>Важно:</b>\n"
        f"Нажимая 'Оплатить', вы принимаете условия."
    )

    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Я оплатил", callback_data="payment_confirmed")
    builder.button(text="❌ Отмена", callback_data="cancel_payment")
    builder.adjust(1, 1)

    await callback.message.edit_text(
        payment_text,
        reply_markup=builder.as_markup(),
        parse_mode='HTML',
        disable_web_page_preview=True
    )
    await callback.answer()


@router.callback_query(F.data == "payment_confirmed")
async def payment_confirmed_callback(callback: types.CallbackQuery, state: FSMContext):
    """Подтверждение оплаты - запрашиваем данные если нужно"""
    # Получаем данные о заказе из state
    data = await state.get_data()
    delivery_type = data.get('delivery_type', 'auto')
    
    if delivery_type == 'manual':
        # Ручная доставка - запрашиваем данные
        await state.set_state(PaymentState.waiting_for_customer_data)
        
        await callback.message.edit_text(
            "📝 <b>Запрос данных для доставки</b>\n\n"
            "Для выполнения заказа отправьте:\n"
            "• Логин/Email от аккаунта\n"
            "• Пароль\n\n"
            "⏱️ <b>Срок доставки:</b> до 24 часов\n\n"
            "Отправьте данные одним сообщением:",
            parse_mode='HTML'
        )
    else:
        # Автовыдача - сразу уведомляем админа
        await process_auto_delivery(callback, state)
    
    await callback.answer()


async def process_auto_delivery(callback: types.CallbackQuery, state: FSMContext):
    """Автовыдача кода"""
    data = await state.get_data()
    product_id = data.get('product_id')
    order_id = data.get('order_id')
    
    # Получаем код из БД
    code = await db.get_unused_product_code(product_id)
    
    if code:
        # Выдаем код клиенту
        await callback.message.edit_text(
            f"✅ <b>Оплата подтверждена!</b>\n\n"
            f"🎁 <b>Ваш код:</b>\n"
            f"<code>{code}</code>\n\n"
            f"📝 Инструкция по активации:\n"
            f"1. ...\n"
            f"2. ...\n\n"
            f"Спасибо за покупку!",
            parse_mode='HTML'
        )
        
        # Обновляем заказ
        await db.update_order_status(order_id, 'completed')

        # Запрашиваем отзыв
        await request_feedback(callback.from_user.id, order_id, callback.bot)
    else:
        # Кодов нет - ручная доставка
        await callback.message.edit_text(
            "⏳ <b>Коды заканчиваются</b>\n\n"
            "Ваш заказ будет обработан администратором\n"
            "в течение 24 часов",
            parse_mode='HTML'
        )
        await db.update_order_status(order_id, 'waiting_data')
        
        # Уведомляем админа
        for admin_id in settings.ADMIN_IDS:
            try:
                await callback.bot.send_message(
                    admin_id,
                    f"⚠️ <b>Заканчиваются коды!</b>\n\n"
                    f"Заказ #{order_id}\n"
                    f"Требуется ручная выдача",
                    parse_mode='HTML'
                )
            except Exception as e:
                logger.error(f"Ошибка уведомления админа: {e}")


@router.message(PaymentState.waiting_for_customer_data)
async def receive_customer_data(message: types.Message, state: FSMContext):
    """Получение данных от клиента для ручной доставки"""
    customer_data = message.text
    
    data = await state.get_data()
    order_id = data.get('order_id')
    
    # Сохраняем данные в заказ
    await db.update_order_customer_data(order_id, customer_data)
    
    await message.answer(
        "✅ <b>Данные получены!</b>\n\n"
        "Ваш заказ будет обработан в течение 24 часов.\n"
        "Вы получите уведомление о выполнении.",
        parse_mode='HTML'
    )
    
    # Уведомляем админа
    for admin_id in settings.ADMIN_IDS:
        try:
            await message.bot.send_message(
                admin_id,
                f"📝 <b>Новые данные заказа #{order_id}</b>\n\n"
                f"👤 Клиент: {message.from_user.first_name}\n"
                f"📦 Товар: {data.get('product_name', 'N/A')}\n\n"
                f"📋 <b>Данные:</b>\n"
                f"<code>{customer_data}</code>\n\n"
                f"Требуется выполнить доставку!",
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Ошибка уведомления админа: {e}")
    
    await state.clear()


async def request_feedback(user_id: int, order_id: int, bot: Bot):
    """Запрос отзыва после завершения заказа"""
    builder = InlineKeyboardBuilder()
    builder.button(text="⭐ Оставить отзыв", callback_data=f"feedback_leave:{order_id}")
    builder.button(text="⏭️ Пропустить", callback_data=f"feedback_skip:{order_id}")
    builder.adjust(1, 1)

    try:
        await bot.send_message(
            user_id,
            "🎉 <b>Заказ выполнен!</b>\n\n"
            "Пожалуйста, оставьте отзыв о качестве обслуживания.\n"
            "Это поможет нам стать лучше!",
            reply_markup=builder.as_markup(),
            parse_mode='HTML'
        )
    except Exception as e:
        logger.error(f"Ошибка запроса отзыва: {e}")


@router.callback_query(F.data.startswith("feedback_leave:"))
async def feedback_leave_callback(callback: types.CallbackQuery, state: FSMContext):
    """Начало оставления отзыва"""
    await state.set_state(PaymentState.waiting_for_feedback)
    
    await callback.message.edit_text(
        "✍️ <b>Ваш отзыв</b>\n\n"
        "Напишите ваш отзыв о качестве обслуживания.\n"
        "Это займет всего минуту!",
        parse_mode='HTML'
    )
    await callback.answer()


@router.callback_query(F.data.startswith("feedback_skip:"))
async def feedback_skip_callback(callback: types.CallbackQuery):
    """Пропуск отзыва"""
    await callback.message.edit_text(
        "Спасибо за покупку!\n"
        "Будем рады видеть вас снова!",
        parse_mode='HTML'
    )
    await callback.answer()


@router.message(PaymentState.waiting_for_feedback)
async def receive_feedback(message: types.Message, state: FSMContext):
    """Получение и пересылка отзыва в канал"""
    feedback_text = message.text
    
    # Пересылаем отзыв в канал
    try:
        forward_text = (
            f"⭐ <b>Новый отзыв!</b>\n\n"
            f"👤 От: {message.from_user.first_name} (@{message.from_user.username or 'нет'})\n"
            f"🆔 ID: {message.from_user.id}\n\n"
            f"📝 <b>Текст:</b>\n"
            f"{feedback_text}"
        )
        
        await message.bot.send_message(
            FEEDBACK_CHANNEL_ID,
            forward_text,
            parse_mode='HTML'
        )
        
        # Благодарим клиента
        await message.answer(
            "✅ <b>Спасибо за ваш отзыв!</b>\n\n"
            "Ваше мнение очень важно для нас.\n"
            "Будем рады видеть вас снова!",
            parse_mode='HTML'
        )
    except Exception as e:
        logger.error(f"Ошибка отправки отзыва в канал: {e}")
        
        await message.answer(
            "✅ <b>Спасибо за отзыв!</b>\n"
            "Он будет опубликован после модерации.",
            parse_mode='HTML'
        )
    
    await state.clear()
