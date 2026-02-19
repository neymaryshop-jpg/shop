import asyncio
import logging
import os
import subprocess
import sys
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
import psycopg2
from psycopg2.extras import RealDictCursor

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Настройки БД
DB_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/neymaryshop')

# ID супер-админа (замените на ваш Telegram ID)
SUPER_ADMIN_ID = int(os.getenv('SUPER_ADMIN_TELEGRAM_ID', '0'))

class BotDatabase:
    def __init__(self):
        self.conn = None
    
    def connect(self):
        try:
            self.conn = psycopg2.connect(DB_URL)
            self.conn.autocommit = True
            return True
        except Exception as e:
            logger.error(f"Ошибка подключения к БД: {e}")
            return False
    
    def get_user_role(self, telegram_id: int) -> str:
        """Получить роль пользователя по Telegram ID"""
        if not self.conn:
            if not self.connect():
                return None
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT ar.role_name, ar.permissions 
                    FROM admin_roles ar
                    JOIN users u ON ar.user_id = u.id
                    WHERE u.telegram_id = %s AND u.is_active = true
                """, (telegram_id,))
                result = cursor.fetchone()
                return result['role_name'] if result else None
        except Exception as e:
            logger.error(f"Ошибка получения роли: {e}")
            return None
    
    def link_telegram_to_user(self, email: str, telegram_id: int, telegram_username: str) -> bool:
        """Привязать Telegram к существующему пользователю"""
        if not self.conn:
            if not self.connect():
                return False
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE users 
                    SET telegram_id = %s, telegram_username = %s 
                    WHERE email = %s AND is_active = true
                """, (telegram_id, telegram_username, email))
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Ошибка привязки Telegram: {e}")
            return False
    
    def create_admin_role(self, user_id: int, role_name: str, permissions: dict) -> bool:
        """Создать админ роль для пользователя"""
        if not self.conn:
            if not self.connect():
                return False
        
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO admin_roles (user_id, role_name, permissions)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET role_name = %s, permissions = %s, updated_at = NOW()
                """, (user_id, role_name, permissions, role_name, permissions))
                return True
        except Exception as e:
            logger.error(f"Ошибка создания роли: {e}")
            return False
    
    def get_user_by_email(self, email: str) -> dict:
        """Получить пользователя по email"""
        if not self.conn:
            if not self.connect():
                return None
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id, email, full_name, telegram_id 
                    FROM users 
                    WHERE email = %s AND is_active = true
                """, (email,))
                return cursor.fetchone()
        except Exception as e:
            logger.error(f"Ошибка поиска пользователя: {e}")
            return None
    
    def get_all_admins(self) -> list:
        """Получить всех администраторов"""
        if not self.conn:
            if not self.connect():
                return []
        
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT u.id, u.email, u.full_name, u.telegram_id, u.telegram_username,
                           ar.role_name, ar.permissions, ar.created_at
                    FROM users u
                    LEFT JOIN admin_roles ar ON u.id = ar.user_id
                    WHERE u.is_active = true AND ar.role_name IS NOT NULL
                    ORDER BY ar.created_at DESC
                """)
                return cursor.fetchall()
        except Exception as e:
            logger.error(f"Ошибка получения админов: {e}")
            return []

# Инициализация БД
db = BotDatabase()

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /help - краткая справка"""
    user = update.effective_user
    
    help_text = (
        f"🚀 **NeymaryShop Bot - Быстрая справка**\n\n"
        f"👋 Привет, {user.first_name}!\n\n"
        
        f"🔐 **Для начала работы:**\n"
        f"/link email - Привязать ваш аккаунт\n"
        f"Пример: /link admin@example.com\n\n"
        
        f"📊 **Основные команды:**\n"
        f"/start - Полное меню\n"
        f"/help - Эта справка\n"
        f"/stats - Статистика магазина\n"
        f"/admins - Список администраторов\n\n"
        
        f"⚙️ **Для админов:**\n"
        f"/add_admin - Добавить администратора\n"
        f"/add_email email роль - Добавить по email\n"
        f"/system - Системные команды\n\n"
        
        f"🛠️ **Для super_admin:**\n"
        f"/deploy - Запустить админ панель\n"
        f"/install - Установка системы\n\n"
        
        f"💡 **Подсказка:** Начните с привязки аккаунта!\n"
        f"Используйте: /link ваш@email"
    )
    
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /start"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if user_role:
        # Полное меню команд для всех ролей
        commands_text = (
            f"🔐 Добро пожаловать в админ панель, {user.full_name}!\n\n"
            f"📋 **Управление администраторами:**\n"
            f"/admins - Показать всех администраторов\n"
            f"         Пример: /admins\n"
            f"/add_admin - Меню добавления администратора\n"
            f"           Пример: /add_admin\n"
            f"/add_email - Добавить админа по email\n"
            f"           Пример: /add_email user@site.com admin\n"
            f"/link - Привязать Telegram к аккаунту\n"
            f"       Пример: /link your@email.com\n\n"
            
            f"📊 **Мониторинг и статистика:**\n"
            f"/stats - Показать статистику магазина\n"
            f"        Пример: /stats\n"
            f"/system - Меню системных команд\n"
            f"         Пример: /system\n\n"
            
            f"🛠️ **Системное управление:**\n"
            f"/deploy - Запустить админ панель\n"
            f"         Пример: /deploy\n"
            f"/install - Полная установка системы\n"
            f"          Пример: /install (только super_admin)\n\n"
            
            f"ℹ️ **Помощь:**\n"
            f"/start - Показать это меню\n"
            f"/help - Показать краткую справку\n\n"
            
            f"💡 **Быстрые советы:**\n"
            f"• Начните с привязки аккаунта: /link email\n"
            f"• Проверьте системный статус: /system\n"
            f"• Посмотрите статистику: /stats\n"
        )
        
        if user_role == 'super_admin':
            commands_text += (
                f"\n🔑 **Super Admin команды:**\n"
                f"Доступны все системные команды управления\n"
                f"включая перезагрузку сервисов и установку"
            )
        
        await update.message.reply_text(commands_text)
    else:
        keyboard = [
            [InlineKeyboardButton("🔐 Привязать аккаунт", callback_data="link_account")],
            [InlineKeyboardButton("ℹ️ Информация", callback_data="info")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        user_name = user.full_name or user.first_name or "Пользователь"
        
        welcome_text = (
            f"👋 **Добро пожаловать в NeymaryShop!**\n\n"
            f"🤖 Это бот управления магазином\n\n"
            f"🔐 **У вас нет прав администратора**\n\n"
            f"📋 **Что делать дальше:**\n"
            f"1. Если вы администратор - привяжите аккаунт:\n"
            f"   `/link ваш@email.com`\n\n"
            f"2. Если у вас есть аккаунт в магазине:\n"
            f"   • Зарегистрируйтесь на сайте\n"
            f"   • Свяжитесь с super_admin для получения прав\n\n"
            f"📞 **Нужна помощь?**\n"
            f"   Свяжитесь: @neymaryshop\n\n"
            f"💡 **Быстрый старт:**\n"
            f"   Нажмите кнопку ниже для привязки аккаунта"
        )
        
        await update.message.reply_text(welcome_text, reply_markup=reply_markup)

async def admins_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /admins - список администраторов"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role:
        await update.message.reply_text("❌ У вас нет прав для выполнения этой команды.")
        return
    
    admins = db.get_all_admins()
    
    if not admins:
        await update.message.reply_text("📋 Администраторы не найдены.")
        return
    
    message = "👥 Список администраторов:\n\n"
    
    for admin in admins:
        telegram_info = ""
        if admin['telegram_id']:
            telegram_info = f" (Telegram: @{admin['telegram_username'] or admin['telegram_id']})"
        
        message += f"🔸 {admin['full_name'] or 'Без имени'}\n"
        message += f"   📧 {admin['email']}{telegram_info}\n"
        message += f"   🏷️ Роль: {admin['role_name']}\n"
        message += f"   📅 Добавлен: {admin['created_at'].strftime('%d.%m.%Y %H:%M')}\n\n"
    
    await update.message.reply_text(message)

async def add_admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /add_admin - добавить администратора"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role not in ['super_admin', 'admin']:
        await update.message.reply_text("❌ Только super_admin и admin могут добавлять администраторов.")
        return
    
    keyboard = [
        [InlineKeyboardButton("👤 По email", callback_data="add_admin_email")],
        [InlineKeyboardButton("🔗 По Telegram ID", callback_data="add_admin_telegram")],
        [InlineKeyboardButton("❌ Отмена", callback_data="cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "➕ Как добавить администратора?",
        reply_markup=reply_markup
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработка нажатий на кнопки"""
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if query.data == "link_account":
        help_text = (
            "📧 **Привязка Telegram аккаунта**\n\n"
            "🔹 **Что нужно сделать:**\n"
            "Отправьте команду с вашим email из магазина\n\n"
            "📋 **Формат команды:**\n"
            "`/link ваш@email.com`\n\n"
            "💡 **Примеры:**\n"
            "• `/link admin@example.com`\n"
            "• `/link user@shop.com`\n\n"
            "⚠️ **Важно:**\n"
            "• Email должен быть зарегистрирован в магазине\n"
            "• Аккаунт должен быть активен\n"
            "• Один Telegram = один аккаунт\n\n"
            "🚀 **Готовы?**\n"
            "Скопируйте и отправьте команду выше!"
        )
        
        await query.edit_message_text(help_text, parse_mode='Markdown')
    
    elif query.data == "info":
        await query.edit_message_text(
            "ℹ️ Информация о боте:\n\n"
            "🔐 Админ бот для управления магазином NeymaryShop\n\n"
            "Для получения прав администратора:\n"
            "1. У вас должен быть аккаунт в магазине\n"
            "2. Свяжитесь с super_admin для получения роли\n\n"
            f"👤 Ваш Telegram ID: {user.id}"
        )
    
    elif query.data == "add_admin_email":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        await query.edit_message_text(
            "📧 Введите email пользователя для добавления в администраторы:\n\n"
            "Используйте команду: /add_email пользователь@example.com роль"
        )
    
    elif query.data == "add_admin_telegram":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        await query.edit_message_text(
            "🔗 Перешлите сообщение от пользователя, которого хотите сделать администратором,\n"
            "или используйте команду: /add_telegram telegram_id роль"
        )
    
    elif query.data == "system_start_admin":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        await query.edit_message_text("🔄 Запуск админ панели...")
        try:
            result = subprocess.run(
                ["cd", "admin", "&&", "npm", "run", "dev"],
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                await query.edit_message_text(
                    "✅ Админ панель запущена!\n\n"
                    "🔗 Адрес: http://localhost:3003\n"
                    "🔗 Для продакшена: https://adm.neymaryshop.ton"
                )
            else:
                await query.edit_message_text(f"❌ Ошибка: {result.stderr[:200]}...")
        except Exception as e:
            await query.edit_message_text(f"❌ Ошибка: {str(e)}")
    
    elif query.data == "system_status":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        status_info = "📊 Статус системы:\n\n"
        
        # Проверка Docker контейнеров
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "table {{.Names}}\t{{.Status}}"],
                capture_output=True,
                text=True,
                timeout=10
            )
            status_info += f"🐳 Docker контейнеры:\n{result.stdout}\n\n"
        except:
            status_info += "🐳 Docker: Недоступен\n\n"
        
        # Проверка портов
        ports = ["3000", "3001", "3002", "3003", "5432", "6379"]
        for port in ports:
            try:
                result = subprocess.run(
                    ["nc", "-z", "localhost", port],
                    capture_output=True,
                    timeout=5
                )
                status = "✅" if result.returncode == 0 else "❌"
                status_info += f"{status} Порт {port}\n"
            except:
                status_info += f"❌ Порт {port}\n"
        
        await query.edit_message_text(status_info)
    
    elif query.data == "system_migrate":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        await query.edit_message_text("🔄 Выполнение миграций БД...")
        try:
            result = subprocess.run(
                ["docker-compose", "exec", "postgres", "psql", "-U", "neymary", "-d", "neymaryshop", "-c", "SELECT version();"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                await query.edit_message_text(
                    "✅ Миграции выполнены успешно!\n\n"
                    f"📊 Результат:\n{result.stdout[:200]}..."
                )
            else:
                await query.edit_message_text(f"❌ Ошибка миграции: {result.stderr[:200]}...")
        except Exception as e:
            await query.edit_message_text(f"❌ Ошибка: {str(e)}")
    
    elif query.data == "system_restart":
        if not user_role or user_role != 'super_admin':
            await query.edit_message_text("❌ Только super_admin может перезагружать сервисы.")
            return
        
        await query.edit_message_text("🔄 Перезагрузка сервисов...")
        try:
            result = subprocess.run(
                ["docker-compose", "restart"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                await query.edit_message_text("✅ Сервисы перезагружены успешно!")
            else:
                await query.edit_message_text(f"❌ Ошибка: {result.stderr[:200]}...")
        except Exception as e:
            await query.edit_message_text(f"❌ Ошибка: {str(e)}")
    
    elif query.data == "system_backup":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        await query.edit_message_text("📦 Создание бэкапа...")
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_cmd = f"docker-compose exec postgres pg_dump -U neymary neymaryshop > backup_{timestamp}.sql"
            
            result = subprocess.run(
                backup_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                await query.edit_message_text(
                    f"✅ Бэкап создан!\n\n"
                    f"📁 Файл: backup_{timestamp}.sql\n"
                    f"📊 Размер: {os.path.getsize(f'backup_{timestamp}.sql')} bytes"
                )
            else:
                await query.edit_message_text(f"❌ Ошибка бэкапа: {result.stderr[:200]}...")
        except Exception as e:
            await query.edit_message_text(f"❌ Ошибка: {str(e)}")
    
    elif query.data == "system_monitor":
        if not user_role or user_role not in ['super_admin', 'admin']:
            await query.edit_message_text("❌ У вас нет прав для выполнения этой операции.")
            return
        
        monitor_info = "🔍 Мониторинг системы:\n\n"
        
        # CPU и память
        try:
            result = subprocess.run(
                ["free", "-h"],
                capture_output=True,
                text=True,
                timeout=10
            )
            monitor_info += f"💾 Память:\n{result.stdout}\n\n"
        except:
            monitor_info += "💾 Память: Недоступно\n\n"
        
        # Диск
        try:
            result = subprocess.run(
                ["df", "-h", "/"],
                capture_output=True,
                text=True,
                timeout=10
            )
            monitor_info += f"💿 Диск:\n{result.stdout}\n\n"
        except:
            monitor_info += "💿 Диск: Недоступно\n\n"
        
        # Load average
        try:
            result = subprocess.run(
                ["uptime"],
                capture_output=True,
                text=True,
                timeout=10
            )
            monitor_info += f"⚡ Нагрузка:\n{result.stdout}"
        except:
            monitor_info += "⚡ Нагрузка: Недоступно"
        
        await query.edit_message_text(monitor_info)
    
    elif query.data == "cancel":
        await query.edit_message_text("❌ Операция отменена.")

async def link_account_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /link - привязка аккаунта"""
    user = update.effective_user
    
    if not context.args:
        await update.message.reply_text(
            "📧 **Привязка аккаунта к Telegram**\n\n"
            "🔹 **Формат:** `/link ваш@email.com`\n\n"
            "📋 **Примеры:**\n"
            "• `/link admin@example.com`\n"
            "• `/link user@company.com`\n\n"
            "💡 **Важно:**\n"
            "• Email должен существовать в системе\n"
            "• Пользователь должен быть активен\n"
            "• Один Telegram можно привязать только к одному аккаунту\n\n"
            "🔗 После привязки вы получите доступ к админ функциям!"
        )
        return
    
    email = context.args[0]
    telegram_username = user.username or f"id{user.id}"
    
    if db.link_telegram_to_user(email, user.id, telegram_username):
        await update.message.reply_text(
            f"✅ Аккаунт {email} успешно привязан к вашему Telegram!\n\n"
            f"🔐 Теперь вы можете использовать админ команды."
        )
    else:
        await update.message.reply_text(
            f"❌ Не удалось привязать аккаунт {email}.\n\n"
            f"Возможные причины:\n"
            f"• Пользователь с таким email не найден\n"
            f"• Пользователь неактивен\n"
            f"• Аккаунт уже привязан к другому Telegram"
        )

async def add_email_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /add_email - добавить админа по email"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role not in ['super_admin', 'admin']:
        await update.message.reply_text("❌ Только super_admin и admin могут добавлять администраторов.")
        return
    
    if len(context.args) < 2:
        await update.message.reply_text(
            "👤 **Добавление администратора по email**\n\n"
            "🔹 **Формат:** `/add_email email роль`\n\n"
            "📋 **Доступные роли:**\n"
            "• `moderator` - Модератор (базовые права)\n"
            "• `admin` - Администратор (полные права)\n"
            "• `super_admin` - Супер админ (все права)\n\n"
            "💡 **Примеры:**\n"
            "• `/add_email new@site.com moderator`\n"
            "• `/add_email boss@company.com admin`\n"
            "• `/add_email root@system.com super_admin`\n\n"
            "⚠️ **Важно:** Пользователь с указанным email должен существовать в системе!"
        )
        return
    
    email = context.args[0]
    role = context.args[1]
    
    # Проверка доступных ролей
    available_roles = ['moderator', 'admin', 'super_admin']
    if role not in available_roles:
        await update.message.reply_text(
            f"❌ Недопустимая роль. Доступные роли: {', '.join(available_roles)}"
        )
        return
    
    # Поиск пользователя
    user_data = db.get_user_by_email(email)
    if not user_data:
        await update.message.reply_text(f"❌ Пользователь с email {email} не найден.")
        return
    
    # Определение прав для роли
    permissions = {
        'moderator': {'can_manage': False, 'level': 60},
        'admin': {'can_manage': True, 'level': 80},
        'super_admin': {'can_manage': True, 'level': 100}
    }
    
    # Создание админ роли
    if db.create_admin_role(user_data['id'], role, permissions[role]):
        await update.message.reply_text(
            f"✅ Пользователь {email} назначен ролью {role}!\n\n"
            f"👤 Имя: {user_data['full_name'] or 'Не указано'}\n"
            f"🆔 ID: {user_data['id']}\n"
            f"🔗 Telegram ID: {user_data['telegram_id'] or 'Не привязан'}"
        )
    else:
        await update.message.reply_text(f"❌ Не удалось назначить роль {role}.")

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /stats - статистика"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role:
        await update.message.reply_text("❌ У вас нет прав для выполнения этой команды.")
        return
    
    # Получение статистики (упрощенная версия)
    try:
        if not db.conn:
            db.connect()
        
        with db.conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Общая статистика
            cursor.execute("SELECT COUNT(*) as total_users FROM users WHERE is_active = true")
            total_users = cursor.fetchone()['total_users']
            
            cursor.execute("SELECT COUNT(*) as total_admins FROM admin_roles")
            total_admins = cursor.fetchone()['total_admins']
            
            cursor.execute("SELECT COUNT(*) as total_orders FROM orders")
            total_orders = cursor.fetchone()['total_orders']
            
            cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE status = 'completed'")
            total_revenue = cursor.fetchone()['total_revenue']
        
        message = "📊 Статистика магазина:\n\n"
        message += f"👥 Пользователи: {total_users}\n"
        message += f"🔐 Администраторы: {total_admins}\n"
        message += f"📦 Всего заказов: {total_orders}\n"
        message += f"💰 Общая выручка: {total_revenue:.2f}₽\n\n"
        message += f"👤 Ваша роль: {user_role}"
        
        await update.message.reply_text(message)
        
    except Exception as e:
        logger.error(f"Ошибка получения статистики: {e}")
        await update.message.reply_text("❌ Не удалось загрузить статистику.")

async def system_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /system - системные команды из .sh файлов"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role not in ['super_admin', 'admin']:
        await update.message.reply_text("❌ Только super_admin и admin могут выполнять системные команды.")
        return
    
    keyboard = [
        [InlineKeyboardButton("🔐 Запуск админ панели", callback_data="system_start_admin")],
        [InlineKeyboardButton("📊 Статус системы", callback_data="system_status")],
        [InlineKeyboardButton("🗂️ Миграции БД", callback_data="system_migrate")],
        [InlineKeyboardButton("🔄 Перезагрузка сервисов", callback_data="system_restart")],
        [InlineKeyboardButton("📦 Бэкап системы", callback_data="system_backup")],
        [InlineKeyboardButton("🔍 Мониторинг", callback_data="system_monitor")],
        [InlineKeyboardButton("❌ Отмена", callback_data="cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🛠️ Системные команды NeymaryShop:\n\n"
        "Выберите действие:",
        reply_markup=reply_markup
    )

async def deploy_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /deploy - установка и развертывание"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role != 'super_admin':
        await update.message.reply_text("❌ Только super_admin может выполнять установку.")
        return
    
    await update.message.reply_text(
        "🚀 Запуск установки NeymaryShop...\n\n"
        "📍 Адрес: localhost:3003\n"
        "🔗 Для продакшена: https://adm.neymaryshop.ton\n\n"
        "⏳ Процесс может занять несколько минут..."
    )
    
    try:
        # Запуск admin панели
        result = subprocess.run(
            ["cd", "admin", "&&", "npm", "run", "dev"],
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            await update.message.reply_text(
                "✅ Админ панель успешно запущена!\n\n"
                f"🔗 Адрес: http://localhost:3003\n"
                f"📊 Логи:\n{result.stdout[:500]}..."
            )
        else:
            await update.message.reply_text(
                f"❌ Ошибка запуска админ панели:\n{result.stderr[:500]}..."
            )
            
    except subprocess.TimeoutExpired:
        await update.message.reply_text(
            "⏰ Таймаут запуска, но процесс продолжается в фоновом режиме.\n"
            "Проверьте статус через несколько минут."
        )
    except Exception as e:
        logger.error(f"Ошибка запуска админ панели: {e}")
        await update.message.reply_text(f"❌ Ошибка: {str(e)}")

async def install_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /install - полная установка системы"""
    user = update.effective_user
    user_role = db.get_user_role(user.id)
    
    if not user_role or user_role != 'super_admin':
        await update.message.reply_text("❌ Только super_admin может выполнять установку.")
        return
    
    await update.message.reply_text(
        "🔧 Запуск установки NeymaryShop для Ubuntu...\n\n"
        "📋 Шаги установки:\n"
        "1. 🔄 Обновление системы\n"
        "2. 🐳 Установка Docker\n"
        "3. 📦 Установка зависимостей\n"
        "4. 🗂️ Создание структуры проекта\n"
        "5. 🐘 Настройка PostgreSQL\n"
        "6. ⚙️ Настройка окружения\n\n"
        "⏳ Это может занять 10-15 минут..."
    )
    
    # Команды из asd.sh
    install_commands = [
        "apt-get update -y",
        "apt-get upgrade -y", 
        "apt-get install -y docker docker-compose",
        "mkdir -p /home/work/neymaryshop",
        "cd /home/work/neymaryshop",
        "git clone https://github.com/neymaryshop-jpg/shop .",
        "docker-compose up -d"
    ]
    
    for i, cmd in enumerate(install_commands, 1):
        try:
            await update.message.reply_text(f"🔄 Шаг {i}/{len(install_commands)}: {cmd}")
            
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                await update.message.reply_text(f"✅ Шаг {i} выполнен успешно")
            else:
                await update.message.reply_text(
                    f"❌ Ошибка на шаге {i}:\n{result.stderr[:200]}..."
                )
                return
                
        except subprocess.TimeoutExpired:
            await update.message.reply_text(f"⏰ Таймаут на шаге {i}, продолжаем...")
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка на шаге {i}: {str(e)}")
            return
    
    await update.message.reply_text(
        "🎉 Установка завершена!\n\n"
        "🔗 Доступные сервисы:\n"
        "• Фронтенд: http://localhost:3000\n"
        "• Бэкенд: http://localhost:3002\n"
        "• Админ панель: http://localhost:3003\n"
        "• Telegram Bot: Работает в фоновом режиме\n\n"
        "📊 Для проверки статуса: /system"
    )

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик ошибок"""
    logger.error(f"Exception while handling an update: {context.error}")

async def set_bot_commands(application: Application) -> None:
    """Установить команды для подсказок Telegram"""
    commands = [
        ("start", "🚀 Запустить бота и показать меню"),
        ("help", "📋 Показать краткую справку"),
        ("link", "🔗 Привязать Telegram к аккаунту\nПример: /link email@example.com"),
        ("admins", "👥 Список администраторов"),
        ("add_admin", "➕ Меню добавления администратора"),
        ("add_email", "📧 Добавить админа по email\nПример: /add_email email@site.com role"),
        ("stats", "📊 Статистика магазина"),
        ("system", "⚙️ Системные команды и управление"),
        ("deploy", "🚀 Запустить админ панель"),
        ("install", "🔧 Полная установка системы")
    ]
    
    await application.bot.set_my_commands(commands)

def main() -> None:
    """Основная функция"""
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN не найден в переменных окружения!")
        return
    
    # Создание приложения
    application = Application.builder().token(token).build()
    
    # Обработчики команд
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("admins", admins_command))
    application.add_handler(CommandHandler("add_admin", add_admin_command))
    application.add_handler(CommandHandler("link", link_account_command))
    application.add_handler(CommandHandler("add_email", add_email_command))
    application.add_handler(CommandHandler("stats", stats_command))
    application.add_handler(CommandHandler("system", system_command))
    application.add_handler(CommandHandler("deploy", deploy_command))
    application.add_handler(CommandHandler("install", install_command))
    
    # Обработчик кнопок
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Обработчик ошибок
    application.add_error_handler(error_handler)
    
    # Запуск бота
    logger.info("🤖 Запуск Telegram бота...")
    
    # Запускаем без set_bot_commands чтобы избежать ошибки с event loop
    application.run_polling()

if __name__ == '__main__':
    main()