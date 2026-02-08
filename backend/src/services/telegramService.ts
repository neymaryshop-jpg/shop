import { Pool } from 'pg';

interface TelegramNotification {
  type: 'payment_verification' | 'order_completed' | 'new_payment';
  order_id: number;
  verified?: boolean;
  amount?: number;
  amount_received?: number;
  customer_name?: string;
  note?: string;
  admin_name?: string;
  delivery_code?: string;
}

export async function sendTelegramNotification(data: TelegramNotification): Promise<void> {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      // Получаем всех админов с привязанными Telegram
      const adminsResult = await client.query(`
        SELECT u.telegram_id, u.telegram_username, ar.role_name
        FROM users u
        JOIN admin_roles ar ON u.id = ar.user_id
        WHERE u.telegram_id IS NOT NULL 
        AND u.is_active = true
        AND ar.role_name IN ('admin', 'super_admin')
      `);

      if (adminsResult.rows.length === 0) {
        console.log('No admins with Telegram found');
        return;
      }

      let message = '';

      switch (data.type) {
        case 'payment_verification':
          message = data.verified 
            ? `✅ *Платеж подтвержден*\n\n` +
              `🔢 Заказ: #${data.order_id}\n` +
              `👤 Клиент: ${data.customer_name}\n` +
              `💰 Сумма: ${data.amount}₽\n` +
              `${data.amount_received && data.amount_received !== data.amount ? `💳 Получено: ${data.amount_received}₽\n` : ''}` +
              `👮 Администратор: ${data.admin_name}\n` +
              `${data.note ? `📝 Примечание: ${data.note}\n` : ''}` +
              `🔄 Статус: Обработка заказа...`
            : `❌ *Платеж отклонен*\n\n` +
              `🔢 Заказ: #${data.order_id}\n` +
              `👤 Клиент: ${data.customer_name}\n` +
              `💰 Сумма: ${data.amount}₽\n` +
              `👮 Администратор: ${data.admin_name}\n` +
              `${data.note ? `📝 Причина: ${data.note}\n` : ''}` +
              `🔴 Статус: Отменен`;
          break;

        case 'order_completed':
          message = `🎉 *Заказ выполнен*\n\n` +
            `🔢 Заказ: #${data.order_id}\n` +
            `👤 Клиент: ${data.customer_name}\n` +
            `🎫 Код доставки: \`${data.delivery_code}\`\n` +
            `✅ Статус: Завершен\n\n` +
            `🔔 Код отправлен клиенту`;
          break;

        case 'new_payment':
          message = `🔔 *Новый платеж на проверку*\n\n` +
            `🔢 Заказ: #${data.order_id}\n` +
            `💰 Сумма: ${data.amount}₽\n\n` +
            `🔍 Требуется верификация в админ панели`;
          break;
      }

      // Отправляем сообщение каждому администратору
      for (const admin of adminsResult.rows) {
        try {
          const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
          if (!telegramBotToken) {
            console.log('TELEGRAM_BOT_TOKEN not configured');
            continue;
          }

          const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: admin.telegram_id,
              text: message,
              parse_mode: 'Markdown',
              disable_web_page_preview: true
            })
          });

          if (!response.ok) {
            console.error(`Failed to send Telegram notification to ${admin.telegram_id}:`, await response.text());
          } else {
            console.log(`Telegram notification sent to ${admin.telegram_username} (@${admin.telegram_id})`);
          }

        } catch (error) {
          console.error(`Error sending Telegram notification to admin ${admin.telegram_id}:`, error);
        }
      }

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

// Функция для верификации платежа через Telegram бота
export async function verifyPaymentInTelegram(orderId: number): Promise<string> {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
      // Получаем информацию о заказе
      const orderResult = await client.query(`
        SELECT o.*, 
          json_agg(
            json_build_object(
              'product_name', oi.product_name,
              'product_price', oi.product_price,
              'quantity', oi.quantity
            )
          ) as items,
          u.full_name, u.telegram_username
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN users u ON o.customer_email = u.email
        WHERE o.id = $1
        GROUP BY o.id, u.full_name, u.telegram_username
      `, [orderId]);

      if (orderResult.rows.length === 0) {
        return 'Заказ не найден';
      }

      const order = orderResult.rows[0];

      let message = `🔍 *Верификация платежа*\n\n`;
      message += `🔢 Заказ: #${order.id}\n`;
      message += `👤 Клиент: ${order.full_name || order.customer_email}\n`;
      message += `📧 Email: ${order.customer_email}\n`;
      if (order.customer_telegram) {
        message += `💬 Telegram: ${order.customer_telegram}\n`;
      }
      message += `💰 Сумма: ${order.total_amount}₽\n`;
      message += `💳 Способ: ${order.payment_method}\n`;
      message += `📅 Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}\n\n`;

      if (order.items && order.items.length > 0) {
        message += `📦 Товары:\n`;
        order.items.forEach((item: any, index: number) => {
          if (item && item.product_name) {
            message += `${index + 1}. ${item.product_name} - ${item.product_price}₽ x${item.quantity}\n`;
          }
        });
        message += '\n';
      }

      message += `🔄 Для подтверждения используйте команду в боте:\n`;
      message += `/verify_payment ${order.id} [amount_received] [note]\n\n`;
      message += `Пример: /verify_payment ${order.id} ${order.total_amount} Платеж получен`;

      // Отправляем сообщение всем админам
      await sendTelegramNotification({
        type: 'payment_verification',
        order_id: order.id,
        verified: undefined, // Запрос на верификацию
        amount: order.total_amount,
        customer_name: order.full_name || order.customer_email,
        note: 'Требуется верификация платежа'
      });

      return message;

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Error in verifyPaymentInTelegram:', error);
    return 'Ошибка при подготовке верификации платежа';
  }
}