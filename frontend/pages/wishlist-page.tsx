import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface Product {
  id: number
  name: string
  category_name: string
  price_android: number | string
  price_pc: number | string
  price_ios: number | string
  image_url?: string
  stock_quantity: number
  rating_avg?: number
  reviews_count?: number
  added_at?: string
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')

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
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setWishlist(response.data)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.delete(`${API_URL}/wishlist/remove/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setWishlist(wishlist.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const addToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      await axios.post(`${API_URL}/cart/add`,
        { product_id: productId, quantity: 1, platform: userPlatform },
        { headers: { 'Authorization': `Bearer ${token}` }}
      )
      alert('Товар добавлен в корзину')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Ошибка при добавлении в корзину')
    }
  }

  const getPriceForPlatform = (product: Product, platform: string): number => {
    const price = product[`price_${platform}` as keyof Product]
    return typeof price === 'number' ? price : parseFloat(price as string) || 0
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2)
  }

  const renderStars = (rating?: number) => {
    if (!rating) return '☆☆☆☆☆'
    const fullStars = Math.floor(rating)
    return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
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
            <Link href="/wishlist-page" className="text-purple-400 font-semibold">❤️ Избранное</Link>
            <Link href="/login" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold">Войти</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">❤️ Избранное</h1>
            <p className="text-gray-400">
              {wishlist.length} {wishlist.length === 1 ? 'товар' : wishlist.length < 5 ? 'товара' : 'товаров'}
            </p>
          </div>
          <Link
            href="/catalog"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold"
          >
            Продолжить покупки
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-2xl font-bold mb-4">Список желаемого пуст</h2>
            <p className="text-gray-400 mb-8">Добавьте товары, которые вам понравились</p>
            <Link
              href="/catalog"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-semibold inline-block"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => {
              const price = getPriceForPlatform(product, userPlatform)

              return (
                <div
                  key={product.id}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700 hover:border-purple-500 transition-all"
                >
                  <div className="relative mb-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg flex items-center justify-center text-5xl">
                        🎮
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-white mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">{renderStars(parseFloat(String(product.rating_avg || 0)))}</span>
                    <span className="text-xs text-gray-400">({product.reviews_count || 0})</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {formatPrice(price)}₽
                    </span>
                    <span className="text-xs text-gray-400">
                      {product.stock_quantity > 0 ? `✓` : '✗'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(product.id)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-lg text-sm"
                    >
                      В корзину
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="px-3 py-2 bg-gray-700 hover:bg-red-600 rounded-lg"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>

                  <Link
                    href={`/product/${product.id}`}
                    className="block mt-2 text-center text-sm text-purple-400 hover:text-purple-300"
                  >
                    Подробнее →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
