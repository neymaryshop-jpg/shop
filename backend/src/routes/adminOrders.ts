import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateAdmin } from '../middleware/auth';
import { sendTelegramNotification } from '../services/telegramService';

const router = express.Router();

// GET /api/admin/orders - получить все заказы с фильтрацией
router.get('/orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      status,
      payment_method,
      search,
      date_from,
      date_to,
      page = '1',
      limit = '20'
    } = req.query;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      let query = `
        SELECT o.*, 
          json_agg(
            json_build_object(
              'product_name', oi.product_name,
              'product_price', oi.product_price,
              'quantity', oi.quantity,
              'delivery_data', oi.delivery_data
            )
          ) as items,
          u.email as user_email,
          u.full_name as user_name,
          u.telegram_username
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN users u ON o.customer_email = u.email
      `;

      const params: any[] = [];
      let paramCount = 1;

      // WHERE clause conditions
      const conditions: string[] = [];

      if (status && status !== 'all') {
        conditions.push(`o.status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      if (payment_method && payment_method !== 'all') {
        conditions.push(`o.payment_method = $${paramCount}`);
        params.push(payment_method);
        paramCount++;
      }

      if (search) {
        conditions.push(`(
          o.customer_email ILIKE $${paramCount} OR
          o.customer_telegram ILIKE $${paramCount} OR
          u.full_name ILIKE $${paramCount} OR
          CAST(o.id AS TEXT) ILIKE $${paramCount}
        )`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (date_from) {
        conditions.push(`o.created_at >= $${paramCount}`);
        params.push(date_from);
        paramCount++;
      }

      if (date_to) {
        conditions.push(`o.created_at <= $${paramCount}`);
        params.push(date_to);
        paramCount++;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` GROUP BY o.id, u.email, u.full_name, u.telegram_username`;
      query += ` ORDER BY o.created_at DESC`;

      // Pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(parseInt(limit as string), offset);

      const result = await client.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(DISTINCT o.id) as total FROM orders o LEFT JOIN users u ON o.customer_email = u.email';
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      const countResult = await client.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      res.json({
        orders: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Ошибка при получении заказов' });
  }
});

// GET /api/admin/orders/:id - получить детальную информацию о заказе
router.get('/orders/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT o.*, 
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'product_price', oi.product_price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal,
              'delivery_data', oi.delivery_data,
              'delivered_at', oi.delivered_at
            )
          ) as items,
          u.email as user_email,
          u.full_name as user_name,
          u.telegram_username,
          u.created_at as user_registered
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN users u ON o.customer_email = u.email
        WHERE o.id = $1
        GROUP BY o.id, u.email, u.full_name, u.telegram_username, u.created_at
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      res.json(result.rows[0]);

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Ошибка при получении заказа' });
  }
});

// POST /api/admin/orders/:id/verify-payment - верификация платежа через Telegram
router.post('/orders/:id/verify-payment', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verified, note, amount_received } = req.body;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Получаем информацию о заказе
      const orderResult = await client.query(`
        SELECT o.*, u.full_name, u.telegram_username, u.email
        FROM orders o
        LEFT JOIN users u ON o.customer_email = u.email
        WHERE o.id = $1
      `, [id]);

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      const order = orderResult.rows[0];

      // Обновляем статус платежа
      let newStatus = verified ? 'confirmed' : 'rejected';
      let paymentStatus = verified ? 'verified' : 'rejected';

      await client.query(`
        UPDATE orders 
        SET 
          status = $1,
          payment_status = $2,
          payment_note = $3,
          amount_received = $4,
          verified_by = $5,
          verified_at = NOW(),
          updated_at = NOW()
        WHERE id = $6
      `, [newStatus, paymentStatus, note || null, amount_received || null, (req as any).admin.id, id]);

      // Отправляем уведомление в Telegram
      await sendTelegramNotification({
        type: 'payment_verification',
        order_id: parseInt(id),
        verified,
        amount: order.total_amount,
        amount_received: amount_received || order.total_amount,
        customer_name: order.full_name || order.customer_email,
        note: note || '',
        admin_name: (req as any).admin.full_name
      });

      // Если платеж подтвержден, запускаем процесс обработки заказа
      if (verified) {
        // Автоматически меняем статус на processing через 2 минуты
        setTimeout(async () => {
          try {
            await pool.query(`
              UPDATE orders 
              SET status = 'processing', updated_at = NOW()
              WHERE id = $1 AND status = 'confirmed'
            `, [id]);

            // Завершаем заказ через 5 минут
            setTimeout(async () => {
              try {
                const deliveryCode = generateDeliveryCode();
                
                await pool.query(`
                  UPDATE orders 
                  SET 
                    status = 'completed',
                    completed_at = NOW(),
                    updated_at = NOW()
                  WHERE id = $1 AND status = 'processing'
                `, [id]);

                await pool.query(`
                  UPDATE order_items 
                  SET 
                    delivery_data = jsonb_build_object('code', $1),
                    delivered_at = NOW()
                  WHERE order_id = $2
                `, [deliveryCode, id]);

                // Отправляем уведомление о завершении
                await sendTelegramNotification({
                  type: 'order_completed',
                  order_id: parseInt(id),
                  delivery_code: deliveryCode,
                  customer_name: order.full_name || order.customer_email
                });

              } catch (err) {
                console.error('Error completing order:', err);
              }
            }, 300000); // 5 минут

          } catch (err) {
            console.error('Error processing order:', err);
          }
        }, 120000); // 2 минуты
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: verified ? 'Платеж подтвержден' : 'Платеж отклонен',
        status: newStatus,
        payment_status: paymentStatus
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Ошибка при верификации платежа' });
  }
});

// POST /api/admin/orders/:id/update-status - обновить статус заказа
router.post('/orders/:id/update-status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      const result = await client.query(`
        UPDATE orders 
        SET 
          status = $1,
          admin_note = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [status, note || null, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      res.json({
        success: true,
        message: 'Статус обновлен',
        order: result.rows[0]
      });

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса' });
  }
});

// GET /api/admin/stats - расширенная статистика
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      let dateCondition = '';
      switch (period) {
        case '24h':
          dateCondition = "created_at >= NOW() - INTERVAL '24 hours'";
          break;
        case '7d':
          dateCondition = "created_at >= NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          dateCondition = "created_at >= NOW() - INTERVAL '30 days'";
          break;
        case 'all':
          dateCondition = '1=1';
          break;
      }

      const queries = [
        // Общая статистика
        `SELECT COUNT(*) as total_orders FROM orders WHERE ${dateCondition}`,
        
        // Заказы в разбивке по статусам
        `SELECT 
            status,
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total_amount
          FROM orders 
          WHERE ${dateCondition}
          GROUP BY status`,
        
        // Способы оплаты
        `SELECT 
            payment_method,
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total_amount
          FROM orders 
          WHERE ${dateCondition}
          GROUP BY payment_method`,
        
        // Выручка по дням
        `SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders,
            COALESCE(SUM(total_amount), 0) as revenue
          FROM orders 
          WHERE ${dateCondition} AND status IN ('completed', 'confirmed')
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 7`,
        
        // Ожидающие верификации
        `SELECT COUNT(*) as pending_verification 
          FROM orders 
          WHERE status = 'awaiting_confirmation'`
      ];

      const results = await Promise.all(
        queries.map(query => client.query(query))
      );

      const [totalResult, statusResult, paymentResult, revenueResult, pendingResult] = results;

      res.json({
        total_orders: parseInt(totalResult.rows[0].total_orders),
        pending_verification: parseInt(pendingResult.rows[0].pending_verification),
        by_status: statusResult.rows,
        by_payment_method: paymentResult.rows,
        daily_revenue: revenueResult.rows,
        period
      });

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

// Вспомогательные функции
function generateDeliveryCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default router;