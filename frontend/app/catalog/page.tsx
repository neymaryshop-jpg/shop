'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Product {
  id: number
  name: string
  price_android: number | string
  price_pc: number | string
  price_ios: number | string
  image_url?: string
  category_name: string
  description?: string
  stock_quantity: number
  is_active: boolean
  sales_count: number
}

interface Category {
  id: number
  name: string
  slug: string
  icon_url?: string
  description?: string
  is_active: boolean
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('android')

  useEffect(() => {
    const savedPlatform = localStorage.getItem('user_platform') as 'android' | 'pc' | 'ios' | null
    if (savedPlatform) {
      setUserPlatform(savedPlatform)
    }
    // Don't auto-detect, let user choose manually
    
    loadCategories()
    loadProducts()
  }, [selectedCategory, searchQuery])

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      setCategories(response.data.filter((cat: Category) => cat.is_active))
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Не удалось загрузить категории')
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = {}
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      params.active = true
      
      const response = await axios.get(`${API_URL}/products`, { params })
      setProducts(response.data.filter((product: Product) => product.is_active && product.stock_quantity > 0))
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }

  const getPriceForPlatform = (product: Product) => {
    let price: number | string
    switch (userPlatform) {
      case 'android':
        price = product.price_android
        break
      case 'ios':
        price = product.price_ios
        break
      case 'pc':
        price = product.price_pc
        break
      default:
        price = product.price_android
    }
    return typeof price === 'string' ? parseFloat(price) : price
  }

  const handleAddToCart = async (productId: number, productName: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Для добавления в корзину необходимо войти в систему')
        return
      }

      await axios.post(`${API_URL}/cart/add`, 
        { 
          product_id: productId, 
          quantity: 1,
          platform: userPlatform
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      )
      
      alert(`${productName} добавлен в корзину!`)
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      const errorMessage = error.response?.data?.message || 'Не удалось добавить товар в корзину'
      alert(errorMessage)
    }
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/catalog" className="text-purple-400 font-semibold">
              Каталог
            </Link>
            <Link href="/cart" className="text-gray-300 hover:text-white">
              🛒 Корзина
            </Link>
            <Link href="/contacts" className="text-gray-300 hover:text-white">
              Контакты
            </Link>
            <Link href="/login" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-all">
              Войти
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <span className="text-gray-400">Ваша платформа:</span>
            <div className="flex gap-2">
              {[
                { id: 'android', label: '🤖 Android', icon: '🤖' },
                { id: 'pc', label: '🖥️ PC', icon: '🖥️' },
                { id: 'ios', label: '🍎 iOS', icon: '🍎' }
              ].map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => {
                      setUserPlatform(platform.id as any)
                      localStorage.setItem('user_platform', platform.id)
                    }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    userPlatform === platform.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Каталог товаров</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 sticky top-32">
              <h2 className="text-xl font-bold mb-4">Категории</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Все категории
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat.icon_url ? <span className="mr-2">{cat.icon_url}</span> : ''}
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-spin">⚙️</div>
                <p className="text-gray-400">Загрузка товаров...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400">Товары не найдены</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const price = getPriceForPlatform(product)
                  
                  return (
                    <div key={product.id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all group">
                      <div className="aspect-square bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center relative">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = '<div class="text-6xl opacity-50">🎮</div>'
                            }}
                          />
                        ) : (
                          <div className="text-6xl opacity-50">🎮</div>
                        )}
                        
                        {product.stock_quantity <= 5 && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            Осталось мало!
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <div className="text-xs text-purple-400 mb-2 flex justify-between">
                          <span>{product.category_name}</span>
                          {product.sales_count > 0 && (
                            <span>Продано: {product.sales_count}</span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-2xl font-bold text-purple-400">
                            {formatPrice(price)} ₽
                          </div>
                          <div className={`text-sm ${
                            product.stock_quantity > 10 ? 'text-green-400' : 'text-orange-400'
                          }`}>
                            {product.stock_quantity > 10 ? '✓ В наличии' : `Осталось: ${product.stock_quantity}`}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAddToCart(product.id, product.name)}
                            disabled={product.stock_quantity === 0}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-all group-hover:scale-105 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            🛒 В корзину
                          </button>
                          <button className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold transition-all text-sm">
                            Купить
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}