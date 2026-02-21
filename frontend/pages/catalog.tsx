import { useState, useEffect } from 'react'
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
  created_at?: string
}

interface Category {
  id: number
  name: string
  slug: string
  icon_url?: string
  is_active: boolean
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [comparison, setComparison] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

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
    loadCategories()
    loadWishlist()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, searchQuery, sortBy, priceRange])

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const response = await axios.get(`${API_URL}/products`, { params })
      let filteredProducts = response.data

      // Фильтрация по цене
      filteredProducts = filteredProducts.filter((p: Product) => {
        const price = getPriceForPlatform(p, userPlatform)
        return price >= priceRange[0] && price <= priceRange[1]
      })

      // Сортировка
      if (sortBy === 'price_asc') {
        filteredProducts.sort((a: Product, b: Product) => 
          getPriceForPlatform(a, userPlatform) - getPriceForPlatform(b, userPlatform)
        )
      } else if (sortBy === 'price_desc') {
        filteredProducts.sort((a: Product, b: Product) => 
          getPriceForPlatform(b, userPlatform) - getPriceForPlatform(a, userPlatform)
        )
      } else if (sortBy === 'rating') {
        filteredProducts.sort((a: Product, b: Product) => 
          (parseFloat(String(b.rating_avg || 0)) - parseFloat(String(a.rating_avg || 0)))
        )
      } else if (sortBy === 'newest') {
        filteredProducts.sort((a: Product, b: Product) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
      }

      setProducts(filteredProducts)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWishlist = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await axios.get(`${API_URL}/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const wishlistIds = new Set<number>(response.data.map((item: any) => item.id))
      setWishlist(wishlistIds)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    }
  }

  const toggleWishlist = async (productId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      if (wishlist.has(productId)) {
        await axios.delete(`${API_URL}/wishlist/remove/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setWishlist(new Set<number>(Array.from(wishlist).filter(id => id !== productId)))
      } else {
        await axios.post(`${API_URL}/wishlist/add`, { product_id: productId }, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setWishlist(new Set<number>(wishlist).add(productId))
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    }
  }

  const toggleComparison = (productId: number) => {
    if (comparison.includes(productId)) {
      setComparison(comparison.filter(id => id !== productId))
    } else {
      if (comparison.length >= 4) {
        alert('Можно сравнивать максимум 4 товара')
        return
      }
      setComparison([...comparison, productId])
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
    const hasHalfStar = rating % 1 >= 0.5
    return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))
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
            <Link href="/catalog" className="text-purple-400 font-semibold">Каталог</Link>
            <Link href="/cart" className="text-gray-300 hover:text-white">🛒 Корзина</Link>
            <Link href="/wishlist-page" className="text-gray-300 hover:text-white">❤️ Избранное ({wishlist.size})</Link>
            <Link href="/login" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold">Войти</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Каталог товаров</h1>

        {/* Поиск и фильтры */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-xl px-6 py-3 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-semibold"
            >
              📊 Фильтры {showFilters ? '▲' : '▼'}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-3 focus:outline-none"
            >
              <option value="popular">🔥 Популярные</option>
              <option value="newest">🆕 Новинки</option>
              <option value="rating">⭐ По рейтингу</option>
              <option value="price_asc">💰 По цене (возрастание)</option>
              <option value="price_desc">💰 По цене (убывание)</option>
            </select>
          </div>

          {/* Расширенные фильтры */}
          {showFilters && (
            <div className="mt-4 p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Цена от:</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Цена до:</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="text-sm text-gray-400">Платформа:</span>
                <button
                  onClick={() => setUserPlatform('android')}
                  className={`px-4 py-1 rounded ${userPlatform === 'android' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  Android
                </button>
                <button
                  onClick={() => setUserPlatform('pc')}
                  className={`px-4 py-1 rounded ${userPlatform === 'pc' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  PC
                </button>
                <button
                  onClick={() => setUserPlatform('ios')}
                  className={`px-4 py-1 rounded ${userPlatform === 'ios' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  iOS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Категории */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Все товары
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Товары */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-spin">⚙️</div>
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-xl text-gray-400">Товары не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const price = getPriceForPlatform(product, userPlatform)
              const isFavorite = wishlist.has(product.id)
              const isInComparison = comparison.includes(product.id)

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
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2 right-2 w-10 h-10 bg-gray-900/90 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all"
                    >
                      {isFavorite ? '❤️' : '🤍'}
                    </button>
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
                      {product.stock_quantity > 0 ? `В наличии: ${product.stock_quantity}` : 'Под заказ'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-lg text-center text-sm"
                    >
                      Купить
                    </Link>
                    <button
                      onClick={() => toggleComparison(product.id)}
                      className={`px-3 py-2 rounded-lg font-semibold text-sm ${
                        isInComparison
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      title="Сравнить"
                    >
                      ⚖️
                    </button>
                  </div>

                  {product.sales_count > 0 && (
                    <div className="mt-2 text-center text-xs text-gray-500">
                      Продано: {product.sales_count}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Панель сравнения */}
        {comparison.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-purple-500 p-4 z-40">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">Сравнение: {comparison.length}/4</span>
                <div className="flex gap-2">
                  {comparison.map((id) => (
                    <span key={id} className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                      Товар #{id}
                      <button
                        onClick={() => toggleComparison(id)}
                        className="ml-2 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setComparison([])}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
                >
                  Очистить
                </button>
                <Link
                  href={`/compare?ids=${comparison.join(',')}`}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg font-semibold"
                >
                  Сравнить
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
