-- Миграция: Seed Data для NeymaryShop
-- Дата: 2026-03-01
-- Описание: Заполнение категорий и товаров с basePrice и fakeOldPrice

-- ==========================================
-- ДОБАВЛЕНИЕ ПОЛЕЙ (если нет)
-- ==========================================

-- Добавляем поле fake_old_price для товаров
ALTER TABLE products ADD COLUMN IF NOT EXISTS fake_old_price NUMERIC(10,2) DEFAULT 0;

-- Добавляем поле origin для категорий (если нет)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS origin VARCHAR(10) DEFAULT 'web';

-- ==========================================
-- КАТЕГОРИИ (с origin: 'Web')
-- ==========================================

INSERT INTO categories (name, slug, description, image_url, emoji_set, long_description, faq_json, show_on_main, sort_order, is_active) VALUES
-- ИГРЫ
('FC Mobile', 'fc-mobile', 'Донат в FIFA Mobile и FC Mobile', '🎮', '⚽,🏆,💎,🔥,⭐', 'FC Mobile — легендарный футбольный симулятор. Пополняй баланс официально и создавай команду мечты!', '[{"q":"❓ Нужно ли давать пароль?","a":"🔐 Нет, пополнение по ID аккаунта."},{"q":"🚀 Как быстро придут очки?","a":"⚡ Мгновенно, в течение 1-2 минут."}]', true, 1, true),

('Brawl Stars', 'brawl-stars', 'Гемы и Brawl Pass для Бравл Старс', '🔫', '💎,🎫,⭐,🔥,💰', 'Гемы и Brawl Pass для российских и белорусских аккаунтов с быстрой доставкой.', '[{"q":"❓ Нужен ли пароль?","a":"🔐 Зависит от товара (код или вход)."},{"q":"🚀 Как быстро придет?","a":"⚡ От 5 до 20 минут."}]', true, 2, true),

('Clash Royale', 'clash-royale', 'Гемы и пропуски для Clash Royale Россия/РБ', '👑', '💎,🎫,⭐,🃏,📜', 'Донат в Clash Royale для России и Беларуси. Гемы, золотой пропуск, карты-джокеры.', '[{"q":"❓ Для каких регионов?","a":"🌍 Россия и Республика Беларусь."},{"q":"🚀 Скорость доставки?","a":"⚡ Мгновенно или до 30 минут."}]', true, 3, 'Web', true),

('PUBG Mobile', 'pubg-mobile', 'UC для PUBG Mobile по низким ценам', '🔫', '🏷️,🎫,📦,👑,💰', 'Официальная покупка UC для PUBG Mobile. Скины, машины, пропуски.', '[{"q":"❓ Как купить UC?","a":"🆔 Введите ID игрока при заказе."},{"q":"🚀 Как быстро зачислят?","a":"⚡ 2-10 минут."}]', true, 4, 'Web', true),

('COD Mobile', 'cod-mobile', 'CP для Call of Duty Mobile', '🎯', '🎮,🎫,⭐,🔥,💰', 'Обнови скины в COD Mobile с моментальной доставкой CP.', '[{"q":"❓ Нужен ли пароль?","a":"🔐 Требуется для некоторых товаров."},{"q":"🚀 Скорость?","a":"⚡ До 30 минут."}]', true, 5, 'Web', true),

('Mobile Legends', 'mobile-legends', 'Алмазы для Mobile Legends: Bang Bang', '⚔️', '💎,🎫,⭐,🌍,🔥', 'Мгновенное пополнение алмазов по ID. Любые пропуска и удвоение первой покупки.', '[{"q":"❓ Нужен ли пароль?","a":"🔐 Нет, только ID и сервер."},{"q":"🌍 Для каких регионов?","a":"🌐 Россия, Глобал, Индонезия."}]', true, 6, 'Web', true),

('Genshin Impact', 'genshin-impact', 'Кристаллы и Луна для Genshin Impact', '✨', '💎,🌙,⚔️,🌟,🔮', 'Путешествие по Тейвату с ресурсами. Кристаллы и Благословение луны по UID.', '[{"q":"💎 Что нужно для доната?","a":"🆔 Только UID и сервер."},{"q":"🛡️ Безопасно?","a":"✅ Да, через официальные API."}]', true, 7, 'Web', true),

('Roblox', 'roblox', 'Robux и Premium для Roblox', '🤖', '💎,🎮,🎁,🚀,⭐', 'Безопасное пополнение Robux через подарочные карты. Не нужен пароль!', '[{"q":"💎 Как активировать?","a":"⌨️ Введите код на roblox.com."},{"q":"🛡️ Нужен пароль?","a":"🔐 Нет!"}]', true, 8, 'Web', true),

('Telegram Premium', 'telegram-premium', 'Telegram Premium подписка', '✈️', '⭐,💎,🚀,🔓,📈', 'Telegram Premium расширяет границы общения. Официальная подписка Gift.', '[{"q":"🌟 Как активировать?","a":"🎁 Ссылка-подарок."},{"q":"🔐 Нужен доступ?","a":"🚫 Нет, только username."}]', true, 9, 'Web', true),

('Discord Nitro', 'discord-nitro', 'Discord Nitro Full и Classic', '💬', '⭐,💎,🚀,🎮,🔥', 'Discord Nitro — улучши опыт общения. Бусты, HD стримы, эмодзи.', '[{"q":"💎 Как активировать?","a":"⌨️ Введи код в Discord."},{"q":"🌍 Работает в РФ?","a":"✅ Да, коды глобальные."}]', true, 10, 'Web', true),

('Steam', 'steam', 'Пополнение кошелька Steam', '🎮', '🔋,🌐,💳,🔥,⚽', 'Моментальное зачисление средств по логину или гифтом для РФ и СНГ.', '[{"q":"❓ Нужен пароль?","a":"🔐 Нет, только логин."},{"q":"🌍 Для РФ?","a":"🇷🇺 Да, включая РФ и СНГ."}]', true, 11, 'Web', true),

('YouTube Premium', 'youtube-premium', 'YouTube Premium без рекламы', '▶️', '📺,🎵,🔕,💎,⭐', 'YouTube без рекламы, фоновое воспроизведение, YouTube Music.', '[{"q":"📺 Как активировать?","a":"👨‍👩‍👧‍👦 Добавление в семейную группу."},{"q":"🔐 Нужен пароль?","a":"🚫 Нет, только email."}]', true, 12, 'Web', true),

('Spotify', 'spotify', 'Spotify Premium подписка', '🎵', '🎧,💚,🔓,📱,⭐', 'Музыка без рекламы, офлайн режим, неограниченные пропуски.', '[{"q":"🎵 Как активировать?","a":"💳 Подарочная карта или семейный план."},{"q":"🌍 Работает в РФ?","a":"✅ Да, через другие регионы."}]', true, 13, 'Web', true),

('Netflix', 'netflix', 'Netflix подписка', '🎬', '📺,🍿,🔥,⭐,🎭', 'Тысячи фильмов и сериалов. Стабильные аккаунты с гарантией.', '[{"q":"📺 Какой тариф?","a":"🎬 Индивидуальный или семейный."},{"q":"🛡️ Гарантия?","a":"🔄 Замена на весь срок."}]', true, 14, 'Web', true),

('VK Музыка', 'vk-music', 'VK Музыка подписка', '🔵', '🎵,🎧,📱,💎,⭐', 'Музыка без рекламы, офлайн режим, эксклюзивные релизы.', '[{"q":"🎵 Что дает?","a":"🎧 Музыка без рекламы, офлайн."},{"q":"⏳ Как быстро?","a":"⚡ Промокоды мгновенно."}]', true, 15, 'Web', true),

('Яндекс Плюс', 'yandex-plus', 'Яндекс Плюс подписка', '🟡', '🎵,🎬,📦,⭐,🔙', 'Музыка, Кинопоиск, кэшбэк баллами, бесплатная доставка.', '[{"q":"🎵 Что входит?","a":"📦 Музыка, Кинопоиск, кэшбэк."},{"q":"💰 Есть кэшбэк?","a":"🔙 Да, до 10% баллами."}]', true, 16, 'Web', true),

('Apple Music', 'apple-music', 'Apple Music подписка', '🍎', '🎵,🎧,📱,💎,⭐', 'Миллионы треков в высоком качестве. Индивидуальная и семейная.', '[{"q":"🎵 Как активировать?","a":"💳 Код в App Store или семья."},{"q":"⏳ Как быстро?","a":"⚡ Мгновенно."}]', true, 17, 'Web', true),

('Disney+', 'disney-plus', 'Disney+ подписка', '🏰', '🎬,⭐,🦸,👸,🌍', 'Классика Disney, Pixar, Marvel, Star Wars. Официальные ключи.', '[{"q":"🏰 Как активировать?","a":"💳 Код на сайте Disney+."},{"q":"🌍 Для какого региона?","a":"🌐 Европа и США."}]', true, 18, 'Web', true),

('HBO Max', 'hbo-max', 'HBO Max подписка', '📺', '🎬,👑,🐉,⚔️,🔥', 'Игра престолов, Дом дракона, и другие хиты. Стабильные аккаунты.', '[{"q":"📺 Как получить?","a":"🔑 Личные данные для входа."},{"q":"🌍 Русский язык?","a":"🇷🇺 Да, с озвучкой."}]', true, 19, 'Web', true),

('Amazon Prime', 'amazon-prime', 'Amazon Prime Video', '📦', '🎬,🚚,💎,⭐,🌍', 'Prime Video, музыка, доставка. Официальные методы активации.', '[{"q":"🎬 Что входит?","a":"📦 Video, Music, доставка."},{"q":"⏳ Как быстро?","a":"⚡ 1-2 часа."}]', true, 20, 'Web', true),

('ChatGPT Plus', 'chatgpt-plus', 'ChatGPT Plus подписка', '🤖', '💡,⚡,🧠,💎,⭐', 'Приоритетный доступ к GPT-4 и новым функциям.', '[{"q":"🤖 Что дает?","a":"⚡ GPT-4, приоритет, новые функции."},{"q":"🌍 Работает в РФ?","a":"✅ Да, через другие регионы."}]', true, 21, 'Web', true),

('Midjourney', 'midjourney', 'Midjourney подписка', '🎨', '🖼️,✨,🤖,💎,⭐', 'Генерация изображений через AI. Доступ к генерации в высоком качестве.', '[{"q":"🎨 Что дает?","a":"✨ Генерация, коммерческое использование."},{"q":"⏳ На какой срок?","a":"🗓️ 1-12 месяцев."}]', true, 22, 'Web', true),

('VPN', 'vpn', 'VPN сервисы', '🛡️', '🌍,🔐,⚡,📺,⭐', 'Твой интернет без границ. Популярные VPN сервисы.', '[{"q":"🛡️ Что дает?","a":"🌍 Доступ, анонимность, безопасность."},{"q":"⏳ На какой срок?","a":"🗓️ 1-24 месяца."}]', true, 23, 'Web', true),

('Антивирусы', 'antivirus', 'Антивирусы', '🦠', '🛡️,🔒,💻,⚡,⭐', 'Защита от вирусов и угроз. Лицензионные ключи.', '[{"q":"🛡️ Что дает?","a":"🔒 Защита, шифрование, браузер."},{"q":"💻 Сколько устройств?","a":"📱 1-10 устройств."}]', true, 24, 'Web', true),

('Coursera', 'coursera', 'Coursera Plus', '📚', '🎓,💻,🌍,⭐,📜', 'Онлайн курсы от ведущих университетов. Доступ к 7000+ курсам.', '[{"q":"📚 Что дает?","a":"🎓 7000+ курсов, сертификаты."},{"q":"💡 Сертификаты?","a":"📜 Да, после прохождения."}]', true, 25, 'Web', true),

('Udemy', 'udemy', 'Udemy курсы', '🎓', '📚,💻,🔓,⭐,📜', 'Тысячи курсов по программированию, дизайну, бизнесу.', '[{"q":"📚 Что дает?","a":"🎓 Курсы, сертификаты, пожизненно."},{"q":"💡 Сертификаты?","a":"📜 Да."}]', true, 26, 'Web', true),

('Skillshare', 'skillshare', 'Skillshare', '🎨', '📚,💡,🎬,⭐,📜', 'Креативные курсы для дизайнеров и художников.', '[{"q":"🎨 Что дает?","a":"💡 30000+ курсов, проекты."},{"q":"💡 Сертификаты?","a":"📜 Да."}]', true, 27, 'Web', true),

('Подарочные карты', 'gift-cards', 'Подарочные карты', '🎁', '💳,🎮,🛍️,⭐,🌍', 'Карты пополнения для популярных сервисов.', '[{"q":"🎁 Какие карты?","a":"💳 Steam, PSN, Xbox, Apple."},{"q":"⏳ Как быстро?","a":"⚡ Мгновенно."}]', true, 28, 'Web', true),

('Софт', 'software', 'Лицензионный софт', '💻', '🔧,⚙️,📱,💎,⭐', 'Ключи для популярного ПО. Официальная активация.', '[{"q":"💻 Какой софт?","a":"🔧 Windows, Office, Adobe."},{"q":"⏳ На какой срок?","a":"♾️ Вечно или год."}]', true, 29, 'Web', true),

('Мобильные приложения', 'mobile-apps', 'Премиум приложения', '📱', '🎮,💎,🔓,⭐,🌍', 'Премиум приложения и игры для смартфонов.', '[{"q":"📱 Какие приложения?","a":"🎮 Игры, премиум, подписки."},{"q":"⏳ Как быстро?","a":"⚡ Мгновенно."}]', true, 30, 'Web', true),

('FACEIT', 'faceit', 'FACEIT Premium', '🎯', '🏆,⭐,🔥,💎,🎮', 'Платформа для профессиональных игроков. Приоритетная очередь.', '[{"q":"🏆 Что дает?","a":"⭐ Приоритет, статистика, награды."},{"q":"⏳ На какой срок?","a":"🗓️ 1-12 месяцев."}]', true, 31, 'Web', true),

('ESEA', 'esea', 'ESEA подписка', '🔫', '🎯,🏆,💎,⭐,🎮', 'Лига для серьёзных игроков в CS. Доступ к лигам и античиту.', '[{"q":"🏆 Что дает?","a":"🎯 Лиги, турниры, античит."},{"q":"🌍 Работает в РФ?","a":"✅ Да."}]', true, 32, 'Web', true),

('Epic Games', 'epic-games', 'Epic Games Store', '🎯', '🔥,🏢,🏹,🎁,💥', 'Эксклюзивы и бесплатные раздачи. В-баксы для Fortnite.', '[{"q":"🔑 Как активировать?","a":"🛠 Ключ или вход в аккаунт."},{"q":"🛡️ Безопасно?","a":"✅ Да, официально."}]', true, 33, 'Web', true),

('Origin/EA', 'origin', 'Origin / EA App', '⚽', '🏎️,🔫,🛰️,🧪,🎮', 'FC 24, Apex Legends, The Sims. Коды и донат валюты.', '[{"q":"⚽ Как купить FC Points?","a":"💎 Выбрать количество и указать данные."},{"q":"🔑 Ключ или аккаунт?","a":"📦 Оба варианта."}]', true, 34, 'Web', true),

('Ubisoft', 'ubisoft', 'Ubisoft Connect', '🦅', '🗡️,🕵️,🏙️,🏴‍☠️,🎮', 'Assassin''s Creed, Rainbow Six. Ключи и R6 Credits.', '[{"q":"💎 Как получить Credits?","a":"🔫 Оплатить и зачислим."},{"q":"🗺️ Нужен VPN?","a":"🌍 Обычно нет."}]', true, 35, 'Web', true),

('Battle.net', 'battlenet', 'Battle.net', '🧊', '⚔️,😈,🔥,🛡️,🎮', 'WoW, Diablo, Overwatch. Пополнение кошелька и игровое время.', '[{"q":"⏳ Как продлить WoW?","a":"⚔️ Тайм-карта на 60 дней."},{"q":"🌍 Для RU аккаунта?","a":"🇷🇺 Через подарки."}]', true, 36, 'Web', true),

('Xbox', 'xbox', 'Xbox Game Pass', '💚', '🎮,🕹️,📦,🔋,⭐', 'Game Pass Ultimate, карты пополнения, игры на аккаунт.', '[{"q":"🌟 Что дает Game Pass?","a":"♾ Сотни игр, онлайн, EA Play."},{"q":"🗺️ Нужен другой регион?","a":"🌍 Да, Турция/Аргентина."}]', true, 37, 'Web', true),

('PlayStation', 'playstation', 'PlayStation Store', '💙', '🔌,💿,🏆,🕶️,🎮', 'PSN карты, подписки PS Plus. Турция, Польша, США.', '[{"q":"💳 Как пополнить RU PSN?","a":"🇷🇺 Никак, создайте другой аккаунт."},{"q":"🔥 Уровни PS Plus?","a":"🎭 Essential, Extra, Deluxe."}]', true, 38, 'Web', true),

('Nintendo', 'nintendo', 'Nintendo eShop', '🍄', '🏎️,🗡️,🔴,⭐,🎮', 'Карты пополнения eShop. США, Япония, Польша.', '[{"q":"🍄 Как сменить регион?","a":"⚙️ В настройках аккаунта."},{"q":"🇺🇸 Какие карты выгодны?","a":"💸 США самый дешевый."}]', true, 39, 'Web', true),

('Fortnite', 'fortnite', 'Fortnite V-Bucks', '🏹', '🕺,🚌,🔫,💎,🎮', 'В-баксы и эксклюзивные наборы. Проверенные методы.', '[{"q":"💎 Как купить?","a":"🛒 Выбрать и следовать инструкции."},{"q":"👔 На всех платформах?","a":"🌐 Да, единый аккаунт."}]', true, 40, 'Web', true),

('Minecraft', 'minecraft', 'Minecraft', '⛏️', '🟩,🧱,🧟,💎,🎮', 'Лицензионные ключи Java и Bedrock. Навсегда.', '[{"q":"🏗️ Java или Bedrock?","a":"💻 Java для ПК, Bedrock кроссплатформа."},{"q":"🔑 Как активировать?","a":"🌐 На minecraft.net или Microsoft."}]', true, 41, 'Web', true),

('Valorant', 'valorant', 'Valorant Points', '🎯', '🔫,🔮,🛡️,⚡,🎮', 'VP для скинов и агентов. Турция, СНГ, Европа.', '[{"q":"💎 Как активировать?","a":"🖥️ В клиенте Valorant."},{"q":"🌍 Для какого региона?","a":"📍 Турция, Европа, СНГ."}]', true, 42, 'Web', true),

('League of Legends', 'lol', 'League of Legends RP', '⚔️', '🧙,🐉,💎,🏆,🎮', 'Riot Points для образов и чемпионов. Подарочные карты.', '[{"q":"💎 Что такое RP?","a":"💰 Валюта для образов, чемпионов."},{"q":"🛡️ Нужны данные?","a":"🔐 Нет, код вводите сами."}]', true, 43, 'Web', true);

-- ==========================================
-- ТОВАРЫ (с basePrice, fakeOldPrice, origin: 'Web')
-- ==========================================

-- FC Mobile
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('100 FC Points', '100 FC Points для FC Mobile', 91, 129, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('Star Pass', 'Звездный премиум-абонемент FC Mobile', 450, 599, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('520 FC Points', '520 FC Points для FC Mobile', 442, 499, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('1070 FC Points', '1070 FC Points для FC Mobile', 919, 1099, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('2200 FC Points', '2200 FC Points для FC Mobile', 1829, 1999, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('5750 FC Points', '5750 FC Points для FC Mobile', 4549, 4799, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('12000 FC Points', '12000 FC Points для FC Mobile', 9099, 10890, (SELECT id FROM categories WHERE slug='fc-mobile'), NULL, 9999, true, 'Web', 'auto', true);

-- Brawl Stars
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('30 гемов', '30 гемов для Brawl Stars', 188, 260, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('80 гемов', '80 гемов для Brawl Stars', 450, 589, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('170 гемов', '170 гемов для Brawl Stars', 899, 1189, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('360 гемов', '360 гемов для Brawl Stars', 1819, 2336, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('950 гемов', '950 гемов для Brawl Stars', 4539, 5711, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('Brawl Pass Plus', 'Brawl Pass Plus для Brawl Stars', 720, 950, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('Brawl Pass', 'Brawl Pass для Brawl Stars', 829, 0, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true),
('Кристаллы х50', 'Кристаллы х50 со скидкой 40%', 188, 0, (SELECT id FROM categories WHERE slug='brawl-stars'), NULL, 9999, true, 'Web', 'auto', true);

-- Clash Royale
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('80 гемов', '80 гемов для Clash Royale', 97, 0, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true),
('500 гемов', '500 гемов для Clash Royale', 461, 499, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true),
('1200 гемов', '1200 гемов для Clash Royale', 929, 999, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true),
('2500 гемов', '2500 гемов для Clash Royale', 1869, 1999, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true),
('Diamond Pass', 'Diamond Pass для Clash Royale', 1119, 1690, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true),
('Бриллиантовый пропуск', 'Бриллиантовый пропуск Clash Royale', 810, 1050, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true),
('Золотой пропуск', 'Золотой пропуск Clash Royale', 460, 620, (SELECT id FROM categories WHERE slug='clash-royale'), NULL, 9999, true, 'Web', 'auto', true);

-- PUBG Mobile
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('60 UC', '60 UC для PUBG Mobile', 82, 115, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('300+25 UC', '325 UC для PUBG Mobile', 375, 525, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('600+60 UC', '660 UC для PUBG Mobile', 809, 1099, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('1500+300 UC', '1800 UC для PUBG Mobile', 2019, 2699, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('3000+850 UC', '3850 UC для PUBG Mobile', 4029, 5199, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('Royale Pass', 'Royale Pass для PUBG Mobile', 420, 580, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('Prime (1 месяц)', 'Prime подписка на 1 месяц', 79, 0, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true),
('Prime Plus (1 месяц)', 'Prime Plus подписка на 1 месяц', 779, 0, (SELECT id FROM categories WHERE slug='pubg-mobile'), NULL, 9999, true, 'Web', 'auto', true);

-- Genshin Impact
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Благословение луны', 'Благословение луны Genshin Impact', 395, 499, (SELECT id FROM categories WHERE slug='genshin-impact'), NULL, 9999, true, 'Web', 'auto', true),
('Кристаллы х60', '60 Кристаллов Истока', 85, 120, (SELECT id FROM categories WHERE slug='genshin-impact'), NULL, 9999, true, 'Web', 'auto', true),
('Кристаллы х300', '300 Кристаллов Истока', 425, 0, (SELECT id FROM categories WHERE slug='genshin-impact'), NULL, 9999, true, 'Web', 'auto', true),
('Кристаллы х980', '980 Кристаллов Истока', 1390, 0, (SELECT id FROM categories WHERE slug='genshin-impact'), NULL, 9999, true, 'Web', 'auto', true);

-- Roblox
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('400 Robux', '400 Robux для Roblox', 430, 590, (SELECT id FROM categories WHERE slug='roblox'), NULL, 9999, true, 'Web', 'auto', true),
('800 Robux', '800 Robux для Roblox', 860, 1180, (SELECT id FROM categories WHERE slug='roblox'), NULL, 9999, true, 'Web', 'auto', true),
('1700 Robux', '1700 Robux для Roblox', 1850, 0, (SELECT id FROM categories WHERE slug='roblox'), NULL, 9999, true, 'Web', 'auto', true),
('Premium 450', 'Roblox Premium 450', 450, 610, (SELECT id FROM categories WHERE slug='roblox'), NULL, 9999, true, 'Web', 'auto', true),
('Premium 1000', 'Roblox Premium 1000', 1000, 1350, (SELECT id FROM categories WHERE slug='roblox'), NULL, 9999, true, 'Web', 'auto', true);

-- Telegram Premium
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Telegram Premium 3 мес', 'Telegram Premium на 3 месяца', 320, 450, (SELECT id FROM categories WHERE slug='telegram-premium'), NULL, 9999, true, 'Web', 'auto', true),
('Telegram Premium 6 мес', 'Telegram Premium на 6 месяцев', 600, 850, (SELECT id FROM categories WHERE slug='telegram-premium'), NULL, 9999, true, 'Web', 'auto', true),
('Telegram Premium 12 мес', 'Telegram Premium на 12 месяцев', 1100, 1500, (SELECT id FROM categories WHERE slug='telegram-premium'), NULL, 9999, true, 'Web', 'auto', true);

-- Discord Nitro
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Discord Nitro Full', 'Discord Nitro Full подписка', 380, 550, (SELECT id FROM categories WHERE slug='discord-nitro'), NULL, 9999, true, 'Web', 'auto', true),
('Discord Nitro Basic', 'Discord Nitro Basic подписка', 180, 250, (SELECT id FROM categories WHERE slug='discord-nitro'), NULL, 9999, true, 'Web', 'auto', true);

-- YouTube Premium
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('YouTube Premium 1 мес', 'YouTube Premium на 1 месяц', 150, 0, (SELECT id FROM categories WHERE slug='youtube-premium'), NULL, 9999, true, 'Web', 'auto', true),
('YouTube Premium 3 мес', 'YouTube Premium на 3 месяца', 420, 0, (SELECT id FROM categories WHERE slug='youtube-premium'), NULL, 9999, true, 'Web', 'auto', true),
('YouTube Premium 12 мес', 'YouTube Premium на 12 месяцев', 1500, 0, (SELECT id FROM categories WHERE slug='youtube-premium'), NULL, 9999, true, 'Web', 'auto', true);

-- Spotify
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Spotify Premium 1 мес', 'Spotify Premium на 1 месяц', 120, 0, (SELECT id FROM categories WHERE slug='spotify'), NULL, 9999, true, 'Web', 'auto', true),
('Spotify Premium 3 мес', 'Spotify Premium на 3 месяца', 330, 0, (SELECT id FROM categories WHERE slug='spotify'), NULL, 9999, true, 'Web', 'auto', true),
('Spotify Premium 12 мес', 'Spotify Premium на 12 месяцев', 1200, 0, (SELECT id FROM categories WHERE slug='spotify'), NULL, 9999, true, 'Web', 'auto', true);

-- Netflix
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Netflix 1 мес', 'Netflix подписка на 1 месяц', 250, 0, (SELECT id FROM categories WHERE slug='netflix'), NULL, 9999, true, 'Web', 'auto', true),
('Netflix 3 мес', 'Netflix подписка на 3 месяца', 700, 0, (SELECT id FROM categories WHERE slug='netflix'), NULL, 9999, true, 'Web', 'auto', true),
('Netflix 12 мес', 'Netflix подписка на 12 месяцев', 2500, 0, (SELECT id FROM categories WHERE slug='netflix'), NULL, 9999, true, 'Web', 'auto', true);

-- Steam
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Пополнение 100₽', 'Пополнение кошелька Steam 100₽', 113, 0, (SELECT id FROM categories WHERE slug='steam'), NULL, 9999, true, 'Web', 'auto', true),
('Пополнение 500₽', 'Пополнение кошелька Steam 500₽', 565, 0, (SELECT id FROM categories WHERE slug='steam'), NULL, 9999, true, 'Web', 'auto', true),
('Пополнение 1000₽', 'Пополнение кошелька Steam 1000₽', 1130, 0, (SELECT id FROM categories WHERE slug='steam'), NULL, 9999, true, 'Web', 'auto', true),
('Пополнение 5000₽', 'Пополнение кошелька Steam 5000₽', 5650, 0, (SELECT id FROM categories WHERE slug='steam'), NULL, 9999, true, 'Web', 'auto', true);

-- VK Музыка
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('VK Музыка 1 мес', 'VK Музыка подписка на 1 месяц', 169, 0, (SELECT id FROM categories WHERE slug='vk-music'), NULL, 9999, true, 'Web', 'auto', true),
('VK Музыка 3 мес', 'VK Музыка подписка на 3 месяца', 480, 0, (SELECT id FROM categories WHERE slug='vk-music'), NULL, 9999, true, 'Web', 'auto', true),
('VK Музыка 12 мес', 'VK Музыка подписка на 12 месяцев', 1690, 0, (SELECT id FROM categories WHERE slug='vk-music'), NULL, 9999, true, 'Web', 'auto', true);

-- Яндекс Плюс
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Яндекс Плюс 1 мес', 'Яндекс Плюс на 1 месяц', 299, 0, (SELECT id FROM categories WHERE slug='yandex-plus'), NULL, 9999, true, 'Web', 'auto', true),
('Яндекс Плюс 3 мес', 'Яндекс Плюс на 3 месяца', 850, 0, (SELECT id FROM categories WHERE slug='yandex-plus'), NULL, 9999, true, 'Web', 'auto', true),
('Яндекс Плюс 12 мес', 'Яндекс Плюс на 12 месяцев', 2990, 0, (SELECT id FROM categories WHERE slug='yandex-plus'), NULL, 9999, true, 'Web', 'auto', true);

-- Apple Music
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Apple Music 1 мес', 'Apple Music на 1 месяц', 269, 0, (SELECT id FROM categories WHERE slug='apple-music'), NULL, 9999, true, 'Web', 'auto', true),
('Apple Music 3 мес', 'Apple Music на 3 месяца', 760, 0, (SELECT id FROM categories WHERE slug='apple-music'), NULL, 9999, true, 'Web', 'auto', true),
('Apple Music 12 мес', 'Apple Music на 12 месяцев', 2690, 0, (SELECT id FROM categories WHERE slug='apple-music'), NULL, 9999, true, 'Web', 'auto', true);

-- VPN
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('VPN 1 мес', 'VPN подписка на 1 месяц', 200, 0, (SELECT id FROM categories WHERE slug='vpn'), NULL, 9999, true, 'Web', 'auto', true),
('VPN 3 мес', 'VPN подписка на 3 месяца', 540, 0, (SELECT id FROM categories WHERE slug='vpn'), NULL, 9999, true, 'Web', 'auto', true),
('VPN 12 мес', 'VPN подписка на 12 месяцев', 1800, 0, (SELECT id FROM categories WHERE slug='vpn'), NULL, 9999, true, 'Web', 'auto', true);

-- FACEIT
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('FACEIT Premium 1 мес', 'FACEIT Premium на 1 месяц', 500, 0, (SELECT id FROM categories WHERE slug='faceit'), NULL, 9999, true, 'Web', 'auto', true),
('FACEIT Premium 3 мес', 'FACEIT Premium на 3 месяца', 1400, 0, (SELECT id FROM categories WHERE slug='faceit'), NULL, 9999, true, 'Web', 'auto', true),
('FACEIT Premium 12 мес', 'FACEIT Premium на 12 месяцев', 5000, 0, (SELECT id FROM categories WHERE slug='faceit'), NULL, 9999, true, 'Web', 'auto', true);

-- ChatGPT Plus
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('ChatGPT Plus 1 мес', 'ChatGPT Plus на 1 месяц', 2500, 0, (SELECT id FROM categories WHERE slug='chatgpt-plus'), NULL, 9999, true, 'Web', 'auto', true);

-- Midjourney
INSERT INTO products (name, description, base_price, fake_old_price, category_id, image_url, stock_quantity, is_active, origin, delivery_type, is_digital) VALUES
('Midjourney 1 мес', 'Midjourney подписка на 1 месяц', 1200, 0, (SELECT id FROM categories WHERE slug='midjourney'), NULL, 9999, true, 'Web', 'auto', true),
('Midjourney 3 мес', 'Midjourney подписка на 3 месяца', 3400, 0, (SELECT id FROM categories WHERE slug='midjourney'), NULL, 9999, true, 'Web', 'auto', true);
