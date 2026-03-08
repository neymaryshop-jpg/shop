import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// CORS middleware для роутера
router.use((req: Request, res: Response, next: any) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware для опциональной аутентификации
const optionalAuth = async (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const result = await pool.query(
        `SELECT id, email, full_name, referral_code, referral_balance FROM users
         JOIN sessions s ON users.id = s.user_id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
      );

      if (result.rows.length > 0) {
        (req as any).user = result.rows[0];
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }

  next();
};

// ==========================================
// ORDERS API
// ==========================================

interface CreateOrderBody {
  product_id: number;
  quantity: number;
  platform: 'android' | 'pc' | 'ios';
  email: string;
  tg_username?: string;
  payment_method: string;
  coupon_code?: string;
  total_amount: number;
  referral_code?: string;
}

// POST /api/orders - создать заказ
router.post('/', optionalAuth, async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
  const client = await pool.connect();

  try {
    const {
      product_id,
      quantity,
      platform,
      email,
      tg_username,
      payment_method,
      coupon_code,
      total_amount,
      referral_code,
    } = req.body;

    // Валидация
    if (!product_id || !payment_method || !email || !total_amount) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    await client.query('BEGIN');

    // Проверка товара
    const productResult = await client.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const product = productResult.rows[0];

    // Проверка наличия
    if (product.stock_quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Недостаточно товара на складе' });
    }

    // Проверка купона
    let discount = 0;
    let couponId = null;

    if (coupon_code) {
      const couponResult = await client.query(`
        SELECT * FROM coupons
        WHERE code = $1 AND is_active = true
          AND (valid_until IS NULL OR valid_until > NOW())
          AND valid_from <= NOW()
          AND (max_uses IS NULL OR uses_count < max_uses)
      `, [coupon_code]);

      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];

        if (total_amount >= coupon.min_order_amount) {
          if (coupon.discount_type === 'percent') {
            discount = (total_amount * coupon.discount_value) / 100;
          } else {
            discount = coupon.discount_value;
          }

          couponId = coupon.id;

          // Увеличиваем счётчик использований
          await client.query(
            'UPDATE coupons SET uses_count = uses_count + 1 WHERE id = $1',
            [couponId]
          );
        }
      }
    }

    // Финальная сумма
    const finalAmount = total_amount - discount;

    // Получаем или создаём пользователя
    let userId = (req as any).user?.id;
    let userReferralCode = (req as any).user?.referral_code;

    if (!userId && email) {
      // Проверяем, существует ли пользователь
      const existingUser = await client.query(
        'SELECT id, referral_code FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        userReferralCode = existingUser.rows[0].referral_code;
      } else {
        // Создаём нового пользователя
        const tempPassword = Math.random().toString(36).substring(2, 12);
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const newUserResult = await client.query(
          `INSERT INTO users (email, password_hash, is_verified, is_active)
           VALUES ($1, $2, true, true)
           RETURNING id, referral_code`,
          [email, passwordHash]
        );

        userId = newUserResult.rows[0].id;
        userReferralCode = newUserResult.rows[0].referral_code;
      }
    }

    // Обработка реферального кода
    let referrerId = null;
    if (referral_code && referral_code !== userReferralCode) {
      const referrerResult = await client.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referral_code]
      );

      if (referrerResult.rows.length > 0) {
        referrerId = referrerResult.rows[0].id;

        // Создаём запись о реферале
        await client.query(`
          INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code)
          VALUES ($1, $2, $3)
          ON CONFLICT (referred_user_id) DO NOTHING
        `, [referrerId, userId, referral_code]);
      }
    }

    // Создаём заказ
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id,
        status,
        payment_method,
        customer_email,
        customer_telegram,
        subtotal,
        discount_amount,
        total_amount,
        metadata
      ) VALUES (
        $1, 'pending', $2, $3, $4, $5, $6, $7, $8
      ) RETURNING *
    `, [
      userId,
      payment_method,
      email,
      tg_username || null,
      total_amount,
      discount,
      finalAmount,
      JSON.stringify({
        product_name: product.name,
        platform,
        quantity,
        coupon_code: coupon_code || null,
      }),
    ]);

    const order = orderResult.rows[0];

    // Создаём элемент заказа
    const priceKey = `price_${platform}`;
    const unitPrice = product[priceKey as keyof typeof product];

    await client.query(`
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        product_price,
        quantity,
        subtotal,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      order.id,
      product_id,
      product.name,
      typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice as string) || 0,
      quantity,
      typeof unitPrice === 'number' ? unitPrice * quantity : parseFloat(unitPrice as string) * quantity,
      JSON.stringify({ platform }),
    ]);

    // Обновляем статистику товара
    await client.query(
      'UPDATE products SET sales_count = sales_count + $1 WHERE id = $2',
      [quantity, product_id]
    );

    // Генерируем реферальный код для пользователя если нет
    if (!userReferralCode) {
      userReferralCode = 'REF' + userId + Math.random().toString(36).substring(2, 8).toUpperCase();
      await client.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2',
        [userReferralCode, userId]
      );
    }

    await client.query('COMMIT');

    // Уведомление в Telegram (опционально)
    try {
      const TelegramBot = require('node-telegram-bot-api');
      const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
      await bot.sendMessage(
        process.env.ADMIN_IDS,
        `🔔 Новый заказ #${order.id}\n` +
        `Товар: ${product.name}\n` +
        `Сумма: ${finalAmount.toFixed(2)}₽\n` +
        `Email: ${email}`
      );
    } catch (e) {
      console.error('Telegram notification error:', e);
    }

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
      },
      referral_code: userReferralCode,
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      error: error.code === '23505' ? 'Заказ уже существует' : 'Ошибка при создании заказа',
    });
  } finally {
    client.release();
  }
});

// GET /api/orders/:id - получить заказ
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT o.*,
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'product_price', oi.product_price,
            'quantity', oi.quantity,
            'metadata', oi.metadata,
            'delivery_data', oi.delivery_data,
            'delivered_at', oi.delivered_at
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = result.rows[0];

    // Извлекаем код доставки
    const productCode = order.items[0]?.delivery_data?.code || null;

    res.json({
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
      customer_email: order.customer_email,
      created_at: order.created_at,
      product_code: productCode,
      items: order.items,
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Ошибка при получении заказа' });
  }
});

// GET /api/orders - получить заказы пользователя (для авторизованных)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const email = (req as any).user?.email || req.query.email;

    if (!userId && !email) {
      return res.status(401).json({ error: 'Требуется авторизация или email' });
    }

    const result = await pool.query(`
      SELECT o.*,
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'product_price', oi.product_price,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `, [email]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
});

export default router;
