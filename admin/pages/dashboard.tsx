import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminDashboard.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface Order {
  id: number;
  status: string;
  total_amount: number;
  customer_email: string;
  created_at: string;
  items: any[];
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { totalOrders: 0, pendingOrders: 0, totalRevenue: 0, todayOrders: 0 } }))
      ]);

      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/';
      } else {
        setError('Ошибка при загрузке данных');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (orderId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_URL}/admin/orders/${orderId}/confirm-received`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchData();
    } catch (err: any) {
      setError('Ошибка при подтверждении оплаты');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/';
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
          <h1>🔐 Админ панель NeymaryShop</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Всего заказов</h3>
            <p className={styles.statNumber}>{stats.totalOrders}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Ожидают оплаты</h3>
            <p className={styles.statNumber}>{stats.pendingOrders}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Общая выручка</h3>
            <p className={styles.statNumber}>{stats.totalRevenue.toFixed(2)}₽</p>
          </div>
          <div className={styles.statCard}>
            <h3>Заказы сегодня</h3>
            <p className={styles.statNumber}>{stats.todayOrders}</p>
          </div>
        </section>

        <section className={styles.orders}>
          <div className={styles.ordersHeader}>
            <h2>Последние заказы</h2>
            <button 
              onClick={() => window.location.href = '/orders'}
              className={styles.viewAllButton}
            >
              Все заказы →
            </button>
          </div>
          <div className={styles.ordersTable}>
            {orders.length === 0 ? (
              <p className={styles.noOrders}>Заказов пока нет</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={styles.orderRow}>
                  <div className={styles.orderInfo}>
                    <h4>Заказ #{order.id}</h4>
                    <p>{order.customer_email || 'Без email'}</p>
                    <p>{new Date(order.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  <div className={styles.orderDetails}>
                    <p className={styles.orderAmount}>{order.total_amount.toFixed(2)}₽</p>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {order.status === 'pending' && 'Ожидает'}
                      {order.status === 'awaiting_confirmation' && 'Ожидает подтверждения'}
                      {order.status === 'confirmed' && 'Подтвержден'}
                      {order.status === 'processing' && 'Обрабатывается'}
                      {order.status === 'completed' && 'Завершен'}
                    </span>
                  </div>
                  <div className={styles.orderActions}>
                    {order.status === 'awaiting_confirmation' && (
                      <button
                        onClick={() => handleConfirmPayment(order.id)}
                        className={styles.confirmButton}
                      >
                        Подтвердить оплату
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}