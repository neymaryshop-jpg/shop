"""
Клавиатуры для бота - NeymaryShop
"""
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_main_menu(is_admin: bool = False, user_mode: str = "customer") -> InlineKeyboardMarkup:
    """Главное меню"""
    builder = InlineKeyboardBuilder()

    if is_admin and user_mode == "admin":
        builder.button(text="⚙️ Админ панель", callback_data="admin_panel", style="danger")
        builder.button(text="🎮 Режим клиента", callback_data="switch_to_customer", style="success")
    else:
        builder.button(text="🎮 Игры", callback_data="games", style="success")
        builder.button(text="💳 Пополнение", callback_data="topup", style="success")
    
    builder.button(text="📦 Заказы", callback_data="my_orders", style="default")
    builder.button(text="🎁 Промокоды", callback_data="promo", style="primary")
    
    builder.button(text="👤 Профиль", callback_data="profile", style="default")
    builder.button(text="📞 Поддержка", callback_data="support", style="default")
    
    builder.adjust(2, 2, 2)
    return builder.as_markup()


def get_games_menu() -> InlineKeyboardMarkup:
    """Меню игр"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="🎮 Steam", callback_data="game_steam", style="success")
    builder.button(text="🎯 Valorant", callback_data="game_valorant", style="success")
    builder.button(text="🔫 CS2", callback_data="game_cs2", style="success")
    builder.button(text="👑 PUBG", callback_data="game_pubg", style="success")
    builder.button(text="⚔️ Genshin", callback_data="game_genshin", style="success")
    builder.button(text="🌊 HSR", callback_data="game_hsr", style="success")
    builder.button(text="🛡️ Breakout", callback_data="game_breakout", style="success")
    builder.button(text="💎 Lost Light", callback_data="game_lostlight", style="success")
    
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 2, 2, 2, 1)
    return builder.as_markup()


def get_topup_countries() -> InlineKeyboardMarkup:
    """Выбор страны"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="🇷🇺 Россия", callback_data="country_ru", style="success")
    builder.button(text="🇺🇦 Украина", callback_data="country_ua", style="success")
    builder.button(text="🇰🇿 Казахстан", callback_data="country_kz", style="success")
    builder.button(text="🇺🇿 Узбекистан", callback_data="country_uz", style="success")
    builder.button(text="🇹🇷 Турция", callback_data="country_tr", style="success")
    builder.button(text="🇺🇸 США", callback_data="country_us", style="success")
    builder.button(text="🇪🇺 Европа", callback_data="country_eu", style="primary")
    
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 2, 2, 1)
    return builder.as_markup()


def get_steam_packages() -> InlineKeyboardMarkup:
    """Пакеты Steam"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="💰 100₽", callback_data="steam_100", style="success")
    builder.button(text="💰 300₽", callback_data="steam_300", style="success")
    builder.button(text="💰 500₽", callback_data="steam_500", style="success")
    builder.button(text="💰 1000₽", callback_data="steam_1000", style="primary")
    builder.button(text="💰 2000₽", callback_data="steam_2000", style="primary")
    builder.button(text="💰 5000₽", callback_data="steam_5000", style="primary")
    
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 2, 2, 1)
    return builder.as_markup()


def get_payment_methods() -> InlineKeyboardMarkup:
    """Способы оплаты"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="💳 Карта", callback_data="pay_card", style="success")
    builder.button(text="₿ Crypto", callback_data="pay_crypto", style="primary")
    builder.button(text="📱 СБП", callback_data="pay_sbp", style="success")
    builder.button(text="🏦 ЮMoney", callback_data="pay_yoomoney", style="primary")
    
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 2)
    return builder.as_markup()


def get_profile_menu() -> InlineKeyboardMarkup:
    """Профиль"""
    builder = InlineKeyboardBuilder()
    builder.button(text="📦 История", callback_data="order_history", style="default")
    builder.button(text="💰 Баланс", callback_data="balance", style="success")
    builder.button(text="🎁 Промокоды", callback_data="my_promos", style="primary")
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 1)
    return builder.as_markup()


def get_support_keyboard() -> InlineKeyboardMarkup:
    """Поддержка"""
    builder = InlineKeyboardBuilder()
    builder.button(text="❓ FAQ", callback_data="support_faq", style="default")
    builder.button(text="📞 Написать", callback_data="support_create", style="success")
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 1)
    return builder.as_markup()


def get_admin_panel() -> InlineKeyboardMarkup:
    """Админ панель"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="📊 Статистика", callback_data="admin_stats", style="default")
    builder.button(text="📦 Заказы", callback_data="admin_orders", style="default")
    builder.button(text="🎁 Промокоды", callback_data="admin_promos", style="primary")
    builder.button(text="👥 Пользователи", callback_data="admin_users", style="default")
    builder.button(text="🔄 Режим клиента", callback_data="switch_to_customer", style="success")
    
    builder.button(text="🔙 Назад", callback_data="nav_back", style="default")
    builder.adjust(2, 2, 1)
    return builder.as_markup()


def get_admin_order_keyboard(order_id: int) -> InlineKeyboardMarkup:
    """Клавиатура заказа админа"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="✅ Подтвердить", callback_data=f"admin_confirm:{order_id}", style="success")
    builder.button(text="❌ Отклонить", callback_data=f"admin_cancel:{order_id}", style="danger")
    builder.button(text="📦 Завершён", callback_data=f"admin_complete:{order_id}", style="primary")
    
    builder.adjust(2, 1)
    return builder.as_markup()


def get_admin_orders_menu() -> InlineKeyboardMarkup:
    """Меню заказов админа"""
    builder = InlineKeyboardBuilder()
    
    builder.button(text="⏳ Ожидают", callback_data="admin_orders_pending", style="success")
    builder.button(text="✅ Завершённые", callback_data="admin_orders_completed", style="primary")
    builder.button(text="❌ Отменённые", callback_data="admin_orders_cancelled", style="danger")
    builder.button(text="📊 Все", callback_data="admin_orders_all", style="default")
    
    builder.button(text="🔙 Назад", callback_data="admin_panel", style="default")
    builder.adjust(2, 2)
    return builder.as_markup()


def get_admin_promos_keyboard() -> InlineKeyboardMarkup:
    """Промокоды админа"""
    builder = InlineKeyboardBuilder()
    builder.button(text="➕ Создать", callback_data="admin_promo_create", style="success")
    builder.button(text="📋 Список", callback_data="admin_promos_list", style="primary")
    builder.button(text="🔙 Назад", callback_data="admin_panel", style="default")
    builder.adjust(1, 1)
    return builder.as_markup()


def get_back_keyboard(callback: str = "nav_back", text: str = "🔙 Назад") -> InlineKeyboardMarkup:
    """Кнопка назад"""
    builder = InlineKeyboardBuilder()
    builder.button(text=text, callback_data=callback, style="default")
    return builder.as_markup()


def get_back_button(callback: str = "nav_back", style: str = "default") -> InlineKeyboardMarkup:
    """Кнопка назад (алиас)"""
    return get_back_keyboard(callback, style)


def get_email_input_keyboard() -> InlineKeyboardMarkup:
    """Ввод почты"""
    builder = InlineKeyboardBuilder()
    builder.button(text="📧 Я ввёл почту", callback_data="email_entered", style="success")
    builder.adjust(1)
    return builder.as_markup()


def get_code_confirmation_keyboard() -> InlineKeyboardMarkup:
    """Подтверждение кода"""
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Код получен", callback_data="code_received", style="success")
    builder.button(text="❌ Проблема", callback_data="code_issue", style="danger")
    builder.adjust(2)
    return builder.as_markup()
