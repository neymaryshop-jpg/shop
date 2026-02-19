"""
Расширенные клавиатуры - NeymaryShop
"""
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_main_menu_extended(is_admin: bool = False, user_mode: str = "customer") -> InlineKeyboardMarkup:
    """Главное меню расширенное"""
    builder = InlineKeyboardBuilder()

    if is_admin and user_mode == "admin":
        builder.button(text="⚙️ Админ панель", callback_data="admin_panel", style="danger")
        builder.button(text="🎮 Режим клиента", callback_data="switch_to_customer", style="success")
    else:
        builder.button(text="🎮 Игры", callback_data="games", style="success")
        builder.button(text="💳 Пополнить", callback_data="topup", style="primary")
    
    builder.button(text="📦 Мои заказы", callback_data="my_orders", style="primary")
    builder.button(text="🎁 Промокод", callback_data="promo", style="success")
    
    builder.button(text="👤 Профиль", callback_data="profile", style="primary")
    builder.button(text="📞 Поддержка", callback_data="support", style="primary")
    
    builder.adjust(2, 2, 2)
    return builder.as_markup()
