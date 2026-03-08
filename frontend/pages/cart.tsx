import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import { TrustBadges } from '../components/TrustBadges'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  platform: 'android' | 'pc' | 'ios'
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [tgUsername, setTgUsername] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('ton')
  const [processing, setProcessing] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    loadCart()
    
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.email) setEmail(user.email)
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = localStorage.getItem('cart')
        const items = cart ? JSON.parse(cart) : []
        setCartCount(Array.isArray(items) ? items.length : 0)
      } catch {
        setCartCount(0)
      }
    }
    updateCartCount()
    const interval = setInterval(updateCartCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadCart = () => {
    try {
      const cart = localStorage.getItem('cart')
      if (cart) {
        setCartItems(JSON.parse(cart))
      }
    } catch (e) {
      console.error('Error loading cart:', e)
    }
  }

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...cartItems]
    newItems[index].quantity = newItems[index].quantity + delta
    
    // Автоудаление если quantity < 1
    if (newItems[index].quantity < 1) {
      newItems.splice(index, 1)
    }
    
    setCartItems(newItems)
    localStorage.setItem('cart', JSON.stringify(newItems))
  }

  const increment = (index: number) => {
    updateQuantity(index, 1)
  }

  const decrement = (index: number) => {
    updateQuantity(index, -1)
  }

  const removeItem = (index: number) => {
    const newItems = cartItems.filter((_, i) => i !== index)
    setCartItems(newItems)
    localStorage.setItem('cart', JSON.stringify(newItems))
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      
      const response = await axios.post(`${API_URL}/coupons/validate`, {
        code: couponCode,
        order_amount: total,
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
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0 || !email) return

    if (!legalAccepted) {
      alert('Необходимо принять Пользовательское соглашение и Политику конфиденциальности')
      return
    }

    setProcessing(true)

    try {
      const token = localStorage.getItem('auth_token')
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - couponDiscount

      const firstItem = cartItems[0]
      const orderData = {
        product_id: firstItem.id,
        quantity: firstItem.quantity,
        platform: firstItem.platform,
        email,
        tg_username: tgUsername || null,
        payment_method: selectedPayment,
        coupon_code: couponCode || null,
        total_amount: total,
      }

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      localStorage.setItem('order_success', JSON.stringify({
        orderId: response.data.order?.id || Date.now(),
        productName: firstItem.name,
        totalAmount: total,
        referralCode: response.data.referral_code || null,
      }))

      localStorage.removeItem('cart')
      router.push('/checkout/success')
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.response?.data?.error || 'Ошибка при оформлении заказа')
    } finally {
      setProcessing(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal - couponDiscount

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
        <Header showCart={true} cartCount={0} />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-white mb-4">Корзина пуста</h1>
            <p className="text-gray-500 mb-6">Добавьте товары для оформления заказа</p>
            <Link
              href="/catalog"
              className="inline-block bg-[#00ff9d] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#00cc7d]"
            >
              Перейти в каталог →
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      <Header showCart={true} cartCount={cartCount} />

      {/* Progress */}
      <div className="bg-[#111] border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#00ff9d]' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-[#00ff9d] text-black' : 'bg-gray-800'
              }`}>1</div>
              <span className="hidden sm:inline">Корзина</span>
            </div>
            <div className={`flex-1 h-1 max-w-[100px] ${step >= 2 ? 'bg-[#00ff9d]' : 'bg-gray-800'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#00ff9d]' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-[#00ff9d] text-black' : 'bg-gray-800'
              }`}>2</div>
              <span className="hidden sm:inline">Оплата</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {step === 1 ? (
          /* Шаг 1: Корзина */
          <div className="space-y-6">
            <Link href="/catalog" className="text-gray-500 hover:text-[#e0e0e0] text-sm">
              ← Продолжить покупки
            </Link>

            <h1 className="text-2xl font-bold text-white">Корзина</h1>

            {/* Товары */}
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="bg-[#111] rounded-lg border border-gray-800 p-4 flex gap-4">
                  <div className="w-20 h-20 bg-[#1a1a1a] rounded flex items-center justify-center text-2xl flex-shrink-0">
                    📦
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                    <div className="text-gray-500 text-sm mb-2">
                      Платформа: <span className="text-[#e0e0e0]">{item.platform.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrement(index)}
                          className="w-8 h-8 bg-gray-800 rounded hover:bg-gray-700"
                        >
                          −
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => increment(index)}
                          className="w-8 h-8 bg-gray-800 rounded hover:bg-gray-700"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-[#00ff9d]">
                      {(item.price * item.quantity).toFixed(2)}₽
                    </div>
                    <div className="text-gray-500 text-sm">
                      {item.price.toFixed(2)}₽/шт
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Итого */}
            <div className="bg-[#111] rounded-lg border border-gray-800 p-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Подытог</span>
                <span className="text-white">{subtotal.toFixed(2)}₽</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between mb-2 text-red-400">
                  <span>Скидка</span>
                  <span>−{couponDiscount.toFixed(2)}₽</span>
                </div>
              )}
              <div className="border-t border-gray-800 mt-4 pt-4 flex justify-between font-bold text-lg">
                <span className="text-white">Итого</span>
                <span className="text-[#00ff9d]">{total.toFixed(2)}₽</span>
              </div>
            </div>

            {/* Купон */}
            <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
              <label className="text-gray-500 text-sm block mb-2">Промокод</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="PROMO"
                  className="flex-1 bg-[#0a0a0a] border border-gray-800 rounded px-4 py-2 focus:outline-none focus:border-[#00ff9d]"
                />
                <button
                  onClick={validateCoupon}
                  className="bg-gray-800 border border-gray-700 px-4 py-2 rounded hover:bg-gray-700"
                >
                  Применить
                </button>
              </div>
              {couponError && <p className="text-red-400 text-sm mt-2">{couponError}</p>}
              {couponDiscount > 0 && (
                <p className="text-[#00ff9d] text-sm mt-2">✓ Скидка применена</p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#00ff9d] text-black font-bold py-4 rounded-lg text-lg hover:bg-[#00cc7d]"
            >
              ОФОРМИТЬ ЗАКАЗ
            </button>

            <TrustBadges />
          </div>
        ) : (
          /* Шаг 2: Оплата */
          <div className="space-y-6">
            <button
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-[#e0e0e0] text-sm"
            >
              ← Назад
            </button>

            <h1 className="text-2xl font-bold text-white">Оформление заказа</h1>

            <div className="bg-[#111] rounded-lg border border-gray-800 p-6">
              <h2 className="font-bold text-white mb-4">Контактные данные</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-sm block mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#00ff9d]"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-sm block mb-2">
                    Telegram (необязательно)
                  </label>
                  <input
                    type="text"
                    value={tgUsername}
                    onChange={(e) => setTgUsername(e.target.value.replace('@', ''))}
                    placeholder="@username"
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#00ff9d]"
                  />
                  <p className="text-gray-600 text-xs mt-1">Для уведомлений</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] rounded-lg border border-gray-800 p-6">
              <h2 className="font-bold text-white mb-4">Способ оплаты</h2>
              <div className="space-y-2">
                {[
                  { id: 'ton', icon: '💎', name: 'TON Crypto' },
                  { id: 'card', icon: '💳', name: 'Банковская карта' },
                  { id: 'sbp', icon: '📱', name: 'СБП' },
                ].map((method) => (
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
            </div>

            {/* Итого */}
            <div className="bg-[#111] rounded-lg border border-gray-800 p-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Товары</span>
                <span className="text-white">{subtotal.toFixed(2)}₽</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between mb-2 text-red-400">
                  <span>Скидка</span>
                  <span>−{couponDiscount.toFixed(2)}₽</span>
                </div>
              )}
              <div className="border-t border-gray-800 mt-4 pt-4 flex justify-between font-bold text-xl">
                <span className="text-white">К оплате</span>
                <span className="text-[#00ff9d]">{total.toFixed(2)}₽</span>
              </div>
            </div>

            {/* Legal checkbox */}
            <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#00ff9d]"
                />
                <span className="text-gray-400 text-sm">
                  Я соглашаюсь с{' '}
                  <Link href="/legal/terms" target="_blank" className="text-[#00ff9d] hover:underline">
                    Пользовательским соглашением
                  </Link>{' '}
                  и{' '}
                  <Link href="/legal/privacy" target="_blank" className="text-[#00ff9d] hover:underline">
                    Политикой конфиденциальности
                  </Link>
                  . Владелец: ИП Ионцев К.К. (сделка между физ. лицами)
                </span>
              </label>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing || !email || !legalAccepted}
              className="w-full bg-[#00ff9d] text-black font-bold py-4 rounded-lg text-lg hover:bg-[#00cc7d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Обработка...' : `Оплатить ${total.toFixed(2)}₽`}
            </button>

            <p className="text-center text-gray-500 text-xs">
              🔒 Гарантия возврата средств в течение 14 дней
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
