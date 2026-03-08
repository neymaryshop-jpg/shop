import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminOrders.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface Order {
  id: number;
  status: string;
  total_amount: number;
  customer_email: string;
  customer_telegram?: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  payment_status?: string;
  items: OrderItem[];
  user_email?: string;
  user_name?: string;
  telegram_username?: string;
}

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
  delivery_data?: any;
  delivered_at?: string;
}

interface Stats {
  total_orders: number;
  pending_verification: number;
  by_status: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
  by_payment_method: Array<{
    payment_method: string;
    count: number;
    total_amount: number;
  }>;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    payment_method: 'all',
    search: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    verified: true,
    amount_received: '',
    note: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    fetchOrders();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await axios.get(`${API_URL}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // API возвращает массив заказов напрямую
      const ordersData = Array.isArray(response.data) ? response.data : (response.data.orders || []);
      setOrders(ordersData);
      
      // Обновляем пагинацию если есть
      if (response.data.pagination) {
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/';
      } else {
        console.error('Orders error:', err);
        setError('Ошибка при загрузке заказов: ' + (err.message || 'Неизвестная ошибка'));
      }
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_URL}/admin/stats?period=7d`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      
      await axios.post(
        `${API_URL}/admin/orders/${orderId}/verify-payment`,
        {
          verified: verifyForm.verified,
          amount_received: verifyForm.amount_received ? parseFloat(verifyForm.amount_received) : null,
          note: verifyForm.note
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowVerifyModal(false);
      setSelectedOrder(null);
      setVerifyForm({ verified: true, amount_received: '', note: '' });
      
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      setError('Ошибка при верификации платежа');
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string, note?: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      
      await axios.post(
        `${API_URL}/admin/orders/${orderId}/update-status`,
        { status, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchOrders();
      fetchStats();
    } catch (err: any) {
      setError('Ошибка при обновлении статуса');
    }
  };

  const openVerifyModal = (order: Order) => {
    setSelectedOrder(order);
    setVerifyForm({
      verified: true,
      amount_received: order.total_amount.toString(),
      note: ''
    });
    setShowVerifyModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'awaiting_confirmation': return styles.statusAwaiting;
      case 'confirmed': return styles.statusConfirmed;
      case 'processing': return styles.statusProcessing;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      case 'refunded': return styles.statusRefunded;
      default: return styles.statusDefault;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'awaiting_confirmation': return 'Ожидает подтверждения';
      case 'confirmed': return 'Подтвержден';
      case 'processing': return 'Обрабатывается';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
      case 'refunded': return 'Возврат';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>📦 Управление заказами</h1>
          <button onClick={() => window.location.href = '/dashboard'} className={styles.backButton}>
            ← На дашборд
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}

        {stats && (
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <h3>Всего заказов</h3>
              <p className={styles.statNumber}>{stats.total_orders}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Ожидают верификации</h3>
              <p className={styles.statNumber}>{stats.pending_verification}</p>
            </div>
            <div className={styles.statCard}>
              <h3>По статусам</h3>
              <div className={styles.smallChart}>
                {stats.by_status.map(item => (
                  <div key={item.status} className={styles.chartItem}>
                    <span className={styles.chartLabel}>{getStatusText(item.status)}</span>
                    <span className={styles.chartValue}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.statCard}>
              <h3>Способы оплаты</h3>
              <div className={styles.smallChart}>
                {stats.by_payment_method.map(item => (
                  <div key={item.payment_method} className={styles.chartItem}>
                    <span className={styles.chartLabel}>{item.payment_method}</span>
                    <span className={styles.chartValue}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className={styles.filters}>
          <h2>Фильтры</h2>
          <div className={styles.filterRow}>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="awaiting_confirmation">Ожидает подтверждения</option>
              <option value="confirmed">Подтвержден</option>
              <option value="processing">Обрабатывается</option>
              <option value="completed">Завершен</option>
              <option value="cancelled">Отменен</option>
            </select>

            <select
              value={filters.payment_method}
              onChange={(e) => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
              className={styles.filterSelect}
            >
              <option value="all">Все способы оплаты</option>
              <option value="crypto">Криптовалюта</option>
              <option value="ru-card">Карты РФ</option>
            </select>

            <input
              type="text"
              placeholder="Поиск по email, Telegram, ID..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className={styles.filterInput}
            />

            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className={styles.filterInput}
            />

            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className={styles.filterInput}
            />

            <button onClick={fetchOrders} className={styles.filterButton}>
              Применить
            </button>
          </div>
        </section>

        <section className={styles.orders}>
          <div className={styles.ordersHeader}>
            <h2>Заказы ({pagination.total})</h2>
            <div className={styles.pagination}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className={styles.pageButton}
              >
                ←
              </button>
              <span className={styles.pageInfo}>
                Страница {pagination.page} из {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className={styles.pageButton}
              >
                →
              </button>
            </div>
          </div>

          <div className={styles.ordersTable}>
            {orders.length === 0 ? (
              <p className={styles.noOrders}>Заказы не найдены</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.orderRow}>
                  <div className={styles.orderInfo}>
                    <h4>Заказ #{order.id}</h4>
                    <p>👤 {order.user_name || 'Имя не указано'}</p>
                    <p>📧 {order.customer_email}</p>
                    {order.customer_telegram && <p>💬 {order.customer_telegram}</p>}
                    <p>📅 {new Date(order.created_at).toLocaleString('ru-RU')}</p>
                  </div>

                  <div className={styles.orderDetails}>
                    <p className={styles.orderAmount}>{order.total_amount.toFixed(2)}₽</p>
                    <p className={styles.paymentMethod}>{order.payment_method}</p>
                    <span className={`${styles.status} ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className={styles.orderActions}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={styles.detailButton}
                    >
                      Подробности
                    </button>

                    {order.status === 'awaiting_confirmation' && (
                      <button
                        onClick={() => openVerifyModal(order)}
                        className={styles.verifyButton}
                      >
                        📋 Верифицировать
                      </button>
                    )}

                    {(order.status === 'confirmed' || order.status === 'processing') && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cancelled', 'Отменено администратором')}
                        className={styles.cancelButton}
                      >
                        ❌ Отменить
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Модальное окно верификации платежа */}
      {showVerifyModal && selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>📋 Верификация платежа</h3>
              <button onClick={() => setShowVerifyModal(false)} className={styles.closeButton}>
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.orderSummary}>
                <h4>Заказ #{selectedOrder.id}</h4>
                <p>👤 {selectedOrder.user_name}</p>
                <p>📧 {selectedOrder.customer_email}</p>
                <p>💰 Сумма заказа: {selectedOrder.total_amount.toFixed(2)}₽</p>
                <p>💳 Способ: {selectedOrder.payment_method}</p>
              </div>

              <div className={styles.verifyForm}>
                <div className={styles.radioGroup}>
                  <label>
                    <input
                      type="radio"
                      checked={verifyForm.verified}
                      onChange={() => setVerifyForm(prev => ({ ...prev, verified: true }))}
                    />
                    ✅ Подтвердить платеж
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={!verifyForm.verified}
                      onChange={() => setVerifyForm(prev => ({ ...prev, verified: false }))}
                    />
                    ❌ Отклонить платеж
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label>Полученная сумма:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verifyForm.amount_received}
                    onChange={(e) => setVerifyForm(prev => ({ ...prev, amount_received: e.target.value }))}
                    placeholder={selectedOrder.total_amount.toString()}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Примечание:</label>
                  <textarea
                    value={verifyForm.note}
                    onChange={(e) => setVerifyForm(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Комментарий к платежу..."
                    className={styles.formTextarea}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowVerifyModal(false)}
                className={styles.cancelModalButton}
              >
                Отмена
              </button>
              <button
                onClick={() => handleVerifyPayment(selectedOrder.id)}
                className={verifyForm.verified ? styles.confirmModalButton : styles.rejectModalButton}
              >
                {verifyForm.verified ? '✅ Подтвердить' : '❌ Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подробностей заказа */}
      {selectedOrder && !showVerifyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>📦 Подробности заказа #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeButton}>
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.orderDetailsGrid}>
                <div>
                  <h4>Информация о клиенте</h4>
                  <p>👤 Имя: {selectedOrder.user_name || 'Не указано'}</p>
                  <p>📧 Email: {selectedOrder.customer_email}</p>
                  {selectedOrder.customer_telegram && (
                    <p>💬 Telegram: {selectedOrder.customer_telegram}</p>
                  )}
                  {selectedOrder.telegram_username && (
                    <p>🏷️ Username: @{selectedOrder.telegram_username}</p>
                  )}
                </div>

                <div>
                  <h4>Информация о заказе</h4>
                  <p>🆔 ID: {selectedOrder.id}</p>
                  <p>📅 Создан: {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}</p>
                  <p>🔄 Обновлен: {new Date(selectedOrder.updated_at).toLocaleString('ru-RU')}</p>
                  <p>💰 Сумма: {selectedOrder.total_amount.toFixed(2)}₽</p>
                  <p>💳 Способ оплаты: {selectedOrder.payment_method}</p>
                  <p>📊 Статус: {getStatusText(selectedOrder.status)}</p>
                </div>
              </div>

              <div>
                <h4>Товары в заказе</h4>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className={styles.orderItem}>
                    <span>{item.product_name}</span>
                    <span>{item.product_price.toFixed(2)}₽ × {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeModalButton}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}