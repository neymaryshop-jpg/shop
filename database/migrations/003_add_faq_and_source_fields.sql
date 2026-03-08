-- Миграция: Расширение таблицы categories и products
-- Дата: 2026-02-28
-- Описание: Добавление полей для FAQ, описаний и источника создания

-- ==========================================
-- КАТЕГОРИИ: Новые поля
-- ==========================================

-- Поле источника создания (web/tg)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS source VARCHAR(10) DEFAULT 'web' CHECK (source IN ('web', 'tg'));

-- Поле для иконки/арта категории
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS art_url VARCHAR(500);

-- Поле для описания категории (лонгрид)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS long_description TEXT;

-- Поле для FAQ категории (JSON формат)
-- Структура: [{"question": "...", "answer": "...", "icon": "💎"}]
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS faq_json JSONB DEFAULT '[]'::jsonb;

-- Поле для эмодзи-сета категории
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS emoji_set VARCHAR(100);

-- Поле для порядка отображения на главной
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS show_on_main BOOLEAN DEFAULT true;

-- ==========================================
-- ТОВАРЫ: Новые поля
-- ==========================================

-- Поле источника создания (web/tg)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS source VARCHAR(10) DEFAULT 'web' CHECK (source IN ('web', 'tg'));

-- Поле для рейтинга товара
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5);

-- Поле для количества отзывов
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- ==========================================
-- ИНДЕКСЫ для производительности
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_categories_show_on_main ON categories(show_on_on_main) WHERE show_on_main = true;
CREATE INDEX IF NOT EXISTS idx_categories_source ON categories(source);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);

-- ==========================================
-- ДАННЫЕ ПО УМОЛЧАНИЮ
-- ==========================================

-- Обновляем существующие записи
UPDATE categories SET source = 'web' WHERE source IS NULL;
UPDATE categories SET show_on_main = true WHERE show_on_main IS NULL;
UPDATE products SET source = 'web' WHERE source IS NULL;

-- ==========================================
-- ПРИМЕРЫ ДАННЫХ для категорий (FAQ шаблоны)
-- ==========================================

-- Telegram Premium
UPDATE categories SET 
  emoji_set = '⭐️,💎,🚀,🔓,📈',
  long_description = 'Telegram Premium — это не просто «звездочка». Это удвоенные лимиты, расшифровка войсов и уникальные реакции. Мы доставляем подписку легально через внутренние сервисы Telegram.',
  faq_json = '[
    {"question": "Нужен ли пароль от аккаунта?", "answer": "Нет, активация происходит по ссылке-подарку или через логин.", "icon": "⭐️"},
    {"question": "Можно ли купить, если уже есть подписка?", "answer": "Да, она продлится по истечении текущей.", "icon": "💎"},
    {"question": "Как быстро активируется?", "answer": "Мгновенно после подтверждения оплаты.", "icon": "🚀"}
  ]'::jsonb
WHERE slug = 'telegram-premium' OR name ILIKE '%telegram%premium%';

-- Steam
UPDATE categories SET 
  emoji_set = '🎮,🕹,💳,📉,🎒',
  long_description = 'Стим — это сердце твоего ПК. Не ограничивай себя в покупке новинок. Мы помогаем обходить ограничения и пополнять баланс за считанные секунды.',
  faq_json = '[
    {"question": "Придут ли деньги, если у меня аккаунт РФ?", "answer": "Да, мы конвертируем валюту по выгодному курсу.", "icon": "💸"},
    {"question": "Какая комиссия?", "answer": "Минимальная на рынке, итоговая сумма видна сразу в калькуляторе.", "icon": "📉"},
    {"question": "Нужен ли доступ к аккаунту?", "answer": "Нет, пополнение через подарок или код.", "icon": "🔐"}
  ]'::jsonb
WHERE slug = 'steam' OR name ILIKE '%steam%';

-- VPN
UPDATE categories SET 
  emoji_set = '🛡,🌍,🔐,⚡️,📺',
  long_description = 'Твой интернет — твои правила. Безопасный серфинг, доступ к Netflix и Spotify из любой точки мира.',
  faq_json = '[
    {"question": "Сколько устройств можно подключить?", "answer": "До 5 устройств на одну подписку одновременно.", "icon": "🌍"},
    {"question": "Будет ли падать скорость в 4K?", "answer": "Нет, наши сервера поддерживают до 10 Гбит/с.", "icon": "⚡️"},
    {"question": "Есть ли пробный период?", "answer": "Да, 3 дня на тестирование скорости.", "icon": "🛡"}
  ]'::jsonb
WHERE slug = 'vpn' OR name ILIKE '%vpn%';

-- FACEIT
UPDATE categories SET 
  emoji_set = '🎯,🏆,⭐️,🔥,💎',
  long_description = 'FACEIT — это платформа для профессиональных игроков. Поднимите свой скилл до нового уровня с нашим премиум доступом.',
  faq_json = '[
    {"question": "Нужен ли доступ к аккаунту Steam?", "answer": "Да, для привязки FACEIT к Steam.", "icon": "🎯"},
    {"question": "Сколько действует подписка?", "answer": "От 1 месяца до года, на выбор.", "icon": "⭐️"},
    {"question": "Можно ли продлить?", "answer": "Да, автоматически или вручную.", "icon": "🔥"}
  ]'::jsonb
WHERE slug = 'faceit' OR name ILIKE '%faceit%';

-- Roblox
UPDATE categories SET 
  emoji_set = '🤖,💎,🎮,🎁,🚀',
  long_description = 'Roblox — это вселенная игр. Покупайте Robux и премиум подписку для доступа к эксклюзивным возможностям.',
  faq_json = '[
    {"question": "Как приходят Robux?", "answer": "Через группу или подарок в игре.", "icon": "🎁"},
    {"question": "Безопасно ли это?", "answer": "Да, используем только официальные методы.", "icon": "🛡"},
    {"question": "Сколько ждать?", "answer": "От 5 минут до 24 часов.", "icon": "⏱"}
  ]'::jsonb
WHERE slug = 'roblox' OR name ILIKE '%roblox%';

-- Fortnite
UPDATE categories SET 
  emoji_set = '🎮,🏆,💎,🔥,⚡️',
  long_description = 'Fortnite — это больше чем игра. Это стиль жизни. Получите доступ к эксклюзивным скинам и боевым пропускам.',
  faq_json = '[
    {"question": "Нужен ли доступ к аккаунту?", "answer": "Зависит от типа товара (код или вход).", "icon": "🔐"},
    {"question": "Можно ли сменить регион?", "answer": "Да, в настройках аккаунта.", "icon": "🌍"},
    {"question": "Что такое V-Bucks?", "answer": "Внутриигровая валюта для покупок.", "icon": "💎"}
  ]'::jsonb
WHERE slug = 'fortnite' OR name ILIKE '%fortnite%';
