import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminLogin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/admin/login`, {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
        window.location.href = '/dashboard';
      } else {
        setError('Неверные учетные данные');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Неверные учетные данные');
      } else if (err.response?.status === 403) {
        setError('Доступ запрещен. У вас нет прав администратора.');
      } else {
        setError('Ошибка при входе. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1>🔐 Админ панель</h1>
          <p>NeymaryShop</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Только для авторизованных администраторов</p>
        </div>
      </div>
    </div>
  );
}