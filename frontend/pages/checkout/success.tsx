import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface OrderSuccessData {
  orderId: string
  productName: string
  totalAmount: number
  referralCode: string | null
  paymentDetails?: {
    method: string
    address?: string
    card?: string
    holder?: string
    bank?: string
    phone?: string
    network?: string
    amount: number
  }
  email?: string
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderSuccessData | null>(null)
  const [productCode, setProductCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const savedData = localStorage.getItem('order_success')
    if (!savedData) {
      router.push('/catalog')
      return
    }

    const data = JSON.parse(savedData)
    setOrderData(data)
    loadOrderDetails(data.orderId)

    // Показываем реферальный модал через 2 секунды
    const timer = setTimeout(() => {
      setShowReferralModal(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const loadOrderDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (response.data.product_code) {
        setProductCode(response.data.product_code)
      }
    } catch (error) {
      console.error('Error loading order details:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Скопировано в буфер обмена!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const submitReview = async () => {
    if (!orderData || !reviewText.trim()) return

    setSubmittingReview(true)

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Пожалуйста, войдите для оставления отзыва')
        return
      }

      // Находим product_id из заказа (нужно будет доработать API)
      await axios.post(`${API_URL}/products/reviews`, {
        rating: reviewRating,
        comment: reviewText,
        // product_id будет добавлен из orderData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      alert('Спасибо за ваш отзыв!')
      setReviewText('')
      setShowReferralModal(false)
    } catch (error: any) {
      console.error('Review error:', error)
      alert(error.response?.data?.error || 'Ошибка при отправке отзыва')
    } finally {
      setSubmittingReview(false)
    }
  }

  const shareReferralLink = async () => {
    if (!orderData?.referralCode) return

    const link = `${window.location.origin}/register?ref=${orderData.referralCode}`
    await copyToClipboard(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-[#e0e0e0] font-mono">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-[#e0e0e0] font-mono text-xl">Заказ не найден</p>
          <Link href="/catalog" className="mt-4 inline-block text-[#00ff9d] font-mono underline">
            ← Вернуться к покупкам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Успешная покупка */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">Покупка успешна!</h1>
          <p className="text-gray-400">Заказ #{orderData.orderId}</p>
        </div>

        {/* Реквизиты для оплаты */}
        {orderData.paymentDetails && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-4 text-center">💳 Реквизиты для оплаты</h2>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Способ оплаты</p>
                <p className="text-white font-semibold">{orderData.paymentDetails.method}</p>
              </div>
              
              {orderData.paymentDetails?.address && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">TON адрес:</p>
                  <div className="bg-black rounded border border-gray-800 p-3 break-all">
                    <code className="text-xs text-[#00ff9d]">{orderData.paymentDetails.address}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(orderData.paymentDetails!.address!)}
                    className="mt-2 text-[#00ff9d] text-sm hover:underline"
                  >
                    📋 Скопировать адрес
                  </button>
                </div>
              )}
              
              {orderData.paymentDetails?.card && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Номер карты:</p>
                  <div className="bg-black rounded border border-gray-800 p-3">
                    <code className="text-lg text-[#00ff9d]">{orderData.paymentDetails.card}</code>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Получатель: {orderData.paymentDetails.holder} | Банк: {orderData.paymentDetails.bank}
                  </p>
                  <button
                    onClick={() => copyToClipboard(orderData.paymentDetails!.card!)}
                    className="mt-2 text-[#00ff9d] text-sm hover:underline"
                  >
                    📋 Скопировать номер
                  </button>
                </div>
              )}
              
              {orderData.paymentDetails?.phone && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Телефон для СБП:</p>
                  <div className="bg-black rounded border border-gray-800 p-3 text-center">
                    <code className="text-lg text-[#00ff9d]">{orderData.paymentDetails.phone}</code>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Банк: {orderData.paymentDetails.bank}
                  </p>
                </div>
              )}
              
              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">К оплате:</span>
                  <span className="text-2xl font-bold text-[#00ff9d]">
                    {orderData.paymentDetails.amount.toFixed(2)}₽
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ После оплаты напишите в поддержку Telegram с номером заказа
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Код товара */}
        {productCode ? (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-4 text-center">Ваш код активации</h2>
            <div className="bg-black rounded border border-gray-800 p-4 mb-4">
              <code className="text-2xl text-[#00ff9d] break-all">{productCode}</code>
            </div>
            <button
              onClick={() => copyToClipboard(productCode)}
              className="w-full bg-[#00ff9d] text-black font-bold py-3 rounded-lg hover:opacity-90"
            >
              📋 Скопировать код
            </button>
            <p className="text-gray-500 text-sm mt-4 text-center">
              Код также отправлен на вашу почту
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-4 text-center">Статус заказа</h2>
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-gray-400">Товар готовится к выдаче</p>
              <p className="text-gray-500 text-sm mt-2">
                Вы получите код в течение 5 минут на email
              </p>
            </div>
          </div>
        )}

        {/* Детали заказа */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <h3 className="font-bold text-white mb-4">Детали заказа</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Товар</span>
              <span className="text-white">{orderData.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Сумма</span>
              <span className="text-[#00ff9d]">{orderData.totalAmount.toFixed(2)}₽</span>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="space-y-3">
          <Link
            href="/catalog"
            className="block w-full bg-gray-800 border border-gray-700 text-[#e0e0e0] font-semibold py-3 rounded-lg text-center hover:bg-gray-700"
          >
            Продолжить покупки
          </Link>
          <Link
            href="/orders"
            className="block w-full text-[#00ff9d] font-semibold py-3 rounded-lg text-center hover:underline"
          >
            Мои заказы →
          </Link>
        </div>

        {/* Поддержка */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Вопросы? Напишите в поддержку:</p>
          <a href="https://t.me/support" className="text-[#00ff9d] hover:underline">
            @support
          </a>
        </div>
      </div>

      {/* Пост-покупочный модал */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Заголовок */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Получите 5% с каждой покупки друга!
                </h3>
                <p className="text-gray-400 text-sm">
                  Поделитесь своей реферальной ссылкой
                </p>
              </div>

              {/* Реферальный код */}
              {orderData.referralCode ? (
                <div className="bg-gray-900 rounded border border-gray-800 p-4 mb-6">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm mb-2">Ваш реферальный код</p>
                    <code className="text-2xl text-[#00ff9d] block mb-3">
                      {orderData.referralCode}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(orderData.referralCode!)}
                        className="flex-1 bg-gray-800 border border-gray-700 px-4 py-2 rounded hover:bg-gray-700 text-sm"
                      >
                        📋 Копировать
                      </button>
                      <button
                        onClick={shareReferralLink}
                        className="flex-1 bg-[#00ff9d] text-black font-semibold px-4 py-2 rounded hover:opacity-90 text-sm"
                      >
                        🔗 Поделиться
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded border border-gray-800 p-4 mb-6 text-center">
                  <p className="text-gray-400 text-sm">
                    Войдите в аккаунт для получения реферального кода
                  </p>
                  <Link
                    href="/login"
                    className="inline-block mt-3 text-[#00ff9d] font-semibold hover:underline"
                  >
                    Войти →
                  </Link>
                </div>
              )}

              {/* Отзыв */}
              <div className="border-t border-gray-800 pt-6">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-white mb-1">Понравилась покупка?</h4>
                  <p className="text-gray-400 text-sm">Оставьте отзыв и помогите другим</p>
                </div>

                {/* Звёзды */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-3xl transition-all ${
                        star <= reviewRating ? 'text-yellow-400 scale-110' : 'text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {/* Текст отзыва */}
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Напишите ваш отзыв..."
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#00ff9d] text-sm mb-3"
                />

                <button
                  onClick={submitReview}
                  disabled={submittingReview || !reviewText.trim()}
                  className="w-full bg-gray-800 border border-gray-700 text-[#e0e0e0] font-semibold py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
                >
                  {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
                </button>
              </div>

              {/* Закрыть */}
              <button
                onClick={() => setShowReferralModal(false)}
                className="w-full mt-4 text-gray-500 hover:text-white text-sm py-2"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
