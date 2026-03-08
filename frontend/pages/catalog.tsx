import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { TrustBadges } from '../components/TrustBadges'
import { FloatingCart } from '../components/ConversionCTA'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { detectPlatformGroup, getCategoryPriority, getPlatformDisplayName, clearPlatformOverride } from '../utils/platformDetector'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

interface Product {
  id: number
  name: string
  category_name: string
  category_slug: string
  price_android: number | string
  price_pc: number | string
  price_ios: number | string
  image_url?: string
  stock_quantity: number
  sales_count: number
  rating_avg?: number
  reviews_count?: number
  is_active: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon_url?: string
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')
  const [platformGroup, setPlatformGroup] = useState<'standard' | 'premium'>('standard')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const platformInfo = detectPlatformGroup()
    setUserPlatform(platformInfo.platform === 'ios' ? 'ios' : platformInfo.platform === 'android' ? 'android' : 'pc')
    setPlatformGroup(platformInfo.group)
    localStorage.setItem('user_platform', platformInfo.platform === 'ios' ? 'ios' : platformInfo.platform === 'android' ? 'android' : 'pc')
  }, [])

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [selectedCategory, searchQuery, sortBy, userPlatform])

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
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (searchQuery) params.search = searchQuery
      
      const response = await axios.get(`${API_URL}/products`, { params })
      let filteredProducts = response.data || []

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
      }

      setProducts(filteredProducts)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriceForPlatform = (product: Product, platform: string): number => {
    const price = product[`price_${platform}` as keyof Product]
    return typeof price === 'number' ? price : parseFloat(price as string) || 0
  }

  const formatPrice = (price: number) => price.toFixed(2)

  const renderStars = (rating?: number) => {
    if (!rating) return '☆☆☆☆☆'
    const fullStars = Math.floor(rating)
    return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
  }

  // Platform-aware сортировка категорий
  const getSortedCategories = () => {
    const priority = getCategoryPriority(platformGroup)
    
    return [...categories].sort((a, b) => {
      const aIndex = priority.findIndex(p => a.slug.includes(p) || p.includes(a.slug))
      const bIndex = priority.findIndex(p => b.slug.includes(p) || p.includes(b.slug))
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      return a.name.localeCompare(b.name)
    })
  }

  const sortedCategories = getSortedCategories()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      <Header showCart={true} cartCount={cartCount} />

      <div className="container mx-auto px-4 py-8">
        {/* Заголовок и доверие */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="text-[#00ff9d]">Каталог товаров</span>
          </h1>
          <p className="text-gray-500 text-center text-sm mb-6">
            Мгновенная доставка • TON защита • Поддержка 24/7
          </p>
          
          {/* Platform badge с опцией сброса */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-full px-4 py-2 text-sm text-[#00ff9d]">
              ⚡ Рекомендовано для {getPlatformDisplayName(userPlatform === 'ios' || userPlatform === 'android' ? userPlatform : 'pc')}
              <button
                onClick={() => {
                  clearPlatformOverride()
                  window.location.reload()
                }}
                className="underline hover:opacity-80"
              >
                Показать все категории →
              </button>
            </span>
          </div>

          <div className="max-w-2xl mx-auto">
            <TrustBadges />
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#111] border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff9d]"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#111] border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff9d]"
            >
              <option value="popular">🔥 Популярные</option>
              <option value="price_asc">💰 По цене (возрастание)</option>
              <option value="price_desc">💰 По цене (убывание)</option>
              <option value="rating">⭐ По рейтингу</option>
            </select>
          </div>

          {/* Категории - auto-sorted */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#00ff9d] text-black'
                  : 'bg-[#111] border border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              Все товары
            </button>
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-[#00ff9d] text-black'
                    : 'bg-[#111] border border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Товары */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 animate-spin">⚙️</div>
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">😔</div>
            <p className="text-gray-400">Товары не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const price = getPriceForPlatform(product, userPlatform)
              const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5
              const isOutOfStock = product.stock_quantity === 0

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-[#111] rounded-lg overflow-hidden border border-gray-800 hover:border-[#00ff9d] transition-all group"
                >
                  <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                    
                    {isLowStock && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        🔥
                      </div>
                    )}
                    {product.sales_count > 50 && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                        📈
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[#00ff9d] transition-colors">
                      {product.name}
                    </h3>

                    {product.rating_avg && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-yellow-400 text-sm">
                          {renderStars(parseFloat(String(product.rating_avg)))}
                        </span>
                        <span className="text-gray-600 text-xs">
                          ({product.reviews_count || 0})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold text-[#00ff9d]">
                        {formatPrice(price)}₽
                      </span>
                      {isOutOfStock ? (
                        <span className="text-red-400 text-xs">Нет</span>
                      ) : isLowStock ? (
                        <span className="text-red-400 text-xs">{product.stock_quantity} шт.</span>
                      ) : (
                        <span className="text-gray-600 text-xs">В наличии</span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
                        cart.push({
                          id: product.id,
                          name: product.name,
                          price,
                          quantity: 1,
                          platform: userPlatform,
                        })
                        localStorage.setItem('cart', JSON.stringify(cart))
                      }}
                      disabled={isOutOfStock}
                      className="w-full bg-[#00ff9d] text-black font-bold py-2 rounded-lg text-sm hover:bg-[#00cc7d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isOutOfStock ? 'Нет в наличии' : 'В корзину'}
                    </button>

                    {product.sales_count > 0 && (
                      <div className="text-center text-xs text-gray-600 mt-2">
                        Продано: {product.sales_count}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
      <FloatingCart />
    </div>
  )
}
