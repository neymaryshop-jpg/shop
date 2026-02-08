'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface Product {
  id: number
  name: string
  category_name: string
  price_android: number | string
  stock_quantity: number
  sales_count: number
  is_active: boolean
}

interface Category {
  id: number
  name: string
  slug: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Читаем хеш из URL при загрузке
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setSelectedCategory(hash)
      }
    }
    loadInitialData()
  }, [])

  // Обработчик изменения хеша
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'all'
      setSelectedCategory(hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Загружаем товары при изменении категории
  useEffect(() => {
    if (!loading) {
      loadProducts()
    }
  }, [selectedCategory, searchQuery])

  const loadInitialData = async () => {
    try {
      const [categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/categories`)
      ])
      setCategories(categoriesRes.data)
      await loadProducts()
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const params: any = {}
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      if (searchQuery) {
        params.search = searchQuery
      }

      const response = await axios.get(`${API_URL}/products`, { params })
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const handleCategoryClick = (slug: string) => {
    window.location.hash = slug
    setSelectedCategory(slug)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-xl text-gray-400">Загрузка товаров...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </Link>
          <div className="flex gap-4">
            <Link href="/categories" className="text-gray-400 hover:text-white">
              Категории
            </Link>
            <Link href="/" className="text-gray-400 hover:text-white">
              На главную
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Каталог товаров
            </span>
          </h1>
          <p className="text-center text-gray-400 mb-12">
            Быстрая доставка • Гарантия возврата • Поддержка 24/7
          </p>

          {/* Поиск */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="🔍 Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-2xl mx-auto block bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Категории (табы) */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Все товары
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Сетка товаров */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 hover:from-purple-900/30 hover:to-pink-900/30 transition-all transform hover:scale-105 cursor-pointer border border-gray-700 hover:border-purple-500 shadow-lg hover:shadow-purple-500/20"
              >
                <div className="text-5xl mb-4 text-center">📦</div>
                <h3 className="font-bold text-white mb-2 text-base line-clamp-2 min-h-[3rem]">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mb-3">
<span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {typeof product.price_android === 'string' ? parseFloat(product.price_android).toFixed(2) : product.price_android.toFixed(2)}₽
                  </span>
                  <span className="text-xs text-gray-400">
                    {product.stock_quantity > 0 ? `В наличии: ${product.stock_quantity}` : 'Под заказ'}
                  </span>
                </div>
                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all">
                  Купить
                </button>
                {product.sales_count > 0 && (
                  <div className="mt-2 text-center text-xs text-gray-500">
                    Продано: {product.sales_count}
                  </div>
                )}
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-xl text-gray-400">
                {searchQuery ? 'Товары не найдены по запросу' : 'В этой категории пока нет товаров'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}