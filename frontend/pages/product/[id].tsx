import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface Product {
  id: number
  name: string
  category_id: number
  category_name: string
  price_android: number | string
  price_pc: number | string
  price_ios: number | string
  image_url?: string
  stock_quantity: number
  sales_count: number
  rating_avg?: number
  reviews_count?: number
  is_active: boolean
  description?: string
  delivery_type?: 'auto' | 'manual'
}

interface Review {
  id: number
  user_name: string
  rating: number
  comment: string
  created_at: string
  is_verified_purchase: boolean
}

// A/B тест варианты
const AB_VARIANTS = {
  ctaText: {
    A: 'КУПИТЬ СЕЙЧАС',
    B: 'ПОЛУЧИТЬ КОД',
  },
  ctaColor: {
    A: 'from-[#00ff9d] to-[#00cc7d]', // зелёный акцент
    B: 'from-purple-600 to-pink-600', // фиолетовый градиент
  },
  urgencyText: {
    A: 'Осталось: {count} шт.',
    B: 'Заказов за час: {count}',
  },
} as const

type ABVariant = 'A' | 'B'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [abVariant, setAbVariant] = useState<{ ctaText: ABVariant; ctaColor: ABVariant }>({
    ctaText: 'A',
    ctaColor: 'A',
  })

  // Определяем вариант A/B теста
  useEffect(() => {
    const savedVariant = localStorage.getItem('ab_variant_product')
    if (savedVariant) {
      setAbVariant(JSON.parse(savedVariant) as { ctaText: ABVariant; ctaColor: ABVariant })
    } else {
      const newVariant: { ctaText: ABVariant; ctaColor: ABVariant } = {
        ctaText: Math.random() > 0.5 ? 'A' : 'B',
        ctaColor: Math.random() > 0.5 ? 'A' : 'B',
      }
      localStorage.setItem('ab_variant_product', JSON.stringify(newVariant))
      setAbVariant(newVariant)
    }
  }, [])

  useEffect(() => {
    const savedPlatform = localStorage.getItem('user_platform') as 'android' | 'pc' | 'ios' | null
    if (savedPlatform) {
      setUserPlatform(savedPlatform)
    } else {
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('android')) {
        setUserPlatform('android')
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        setUserPlatform('ios')
      } else {
        setUserPlatform('pc')
      }
    }
  }, [])

  useEffect(() => {
    if (id) {
      loadProduct()
      loadReviews()
      checkFavorite()
    }
  }, [id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/products/${id}`)
      setProduct(response.data)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}/reviews`, { params: { limit: 5 } })
      setReviews(response.data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const checkFavorite = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await axios.get(`${API_URL}/wishlist/check/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsFavorite(response.data.is_favorite)
    } catch (error) {
      console.error('Error checking favorite:', error)
    }
  }

  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/login')
        return
      }

      if (isFavorite) {
        await axios.delete(`${API_URL}/wishlist/remove/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFavorite(false)
      } else {
        await axios.post(`${API_URL}/wishlist/add`, { product_id: Number(id) }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const getPriceForPlatform = (p: Product): number => {
    const price = p[`price_${userPlatform}` as keyof Product]
    return typeof price === 'number' ? price : parseFloat(price as string) || 0
  }

  const formatPrice = (price: number) => price.toFixed(2)

  const renderStars = (rating?: number) => {
    if (!rating) return '☆☆☆☆☆'
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))
  }

  const handleBuyNow = () => {
    if (!product) return
    localStorage.setItem('checkout_product', JSON.stringify({
      id: product.id,
      name: product.name,
      price: getPriceForPlatform(product),
      quantity,
      platform: userPlatform,
    }))
    router.push('/checkout')
  }

  const handleAddToCart = () => {
    if (!product) return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Проверяем есть ли уже такой товар (по id и platform)
    const existingIndex = cart.findIndex((item: any) => 
      item.id === product.id && item.platform === userPlatform
    )
    
    if (existingIndex !== -1) {
      // Товар уже есть - увеличиваем quantity
      cart[existingIndex].quantity += quantity
    } else {
      // Добавляем новый товар
      cart.push({
        id: product.id,
        name: product.name,
        price: getPriceForPlatform(product),
        quantity,
        platform: userPlatform,
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    router.push('/cart')
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

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-[#e0e0e0] font-mono text-xl">Товар не найден</p>
          <Link href="/catalog" className="mt-4 inline-block text-[#00ff9d] font-mono underline">
            ← Вернуться в каталог
          </Link>
        </div>
      </div>
    )
  }

  const price = getPriceForPlatform(product)
  const totalPrice = price * quantity
  const ctaText = AB_VARIANTS.ctaText[abVariant.ctaText]
  const ctaColorClass = AB_VARIANTS.ctaColor[abVariant.ctaColor]
  const urgencyText = AB_VARIANTS.urgencyText[abVariant.ctaText === 'A' ? 'A' : 'B']
    .replace('{count}', String(product.stock_quantity || Math.floor(Math.random() * 20) + 1))

  const deliveryInfo = product.delivery_type === 'auto'
    ? { icon: '⚡', text: 'Автовыдача < 60 сек', color: 'text-[#00ff9d]' }
    : { icon: '👤', text: 'Ручная выдача ~ 5 мин', color: 'text-yellow-400' }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono">
      {/* Навигация */}
      <nav className="bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#00ff9d]">
            NeymaryShop
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/catalog" className="text-gray-400 hover:text-[#e0e0e0]">Каталог</Link>
            <Link href="/cart" className="text-gray-400 hover:text-[#e0e0e0]">🛒</Link>
            <Link href="/wishlist-page" className="text-gray-400 hover:text-[#e0e0e0]">❤️</Link>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/catalog" className="text-gray-500 hover:text-[#e0e0e0] text-sm mb-4 inline-block">
          ← Назад в каталог
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Левая колонка - Изображение */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-80 object-cover"
                />
              ) : (
                <div className="w-full h-80 bg-gray-800 flex items-center justify-center text-6xl">
                  🎮
                </div>
              )}
            </div>

            {/* Доверие */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-900 rounded border border-gray-800 p-3 text-center">
                <div className="text-[#00ff9d] text-xl mb-1">🔒</div>
                <div className="text-gray-400">TON защита</div>
              </div>
              <div className="bg-gray-900 rounded border border-gray-800 p-3 text-center">
                <div className="text-[#00ff9d] text-xl mb-1">⚡</div>
                <div className="text-gray-400">Мгновенно</div>
              </div>
              <div className="bg-gray-900 rounded border border-gray-800 p-3 text-center">
                <div className="text-[#00ff9d] text-xl mb-1">🎧</div>
                <div className="text-gray-400">24/7 поддержка</div>
              </div>
            </div>
          </div>

          {/* Правая колонка - Информация и покупка */}
          <div className="space-y-6">
            {/* Заголовок и рейтинг */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400">{renderStars(parseFloat(String(product.rating_avg || 0)))}</span>
                <span className="text-gray-500 text-sm">({product.reviews_count || 0} отзывов)</span>
                {product.sales_count > 0 && (
                  <span className="text-gray-500 text-sm">• {product.sales_count} продано</span>
                )}
              </div>
              <div className={`text-sm ${deliveryInfo.color} flex items-center gap-1`}>
                <span>{deliveryInfo.icon}</span>
                <span>{deliveryInfo.text}</span>
              </div>
            </div>

            {/* Цена и наличие */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-[#00ff9d]">{formatPrice(price)}₽</span>
                <span className="text-gray-500 text-sm">для {userPlatform.toUpperCase()}</span>
              </div>

              {/* Срочность */}
              {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                <div className="text-red-400 text-sm mb-2 flex items-center gap-1">
                  <span>🔥</span>
                  <span>{urgencyText}</span>
                </div>
              )}

              {/* Статус наличия */}
              <div className={`text-sm mb-4 ${product.stock_quantity > 0 ? 'text-[#00ff9d]' : 'text-red-400'}`}>
                {product.stock_quantity > 0 ? '✓ В наличии' : '✗ Нет в наличии'}
              </div>

              {/* Выбор платформы */}
              <div className="mb-4">
                <label className="text-gray-500 text-sm block mb-2">Платформа:</label>
                <div className="flex gap-2">
                  {(['android', 'pc', 'ios'] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setUserPlatform(platform)}
                      className={`px-4 py-2 rounded border font-semibold text-sm transition-all ${
                        userPlatform === platform
                          ? 'border-[#00ff9d] bg-[#00ff9d]/10 text-[#00ff9d]'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {platform.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Количество */}
              <div className="mb-6">
                <label className="text-gray-500 text-sm block mb-2">Количество:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-800 border border-gray-700 rounded text-xl hover:bg-gray-700"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                    className="w-10 h-10 bg-gray-800 border border-gray-700 rounded text-xl hover:bg-gray-700"
                  >
                    +
                  </button>
                  {quantity > 1 && (
                    <span className="text-gray-500 text-sm ml-2">
                      = {formatPrice(totalPrice)}₽ за всё
                    </span>
                  )}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0}
                  className={`w-full ${ctaColorClass} text-black font-bold py-4 rounded-lg text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {ctaText}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                    className="bg-gray-800 border border-gray-700 text-[#e0e0e0] font-semibold py-3 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
                  >
                    В корзину
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`border font-semibold py-3 rounded-lg transition-all ${
                      isFavorite
                        ? 'border-red-500 text-red-500 bg-red-500/10'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {isFavorite ? '❤️ В избранном' : '🤍 В избранное'}
                  </button>
                </div>
              </div>
            </div>

            {/* Описание */}
            {product.description && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <h3 className="font-bold text-white mb-2">Описание</h3>
                <p className="text-gray-400 text-sm whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Краткие отзывы */}
            {reviews.length > 0 && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">Отзывы</h3>
                  <button
                    onClick={() => setShowReviews(true)}
                    className="text-[#00ff9d] text-sm hover:underline"
                  >
                    Все {product.reviews_count} →
                  </button>
                </div>
                <div className="space-y-3">
                  {reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="border-b border-gray-800 pb-3 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</span>
                        {review.is_verified_purchase && (
                          <span className="text-[#00ff9d] text-xs">✓ Проверенная покупка</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Мобильная липкая кнопка */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-gray-800 p-4 md:hidden z-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-[#00ff9d]">{formatPrice(price)}₽</div>
            <div className="text-xs text-gray-500">{deliveryInfo.text}</div>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={product.stock_quantity === 0}
            className={`flex-1 max-w-[200px] ${ctaColorClass} text-black font-bold py-3 rounded-lg disabled:opacity-50`}
          >
            {ctaText}
          </button>
        </div>
      </div>

      {/* Модальное окно отзывов */}
      {showReviews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-gray-800 p-4 flex items-center justify-between">
              <h3 className="font-bold text-xl text-white">Отзывы ({product.reviews_count})</h3>
              <button
                onClick={() => setShowReviews(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-800 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">{'★'.repeat(review.rating)}</span>
                    <span className="text-gray-500 text-sm">{review.user_name}</span>
                    {review.is_verified_purchase && (
                      <span className="text-[#00ff9d] text-xs">✓ Проверенная покупка</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{review.comment}</p>
                  <span className="text-gray-600 text-xs mt-2 block">
                    {new Date(review.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Отступ для мобильной кнопки */}
      <div className="h-20 md:hidden"></div>
    </div>
  )
}
