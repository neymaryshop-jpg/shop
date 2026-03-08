-- Миграция: Seed Data для NeymaryShop (Упрощённая версия)
-- Дата: 2026-03-01

-- Добавляем поле fake_old_price
ALTER TABLE products ADD COLUMN IF NOT EXISTS fake_old_price NUMERIC(10,2) DEFAULT 0;

-- Обновляем source для категорий (если есть поле origin)
-- UPDATE categories SET source = 'web' WHERE source IS NULL;

-- ==========================================
-- ТОВАРЫ (price_android = basePrice, fake_old_price = fakeOldPrice)
-- ==========================================

-- FC Mobile
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  '100 FC Points', '100 FC Points для FC Mobile', 91, 91, 91, 129, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'fc-mobile';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Star Pass', 'Звездный премиум-абонемент FC Mobile', 450, 450, 450, 599, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'fc-mobile';

-- Brawl Stars
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  '30 гемов', '30 гемов для Brawl Stars', 188, 188, 188, 260, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'brawl-stars';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Brawl Pass Plus', 'Brawl Pass Plus для Brawl Stars', 720, 720, 720, 950, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'brawl-stars';

-- Clash Royale
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  '500 гемов', '500 гемов для Clash Royale', 461, 461, 461, 499, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'clash-royale';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Бриллиантовый пропуск', 'Бриллиантовый пропуск Clash Royale', 810, 810, 810, 1050, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'clash-royale';

-- PUBG Mobile
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  '60 UC', '60 UC для PUBG Mobile', 82, 82, 82, 115, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'pubg-mobile';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Royale Pass', 'Royale Pass для PUBG Mobile', 420, 420, 420, 580, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'pubg-mobile';

-- Genshin Impact
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Благословение луны', 'Благословение луны Genshin Impact', 395, 395, 395, 499, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'genshin-impact';

-- Roblox
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  '400 Robux', '400 Robux для Roblox', 430, 430, 430, 590, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'roblox';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Premium 450', 'Roblox Premium 450', 450, 450, 450, 610, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'roblox';

-- Telegram Premium
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Telegram Premium 3 мес', 'Telegram Premium на 3 месяца', 320, 320, 320, 450, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'telegram-premium';

-- Discord Nitro
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Discord Nitro Full', 'Discord Nitro Full подписка', 380, 380, 380, 550, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'discord-nitro';

-- Steam (пополнение)
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Пополнение 100₽', 'Пополнение кошелька Steam 100₽', 100, 100, 100, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'steam';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Пополнение 500₽', 'Пополнение кошелька Steam 500₽', 500, 500, 500, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'steam';

INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Пополнение 1000₽', 'Пополнение кошелька Steam 1000₽', 1000, 1000, 1000, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'steam';

-- YouTube Premium
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'YouTube Premium 1 мес', 'YouTube Premium на 1 месяц', 150, 150, 150, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'youtube-premium';

-- Spotify
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Spotify Premium 1 мес', 'Spotify Premium на 1 месяц', 120, 120, 120, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'spotify';

-- Netflix
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Netflix 1 мес', 'Netflix подписка на 1 месяц', 250, 250, 250, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'netflix';

-- VK Музыка
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'VK Музыка 1 мес', 'VK Музыка подписка на 1 месяц', 169, 169, 169, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'vk-music';

-- Яндекс Плюс
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Яндекс Плюс 1 мес', 'Яндекс Плюс на 1 месяц', 299, 299, 299, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'yandex-plus';

-- Apple Music
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Apple Music 1 мес', 'Apple Music на 1 месяц', 269, 269, 269, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'apple-music';

-- VPN
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'VPN 1 мес', 'VPN подписка на 1 месяц', 200, 200, 200, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'vpn';

-- FACEIT
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'FACEIT Premium 1 мес', 'FACEIT Premium на 1 месяц', 500, 500, 500, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'faceit';

-- ChatGPT Plus
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'ChatGPT Plus 1 мес', 'ChatGPT Plus на 1 месяц', 2500, 2500, 2500, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'chatgpt-plus';

-- Midjourney
INSERT INTO products (name, description, price_android, price_pc, price_ios, fake_old_price, category_id, stock_quantity, is_active, source, delivery_type, is_digital) 
SELECT 
  'Midjourney 1 мес', 'Midjourney подписка на 1 месяц', 1200, 1200, 1200, 0, id, 9999, true, 'web', 'auto', true
FROM categories WHERE slug = 'midjourney';
