import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface Product {
  id: number
  name: string
  description?: string
  category_name: string
  price_android: number | string
  price_pc: number | string
  price_ios: number | string
  image_url?: string
  stock_quantity: number
  sales_count: number
  rating_avg?: number
  reviews_count?: number
  specifications?: any
}

export default function ComparePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')

  useEffect(() => {
    const savedPlatform = localStorage.getItem('user_platform') as 'android' | 'pc' | 'ios' | null
    if (savedPlatform) {
      setUserPlatform(savedPlatform)
    } else {
      setUserPlatform('pc')
    }
  }, [])

  useEffect(() => {
    if (router.query.ids) {
      loadProducts()
    }
  }, [router.query.ids])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const ids = Array.isArray(router.query.ids) 
        ? router.query.ids.join(',') 
        : router.query.ids

      const response = await axios.get(`${API_URL}/compare`, {
        params: { product_ids: ids }
      })
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading products for comparison:', error)
    } finally {
      setLoading(false)
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

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NeymaryShop
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold mb-4">Нет товаров для сравнения</h1>
          <Link href="/catalog" className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold inline-block">
            Перейти в каталог
          </Link>
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
            <Link href="/login" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold">Войти</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Сравнение товаров</h1>
          <Link
            href="/catalog"
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            ← Вернуться в каталог
          </Link>
        </div>

        {/* Таблица сравнения */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-gray-800 border border-gray-700 p-4 text-left w-48 sticky left-0 z-10">
                  Характеристика
                </th>
                {products.map((product) => (
                  <th key={product.id} className="bg-gray-800 border border-gray-700 p-4 min-w-[250px]">
                    <div className="text-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-32 h-32 object-cover rounded-lg mb-4 mx-auto"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg flex items-center justify-center text-5xl mx-auto mb-4">
                          🎮
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                        {formatPrice(getPriceForPlatform(product, userPlatform))}₽
                      </div>
                      <div className="flex gap-2 justify-center mb-4">
                        <Link
                          href={`/product/${product.id}`}
                          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          Подробнее
                        </Link>
                        <Link
                          href={`/cart?add=${product.id}`}
                          className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          Купить
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Рейтинг */}
              <tr>
                <td className="bg-gray-800/50 border border-gray-700 p-4 font-semibold sticky left-0 z-10">
                  ⭐ Рейтинг
                </td>
                {products.map((product) => (
                  <td key={product.id} className="bg-gray-800/30 border border-gray-700 p-4 text-center">
                    <div className="text-yellow-400 text-lg">{renderStars(parseFloat(String(product.rating_avg || 0)))}</div>
                    <div className="text-sm text-gray-400">{product.reviews_count || 0} отзывов</div>
                  </td>
                ))}
              </tr>

              {/* Категория */}
              <tr>
                <td className="bg-gray-800/50 border border-gray-700 p-4 font-semibold sticky left-0 z-10">
                  📁 Категория
                </td>
                {products.map((product) => (
                  <td key={product.id} className="bg-gray-800/30 border border-gray-700 p-4 text-center">
                    {product.category_name}
                  </td>
                ))}
              </tr>

              {/* Наличие */}
              <tr>
                <td className="bg-gray-800/50 border border-gray-700 p-4 font-semibold sticky left-0 z-10">
                  📦 Наличие
                </td>
                {products.map((product) => (
                  <td key={product.id} className="bg-gray-800/30 border border-gray-700 p-4 text-center">
                    {product.stock_quantity > 0 ? (
                      <span className="text-green-400">В наличии: {product.stock_quantity} шт.</span>
                    ) : (
                      <span className="text-gray-400">Под заказ</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Продажи */}
              <tr>
                <td className="bg-gray-800/50 border border-gray-700 p-4 font-semibold sticky left-0 z-10">
                  🔥 Продано
                </td>
                {products.map((product) => (
                  <td key={product.id} className="bg-gray-800/30 border border-gray-700 p-4 text-center">
                    {product.sales_count > 0 ? `${product.sales_count} шт.` : '—'}
                  </td>
                ))}
              </tr>

              {/* Описание */}
              <tr>
                <td className="bg-gray-800/50 border border-gray-700 p-4 font-semibold sticky left-0 z-10">
                  📝 Описание
                </td>
                {products.map((product) => (
                  <td key={product.id} className="bg-gray-800/30 border border-gray-700 p-4">
                    <p className="text-gray-300 text-sm">
                      {product.description || 'Описание отсутствует'}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Характеристики (если есть) */}
              {products.some(p => p.specifications && Object.keys(p.specifications).length > 0) && (
                <>
                  <tr>
                    <td className="bg-gray-800/50 border border-gray-700 p-4 font-semibold sticky left-0 z-10">
                      ⚙️ Характеристики
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="bg-gray-800/30 border border-gray-700 p-4">
                        {product.specifications ? (
                          <div className="text-sm">
                            {Object.entries(product.specifications).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between py-1 border-b border-gray-700 last:border-0">
                                <span className="text-gray-400">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Кнопки действий */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/catalog"
            className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-semibold"
          >
            Продолжить покупки
          </Link>
        </div>
      </div>
    </div>
  )
}
