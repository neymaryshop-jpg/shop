import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface CheckoutProduct {
  id: number
  name: string
  price: number
  quantity: number
  platform: 'android' | 'pc' | 'ios'
}

interface PaymentMethod {
  id: string
  name: string
  icon: string
  enabled: boolean
}

// A/B тест вариантов кнопки оплаты
const AB_VARIANTS = {
  payButton: {
    A: { text: 'ОПЛАТИТЬ СЕЙЧАС', color: 'from-[#00ff9d] to-[#00cc7d]' },
    B: { text: 'БЕЗОПАСНАЯ ОПЛАТА', color: 'from-purple-600 to-pink-600' },
  },
} as const

type ABVariant = 'A' | 'B'

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [product, setProduct] = useState<CheckoutProduct | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [email, setEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState<number>(0)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [abVariant, setAbVariant] = useState<ABVariant>('A')
  const [tgUsername, setTgUsername] = useState('')

  // Загрузка данных
  useEffect(() => {
    const savedProduct = localStorage.getItem('checkout_product')
    if (!savedProduct) {
      router.push('/catalog')
      return
    }
    setProduct(JSON.parse(savedProduct))
    loadPaymentMethods()

    // A/B тест
    const savedVariant = localStorage.getItem('ab_variant_checkout') as ABVariant | null
    if (savedVariant) {
      setAbVariant(savedVariant)
    } else {
      const newVariant = Math.random() > 0.5 ? 'A' : 'B'
      localStorage.setItem('ab_variant_checkout', newVariant)
      setAbVariant(newVariant)
    }

    // Автозаполнение email из профиля
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.email) setEmail(user.email)
      } catch (e) {}
    }
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment-methods`)
      setPaymentMethods(response.data.filter((m: PaymentMethod) => m.enabled))
      if (response.data.length > 0) {
        setSelectedPayment(response.data[0].id)
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      // Fallback методы (только карта и СБП)
      setPaymentMethods([
        { id: 'ru-card', name: 'Банковская карта', icon: '💳', enabled: true },
        { id: 'sbp', name: 'СБП', icon: '📱', enabled: true },
      ])
      setSelectedPayment('ru-card')
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return

    setApplyingCoupon(true)
    setCouponError('')

    try {
      const token = localStorage.getItem('auth_token')
      const response = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponCode,
        order_amount: product?.price || 0,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (response.data.valid) {
        setCouponDiscount(response.data.coupon.discount_amount)
      } else {
        setCouponError(response.data.error || 'Неверный купон')
        setCouponDiscount(0)
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.error || 'Ошибка проверки купона')
      setCouponDiscount(0)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleCheckout = async () => {
    if (!product || !email || !selectedPayment) return

    setProcessing(true)

    try {
      const token = localStorage.getItem('auth_token')
      const orderData = {
        product_id: product.id,
        quantity: product.quantity,
        platform: product.platform,
        email,
        tg_username: tgUsername || null,
        payment_method: selectedPayment,
        coupon_code: couponCode || null,
        total_amount: product.price * product.quantity - couponDiscount,
      }

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      // Сохраняем данные заказа с реквизитами для оплаты
      const paymentDetails = getPaymentDetails(selectedPayment, orderData.total_amount)
      localStorage.setItem('order_success', JSON.stringify({
        orderId: response.data.order?.id || Date.now(),
        productName: product.name,
        totalAmount: orderData.total_amount,
        referralCode: response.data.referral_code || null,
        paymentDetails,
        email,
      }))

      localStorage.removeItem('checkout_product')
      localStorage.removeItem('cart')
      router.push('/checkout/success')
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.response?.data?.error || 'Ошибка при оформлении заказа')
    } finally {
      setProcessing(false)
    }
  }

  const getPaymentDetails = (method: string, amount: number) => {
    switch (method) {
      case 'ru-card':
        return {
          method: 'Card (RF)',
          card: '2200 7012 3242 4173',
          holder: 'Константин И.',
          bank: 'Т-Банк',
          amount: amount,
        }
      case 'sbp':
        return {
          method: 'SBP (Fast Payment System)',
          phone: '+7 (931) 104-38-39',
          bank: 'Т-Банк',
          amount: amount,
        }
      default:
        return { method: 'Unknown', amount }
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-[#e0e0e0] font-mono">Загрузка...</p>
        </div>
      </div>
    )
  }

  const subtotal = product.price * product.quantity
  const total = subtotal - couponDiscount
  const payButton = AB_VARIANTS.payButton[abVariant]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono">
      {/* Прогресс */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#00ff9d]' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-[#00ff9d] text-black' : 'bg-gray-800'
              }`}>
                1
              </div>
              <span className="hidden sm:inline">Оплата</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-[#00ff9d]' : 'bg-gray-800'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#00ff9d]' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-[#00ff9d] text-black' : 'bg-gray-800'
              }`}>
                2
              </div>
              <span className="hidden sm:inline">Подтверждение</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Шаг 1: Оплата */}
        {step === 1 && (
          <div className="space-y-6">
            <Link href="/catalog" className="text-gray-500 hover:text-[#e0e0e0] text-sm">
              ← Вернуться к покупкам
            </Link>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Товар */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="font-bold text-white mb-4">Товар</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{product.name}</span>
                    <span className="text-[#00ff9d]">{product.price.toFixed(2)}₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Платформа</span>
                    <span className="text-gray-400">{product.platform.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Количество</span>
                    <span className="text-gray-400">{product.quantity}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Скидка</span>
                      <span className="text-red-400">−{couponDiscount.toFixed(2)}₽</span>
                    </div>
                  )}
                  <div className="border-t border-gray-800 pt-3 flex justify-between font-bold">
                    <span className="text-white">Итого</span>
                    <span className="text-[#00ff9d] text-xl">{total.toFixed(2)}₽</span>
                  </div>
                </div>
              </div>

              {/* Форма оплаты */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="font-bold text-white mb-4">Способ оплаты</h2>
                <div className="space-y-2 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`w-full p-4 rounded-lg border text-left flex items-center gap-3 transition-all ${
                        selectedPayment === method.id
                          ? 'border-[#00ff9d] bg-[#00ff9d]/10'
                          : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-semibold">{method.name}</span>
                      {selectedPayment === method.id && (
                        <span className="ml-auto text-[#00ff9d]">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Купон */}
                <div className="mb-4">
                  <label className="text-gray-500 text-sm block mb-2">Промокод (необязательно)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="PROMO"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#00ff9d]"
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="bg-gray-800 border border-gray-700 px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      {applyingCoupon ? '...' : 'Применить'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-400 text-sm mt-1">{couponError}</p>}
                  {couponDiscount > 0 && (
                    <p className="text-[#00ff9d] text-sm mt-1">✓ Скидка {couponDiscount.toFixed(2)}₽ применена</p>
                  )}
                </div>
              </div>
            </div>

            {/* Контактные данные */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="font-bold text-white mb-4">Контактные данные</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-gray-500 text-sm block mb-2">
                    Email для получения товара <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-[#00ff9d]"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-sm block mb-2">
                    Telegram username (необязательно)
                  </label>
                  <input
                    type="text"
                    value={tgUsername}
                    onChange={(e) => setTgUsername(e.target.value.replace('@', ''))}
                    placeholder="@username"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-[#00ff9d]"
                  />
                  <p className="text-gray-600 text-xs mt-1">Для уведомлений и поддержки</p>
                </div>
              </div>
            </div>

            {/* Кнопка продолжения */}
            <button
              onClick={() => setStep(2)}
              disabled={!email || processing}
              className={`w-full max-w-md mx-auto block ${payButton.color} text-black font-bold py-4 rounded-lg text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {payButton.text}
            </button>

            {/* Доверие */}
            <div className="text-center text-gray-500 text-sm space-y-2">
              <div className="flex items-center justify-center gap-4">
                <span>🔒 TON защищённая оплата</span>
                <span>⚡ Мгновенная доставка</span>
                <span>🎧 Поддержка 24/7</span>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 2: Подтверждение */}
        {step === 2 && (
          <div className="space-y-6">
            <button
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-[#e0e0e0] text-sm"
            >
              ← Назад
            </button>

            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-2xl mx-auto">
              <h2 className="font-bold text-white text-xl mb-6 text-center">Подтверждение заказа</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Товар</span>
                  <span className="text-white">{product.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Платформа</span>
                  <span className="text-white">{product.platform.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Количество</span>
                  <span className="text-white">{product.quantity}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white">{email}</span>
                </div>
                {tgUsername && (
                  <div className="flex justify-between border-b border-gray-800 pb-3">
                    <span className="text-gray-400">Telegram</span>
                    <span className="text-white">@{tgUsername}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-800 pb-3">
                  <span className="text-gray-400">Способ оплаты</span>
                  <span className="text-white">
                    {paymentMethods.find(m => m.id === selectedPayment)?.name || selectedPayment}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between border-b border-gray-800 pb-3">
                    <span className="text-gray-400">Купон</span>
                    <span className="text-red-400">−{couponDiscount.toFixed(2)}₽ ({couponCode})</span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-white text-lg">К оплате</span>
                  <span className="font-bold text-[#00ff9d] text-2xl">{total.toFixed(2)}₽</span>
                </div>
              </div>

              {/* Чекбокс согласия */}
              <label className="flex items-start gap-3 text-sm text-gray-400 mb-6 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4" />
                <span>
                  Я согласен с <a href="#" className="text-[#00ff9d] underline">условиями оферты</a>
                  и подтверждаю, что мне исполнилось 18 лет
                </span>
              </label>

              {/* Кнопка оплаты */}
              <button
                onClick={handleCheckout}
                disabled={processing}
                className={`w-full ${payButton.color} text-black font-bold py-4 rounded-lg text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing ? 'Обработка...' : `Оплатить ${total.toFixed(2)}₽`}
              </button>

              {/* Гарантия возврата */}
              <p className="text-center text-gray-500 text-xs mt-4">
                🔒 Гарантия возврата средств в течение 14 дней
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Отступ для мобильных */}
      <div className="h-20 md:hidden"></div>
    </div>
  )
}
