import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware для аутентификации
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, full_name FROM users 
       JOIN sessions s ON users.id = s.user_id 
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Сессия истекла' });
    }

    (req as any).user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
};

// ==========================================
// WISHLIST API
// ==========================================

// Получить список избранного
router.get('/wishlist', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(`
      SELECT p.*, c.name as category_name,
             w.created_at as added_at
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = $1 AND p.is_active = true
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Ошибка при получении списка желаемого' });
  }
});

// Добавить в избранное
router.post('/wishlist/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Не указан товар' });
    }

    // Проверка существования товара
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const result = await pool.query(`
      INSERT INTO wishlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `, [userId, product_id]);

    res.json({ 
      success: true, 
      message: 'Добавлено в избранное',
      item: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ 
      error: error.code === '23505' ? 'Уже в избранном' : 'Ошибка при добавлении в избранное' 
    });
  }
});

// Удалить из избранного
router.delete('/wishlist/remove/:product_id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { product_id } = req.params;

    const result = await pool.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    res.json({ 
      success: true, 
      message: 'Удалено из избранного'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Ошибка при удалении из избранного' });
  }
});

// Проверить, есть ли товар в избранном
router.get('/wishlist/check/:product_id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { product_id } = req.params;

    const result = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    res.json({ is_favorite: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Ошибка при проверке избранного' });
  }
});

// ==========================================
// REVIEWS API
// ==========================================

// Получить отзывы товара
router.get('/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '20', sort = 'created_at DESC' } = req.query;

    const result = await pool.query(`
      SELECT r.*, u.full_name, u.avatar_url,
             COUNT(rv.id) as votes_count,
             SUM(CASE WHEN rv.vote_type = 'up' THEN 1 ELSE 0 END) as up_votes,
             SUM(CASE WHEN rv.vote_type = 'down' THEN 1 ELSE 0 END) as down_votes
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN review_votes rv ON r.id = rv.review_id
      WHERE r.product_id = $1 AND r.is_approved = true
      GROUP BY r.id, u.id
      ORDER BY ${sort === 'rating' ? 'r.rating DESC' : 'r.created_at DESC'}
      LIMIT $2
    `, [id, parseInt(limit as string)]);

    // Получаем средний рейтинг
    const ratingResult = await pool.query(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE product_id = $1 AND is_approved = true
    `, [id]);

    res.json({
      reviews: result.rows,
      rating_summary: ratingResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов' });
  }
});

// Создать отзыв
router.post('/products/:id/reviews', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { rating, title, comment, pros, cons, images } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
    }

    // Проверка, покупал ли пользователь этот товар
    const orderCheck = await pool.query(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = (SELECT email FROM users WHERE id = $1)
        AND oi.product_id = $2
        AND o.status = 'completed'
    `, [userId, id]);

    const isVerifiedPurchase = orderCheck.rows.length > 0;

    const result = await pool.query(`
      INSERT INTO reviews (
        user_id, product_id, rating, title, comment, pros, cons,
        is_verified_purchase, images
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [userId, id, rating, title || null, comment || null, pros || null, cons || null, isVerifiedPurchase, images || null]);

    // Обновляем рейтинг товара
    await pool.query(`
      UPDATE products SET
        rating_avg = (SELECT AVG(rating) FROM reviews WHERE product_id = $1 AND is_approved = true),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND is_approved = true)
      WHERE id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Отзыв отправлен на модерацию',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Ошибка при создании отзыва' });
  }
});

// Голосовать за отзыв
router.post('/reviews/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { vote_type } = req.body;

    if (!['up', 'down'].includes(vote_type)) {
      return res.status(400).json({ error: 'Неверный тип голоса' });
    }

    const result = await pool.query(`
      INSERT INTO review_votes (review_id, user_id, vote_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (review_id, user_id)
      DO UPDATE SET vote_type = $3
      RETURNING *
    `, [id, userId, vote_type]);

    // Обновляем счетчик helpful_count
    await pool.query(`
      UPDATE reviews SET
        helpful_count = (
          SELECT COUNT(*) FROM review_votes 
          WHERE review_id = $1 AND vote_type = 'up'
        )
      WHERE id = $1
    `, [id]);

    res.json({ success: true, vote: result.rows[0] });
  } catch (error) {
    console.error('Error voting review:', error);
    res.status(500).json({ error: 'Ошибка при голосовании' });
  }
});

// ==========================================
// NOTIFICATIONS API
// ==========================================

// Получить уведомления пользователя
router.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = '50', unread_only = 'false' } = req.query;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (unread_only === 'true') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(parseInt(limit as string));

    const result = await pool.query(query, params);

    // Получаем количество непрочитанных
    const unreadCount = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      notifications: result.rows,
      unread_count: parseInt(unreadCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Ошибка при получении уведомлений' });
  }
});

// Отметить уведомление как прочитанное
router.patch('/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомления' });
  }
});

// Отметить все уведомления как прочитанные
router.patch('/notifications/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true, message: 'Все уведомления отмечены как прочитанные' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Ошибка при обновлении уведомлений' });
  }
});

// ==========================================
// PRODUCT COMPARISON API
// ==========================================

// Получить товары для сравнения
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { product_ids } = req.query;

    if (!product_ids) {
      return res.status(400).json({ error: 'Не указаны товары для сравнения' });
    }

    const ids = (product_ids as string).split(',').map(id => parseInt(id));

    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ANY($1) AND p.is_active = true
    `, [ids]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products for comparison:', error);
    res.status(500).json({ error: 'Ошибка при получении товаров для сравнения' });
  }
});

// Добавить в сравнение (для авторизованных)
router.post('/compare/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { product_id } = req.body;

    await pool.query(`
      INSERT INTO product_comparisons (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `, [userId, product_id]);

    res.json({ success: true, message: 'Добавлено в сравнение' });
  } catch (error) {
    console.error('Error adding to comparison:', error);
    res.status(500).json({ error: 'Ошибка при добавлении в сравнение' });
  }
});

// Очистить сравнение
router.delete('/compare/clear', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await pool.query(
      'DELETE FROM product_comparisons WHERE user_id = $1',
      [userId]
    );

    res.json({ success: true, message: 'Сравнение очищено' });
  } catch (error) {
    console.error('Error clearing comparison:', error);
    res.status(500).json({ error: 'Ошибка при очистке сравнения' });
  }
});

// ==========================================
// REFERRAL API
// ==========================================

// Получить реферальную информацию
router.get('/referral', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Получаем реферальный код
    let userResult = await pool.query(
      'SELECT referral_code, referral_balance FROM users WHERE id = $1',
      [userId]
    );

    let referralCode = userResult.rows[0]?.referral_code;

    // Если нет кода, создаем
    if (!referralCode) {
      referralCode = 'REF' + userId + Math.random().toString(36).substring(2, 8).toUpperCase();
      await pool.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2',
        [referralCode, userId]
      );
    }

    // Получаем статистику
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_referrals,
        COALESCE(SUM(bonus_amount), 0) as total_earned
      FROM referrals
      WHERE referrer_user_id = $1
    `, [userId]);

    // Получаем историю начислений
    const earningsResult = await pool.query(`
      SELECT re.*, o.total_amount, u.email as referred_email
      FROM referral_earnings re
      JOIN referrals r ON re.referral_id = r.id
      JOIN users u ON r.referred_user_id = u.id
      JOIN orders o ON re.order_id = o.id
      WHERE r.referrer_user_id = $1
      ORDER BY re.created_at DESC
      LIMIT 20
    `, [userId]);

    res.json({
      referral_code: referralCode,
      referral_link: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`,
      balance: userResult.rows[0]?.referral_balance || 0,
      stats: statsResult.rows[0],
      earnings: earningsResult.rows
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    res.status(500).json({ error: 'Ошибка при получении реферальной информации' });
  }
});

// Применить реферальный код при регистрации
router.post('/referral/apply', async (req: Request, res: Response) => {
  try {
    const { referral_code, user_id } = req.body;

    if (!referral_code || !user_id) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    // Находим реферера
    const referrerResult = await pool.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [referral_code]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Реферальный код не найден' });
    }

    const referrerId = referrerResult.rows[0].id;

    // Создаем запись о реферале
    await pool.query(`
      INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code)
      VALUES ($1, $2, $3)
      ON CONFLICT (referred_user_id) DO NOTHING
    `, [referrerId, user_id, referral_code]);

    res.json({ success: true, message: 'Реферальный код применен' });
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ error: 'Ошибка при применении реферального кода' });
  }
});

// ==========================================
// COUPONS API
// ==========================================

// Проверить купон
router.post('/coupons/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code, order_amount = 0 } = req.body;

    const result = await pool.query(`
      SELECT * FROM coupons
      WHERE code = $1 
        AND is_active = true
        AND (valid_until IS NULL OR valid_until > NOW())
        AND valid_from <= NOW()
        AND (max_uses IS NULL OR uses_count < max_uses)
    `, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Купон не найден или неактивен' 
      });
    }

    const coupon = result.rows[0];

    // Проверка минимальной суммы заказа
    if (order_amount < coupon.min_order_amount) {
      return res.status(400).json({ 
        valid: false, 
        error: `Минимальная сумма заказа: ${coupon.min_order_amount}₽` 
      });
    }

    // Проверка, не использовал ли пользователь этот купон
    const userCheck = await pool.query(
      'SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_id = $2',
      [userId, coupon.id]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Вы уже использовали этот купон' 
      });
    }

    // Рассчитываем скидку
    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = (order_amount * coupon.discount_value) / 100;
    } else {
      discount = coupon.discount_value;
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Ошибка при проверке купона' });
  }
});

// ==========================================
// NEWSLETTER API
// ==========================================

// Подписаться на рассылку
router.post('/newsletter/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, user_id } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Не указан email' });
    }

    await pool.query(`
      INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (email) 
      DO UPDATE SET is_subscribed = true, unsubscribed_at = NULL
    `, [email, user_id || null]);

    res.json({ success: true, message: 'Вы успешно подписаны на рассылку' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ error: 'Ошибка при подписке на рассылку' });
  }
});

// Отписаться от рассылки
router.post('/newsletter/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Не указан email' });
    }

    await pool.query(`
      UPDATE newsletter_subscriptions
      SET is_subscribed = false, unsubscribed_at = NOW()
      WHERE email = $1
    `, [email]);

    res.json({ success: true, message: 'Вы отписаны от рассылки' });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({ error: 'Ошибка при отписке от рассылки' });
  }
});

// ==========================================
// SUPPORT TICKETS API
// ==========================================

// Создать тикет поддержки
router.post('/support/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { subject, message, category, priority = 'normal' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const result = await pool.query(`
      INSERT INTO support_tickets (user_id, subject, message, category, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, subject, message, category || null, priority]);

    res.json({
      success: true,
      message: 'Тикет создан',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Ошибка при создании тикета' });
  }
});

// Получить тикеты пользователя
router.get('/support/tickets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query(`
      SELECT * FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Ошибка при получении тикетов' });
  }
});

// Добавить сообщение в тикет
router.post('/support/tickets/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    // Проверка, принадлежит ли тикет пользователю
    const ticketCheck = await pool.query(
      'SELECT user_id FROM support_tickets WHERE id = $1',
      [id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Тикет не найден' });
    }

    if (ticketCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }

    await pool.query(`
      INSERT INTO ticket_messages (ticket_id, user_id, message, is_admin)
      VALUES ($1, $2, $3, false)
    `, [id, userId, message]);

    // Обновляем время обновления тикета
    await pool.query(
      'UPDATE support_tickets SET updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ success: true, message: 'Сообщение добавлено' });
  } catch (error) {
    console.error('Error adding ticket message:', error);
    res.status(500).json({ error: 'Ошибка при добавлении сообщения' });
  }
});

export default router;
