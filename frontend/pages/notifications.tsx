import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await axios.get(`${API_URL}/notifications`, {
        params: { unread_only: filter === 'unread' ? 'true' : 'false' },
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      )
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      )
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.delete(
        `${API_URL}/notifications/${notificationId}`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      )
      setNotifications(notifications.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'order_status': '📦',
      'payment': '💳',
      'promotion': '🎁',
      'new_product': '🆕',
      'review': '⭐',
      'support': '💬',
      'system': '⚙️'
    }
    return icons[type] || '🔔'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Только что'
    if (hours < 24) return `${hours} ч. назад`
    if (days < 7) return `${days} дн. назад`
    return date.toLocaleDateString('ru-RU')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Навигация */}
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/catalog" className="text-gray-300 hover:text-white">Каталог</Link>
            <Link href="/cart" className="text-gray-300 hover:text-white">🛒 Корзина</Link>
            <Link href="/profile" className="text-gray-300 hover:text-white">👤 Профиль</Link>
            <Link href="/" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold">
              Главная
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🔔 Уведомления</h1>
            <p className="text-gray-400">
              {unreadCount > 0 ? (
                <span className="text-purple-400">{unreadCount} непрочитанных</span>
              ) : (
                'Нет непрочитанных'
              )}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 font-semibold ${
                  filter === 'all' ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 font-semibold ${
                  filter === 'unread' ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
              >
                Непрочитанные
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-semibold"
              >
                ✓ Все прочитано
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔕</div>
            <h2 className="text-2xl font-bold mb-4">
              {filter === 'unread' ? 'Нет непрочитанных уведомлений' : 'Уведомлений пока нет'}
            </h2>
            <p className="text-gray-400">
              {filter === 'unread' 
                ? 'Все уведомления прочитаны' 
                : 'Здесь будут появляться уведомления о заказах и акциях'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-gradient-to-br rounded-2xl p-6 border transition-all ${
                  notification.is_read
                    ? 'from-gray-800 to-gray-900 border-gray-700'
                    : 'from-purple-900/30 to-pink-900/30 border-purple-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{notification.title}</h3>
                        <p className="text-gray-400 text-sm">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Прочитать
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-500 hover:text-red-400 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300">{notification.message}</p>
                    
                    {notification.data?.order_id && (
                      <Link
                        href={`/orders/${notification.data.order_id}`}
                        className="inline-block mt-3 text-purple-400 hover:text-purple-300"
                      >
                        Подробнее о заказе →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
