-- Миграция: Добавление категорий
-- Дата: 2026-02-28

INSERT INTO categories (name, slug, description, image_url, emoji_set, long_description, show_on_main, sort_order) VALUES
-- ИГРЫ
('Steam', 'steam', 'Пополнение кошелька Steam, игры, ключи', '🎮', '🎮,🕹,💳,📉,🎒', 'Steam — это сердце твоего ПК. Не ограничивай себя в покупке новинок. Мы помогаем обходить ограничения и пополнять баланс за считанные секунды.', true, 1),
('Epic Games', 'epic-games', 'Аккаунты и ключи Epic Games Store', '🎯', '🎯,🎮,🔑,💎,⚡', 'Epic Games Store — эксклюзивные игры и бесплатные раздачи каждую неделю.', true, 2),
('Origin/EA', 'origin', 'Игры от Electronic Arts', '🏁', '🏁,🎮,🏎,⚽,🔫', 'EA Play — доступ к библиотеке игр Electronic Arts.', true, 3),
('Ubisoft Connect', 'ubisoft', 'Игры Ubisoft', '🔷', '🔷,🎮,🗡,🏰,🎯', 'Ubisoft — Assassin''s Creed, Far Cry, Rainbow Six и другие хиты.', true, 4),
('Battle.net', 'battlenet', 'Игры Blizzard и Activision', '⚔', '⚔,🎮,🛡,💀,🔥', 'Battle.net — World of Warcraft, Diablo, Overwatch, Call of Duty.', true, 5),
('Xbox', 'xbox', 'Xbox Game Pass и ключи', '🟢', '🟢,🎮,👾,🕹,💚', 'Xbox Game Pass — более 100 игр по подписке.', true, 6),
('PlayStation', 'playstation', 'PSN карты и подписки', '🔵', '🔵,🎮,🎯,⭐,🔷', 'PlayStation Store — эксклюзивы Sony и популярные мультиплатформенные игры.', true, 7),
('Nintendo', 'nintendo', 'Nintendo Switch игры', '🔴', '🔴,🎮,🍄,⭐,🎯', 'Nintendo eShop — Марио, Зельда, Покемоны и другие эксклюзивы.', true, 8),
('Roblox', 'roblox', 'Robux и Premium', '🤖', '🤖,💎,🎮,🎁,🚀', 'Roblox — вселенная игр. Покупайте Robux и премиум подписку для доступа к эксклюзивным возможностям.', true, 9),
('Fortnite', 'fortnite', 'V-Bucks и боевые пропуска', '🏆', '🏆,🎮,💎,🔥,⚡', 'Fortnite — это больше чем игра. Это стиль жизни. Получите доступ к эксклюзивным скинам и боевым пропускам.', true, 10),
('Minecraft', 'minecraft', 'Аккаунты и ключи', '⛏', '⛏,🧱,🎮,💎,🌍', 'Minecraft — строй, исследуй, выживай в бесконечном мире.', true, 11),
('Genshin Impact', 'genshin', 'Кристаллы и аккаунты', '✨', '✨,⚔,💎,🌙,🎯', 'Genshin Impact — исследуй мир Тейвата, собирай персонажей.', true, 12),
('PUBG', 'pubg', 'UC и аккаунты', '🔫', '🔫,🎯,🪂,🏆,⚡', 'PUBG — выживай, сражайся, побеждай.', true, 13),
('Valorant', 'valorant', 'VP и аккаунты', '🎯', '🎯,🔫,⚡,🏆,💎', 'Valorant — тактический шутер от Riot Games.', true, 14),
('League of Legends', 'lol', 'RP и аккаунты', '⚔', '⚔,🏆,💎,🔥,⚡', 'LoL — легендарная MOBA.', true, 15),

-- ПОДПИСКИ
('Telegram Premium', 'telegram-premium', 'Подписка Telegram Premium', '⭐', '⭐,💎,🚀,🔓,📈', 'Telegram Premium — это не просто «звездочка». Это удвоенные лимиты, расшифровка войсов и уникальные реакции.', true, 20),
('YouTube Premium', 'youtube-premium', 'Подписка YouTube без рекламы', '▶', '▶,📺,🎵,🔕,💎', 'YouTube Premium — смотри без рекламы, слушай музыку в фоне.', true, 21),
('Spotify', 'spotify', 'Spotify Premium', '🎵', '🎵,🎧,💚,🔓,📱', 'Spotify Premium — музыка без рекламы, офлайн режим, неограниченные пропуски.', true, 22),
('Netflix', 'netflix', 'Netflix подписка', '🎬', '🎬,📺,🍿,🔥,⭐', 'Netflix — тысячи фильмов и сериалов в одном месте.', true, 23),
('Disney+', 'disney-plus', 'Disney+ подписка', '🏰', '🏰,🎬,⭐,🦸,👸', 'Disney+ — классика Disney, Pixar, Marvel, Star Wars.', true, 24),
('HBO Max', 'hbo-max', 'HBO Max подписка', '📺', '📺,🎬,👑,🐉,⚔', 'HBO Max — Игра престолов, Дом дракона, и другие хиты.', true, 25),
('Amazon Prime', 'amazon-prime', 'Amazon Prime Video', '📦', '📦,🎬,🚚,💎,⭐', 'Amazon Prime — видео, доставка, музыка в одной подписке.', true, 26),
('Apple Music', 'apple-music', 'Apple Music подписка', '🍎', '🍎,🎵,🎧,📱,💎', 'Apple Music — миллионы треков в высоком качестве.', true, 27),
('Яндекс Плюс', 'yandex-plus', 'Яндекс Плюс подписка', '🟡', '🟡,🎵,🎬,📦,⭐', 'Яндекс Плюс — музыка, кино, кэшбэк в одной подписке.', true, 28),
('VK Музыка', 'vk-music', 'VK Музыка подписка', '🔵', '🔵,🎵,🎧,📱,💎', 'VK Музыка — слушай любимые треки без рекламы.', true, 29),

-- АККАУНТЫ
('Discord', 'discord', 'Discord Nitro', '💬', '💬,🎮,⭐,💎,🚀', 'Discord Nitro — улучши свой опыт общения.', true, 40),
('FACEIT', 'faceit', 'FACEIT Premium', '🎯', '🎯,🏆,⭐,🔥,💎', 'FACEIT — платформа для профессиональных игроков. Поднимите свой скилл до нового уровня.', true, 41),
('ESEA', 'esea', 'ESEA подписка', '🔫', '🔫,🎯,🏆,💎,⭐', 'ESEA — лига для серьёзных игроков в CS.', true, 42),
('ChatGPT Plus', 'chatgpt', 'ChatGPT Plus подписка', '🤖', '🤖,💡,⚡,🧠,💎', 'ChatGPT Plus — приоритетный доступ к GPT-4.', true, 43),
('Midjourney', 'midjourney', 'Midjourney подписка', '🎨', '🎨,🖼,✨,🤖,💎', 'Midjourney — генерация изображений через AI.', true, 44),

-- VPN И БЕЗОПАСНОСТЬ
('VPN', 'vpn', 'VPN сервисы', '🛡', '🛡,🌍,🔐,⚡,📺', 'Твой интернет — твои правила. Безопасный серфинг, доступ к Netflix и Spotify из любой точки мира.', true, 50),
('Антивирусы', 'antivirus', 'Антивирусы', '🦠', '🦠,🛡,🔒,💻,⚡', 'Защити своё устройство от вирусов и угроз.', true, 51),

-- ОБРАЗОВАНИЕ
('Coursera', 'coursera', 'Coursera курсы', '📚', '📚,🎓,💻,🌍,⭐', 'Coursera — онлайн курсы от ведущих университетов.', true, 60),
('Udemy', 'udemy', 'Udemy курсы', '🎓', '🎓,📚,💻,🔓,⭐', 'Udemy — тысячи курсов по программированию, дизайну, бизнесу.', true, 61),
('Skillshare', 'skillshare', 'Skillshare подписка', '🎨', '🎨,📚,💡,🎬,⭐', 'Skillshare — креативные курсы для дизайнеров и художников.', true, 62),

-- ПРОЧЕЕ
('Подарочные карты', 'gift-cards', 'Подарочные карты', '🎁', '🎁,💳,🎮,🛍,⭐', 'Подарочные карты для любых случаев.', true, 70),
('Софт', 'software', 'Программное обеспечение', '💻', '💻,🔧,⚙,📱,💎', 'Лицензионный софт для работы и развлечений.', true, 71),
('Мобильные приложения', 'mobile-apps', 'Приложения для iOS/Android', '📱', '📱,🎮,💎,🔓,⭐', 'Премиум приложения и игры для смартфонов.', true, 72);

-- Обновляем emoji_set для существующих категорий
UPDATE categories SET emoji_set = '🎮,🕹,💳,📉,🎒' WHERE slug = 'games';
UPDATE categories SET emoji_set = '⭐,💎,🚀,🔓,📈' WHERE slug = 'subscriptions';
UPDATE categories SET emoji_set = '🔑,💳,📱,💎,⭐' WHERE slug = 'accounts';
