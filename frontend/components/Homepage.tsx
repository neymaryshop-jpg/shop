'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

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
  is_active: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon_url?: string
  is_active: boolean
}

interface PaymentMethod {
  id: string
  name: string
  icon: string
  description: string
  enabled: boolean
  details: {
    address?: string
    network?: string
    card_number?: string
    card_holder?: string
    bank_name?: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

function getPriceForPlatform(product: Product, platform: string): number {
  const price = product[`price_${platform}` as keyof Product]
  return typeof price === 'number' ? price : parseFloat(price as string) || 0
}

function ProductCard({ product, price, onClick }: {
  product: Product
  price: number
  onClick: () => void
}) {
  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, string> = {
      'Игры': '🎮',
      'Подписки': '📺',
      'Валюта': '💰',
      'Аккаунты': '👤',
      'ПО': '💻',
      'Стриминг': '🎵'
    }
    return icons[categoryName] || '📦'
  }

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 hover:from-purple-900/30 hover:to-pink-900/30 transition-all transform hover:scale-105 cursor-pointer border border-gray-700 hover:border-purple-500 shadow-lg hover:shadow-purple-500/20"
    >
      <div className="text-5xl mb-4 text-center">
        {getCategoryIcon(product.category_name)}
      </div>
      <h3 className="font-bold text-white mb-2 text-base line-clamp-2 min-h-[3rem]">
        {product.name}
      </h3>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {price.toFixed(2)}₽
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
  )
}

export default function Homepage() {
  const { user, logout } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('android')

  useEffect(() => {
    const savedPlatform = localStorage.getItem('user_platform') as 'android' | 'pc' | 'ios' | null
    if (savedPlatform) {
      setUserPlatform(savedPlatform)
    } else {
      // Auto-detect platform
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('android')) {
        setUserPlatform('android')
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
        setUserPlatform('ios')
      } else {
        setUserPlatform('pc')
      }
    }
  }, [])

  

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, searchQuery])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, paymentMethodsRes, newArrivalsRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/payment-methods`),
        axios.get(`${API_URL}/products/new-arrivals`)
      ])
      setCategories(categoriesRes.data)
      setPaymentMethods(paymentMethodsRes.data)
      setNewArrivals(newArrivalsRes.data)
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

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-xl text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl z-40 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </Link>
          <div className="hidden md:flex gap-8 text-sm">
            <a href="#new-arrivals" className="hover:text-green-400 transition-colors">Новинки</a>
            <a href="#catalog" className="hover:text-purple-400 transition-colors">Каталог</a>
            <a href="#how-it-works" className="hover:text-purple-400 transition-colors">Как работает</a>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/notifications" className="relative text-gray-300 hover:text-white">
                  🔔
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">!</span>
                </Link>
                <Link href="/wishlist-page" className="text-gray-300 hover:text-white">
                  ❤️
                </Link>
                <span className="text-gray-300">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <>
                <Link href="/wishlist-page" className="text-gray-300 hover:text-white hidden sm:block">
                  ❤️ Избранное
                </Link>
                <Link href="/login" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg font-semibold transition-all">
                  Войти
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section id="new-arrivals" className="pt-24 pb-12 px-4 bg-gradient-to-b from-gray-900 to-gray-800/50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              🔥 Новинки
            </span>
          </h2>
          <p className="text-center text-gray-400 mb-8">
            Свежие товары за последние 30 дней
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {newArrivals.slice(0, 8).map((product) => {
              const price = getPriceForPlatform(product, userPlatform)
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  price={price}
                  onClick={() => setSelectedProduct(product)}
                />
              )
            })}
          </div>

          {newArrivals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-lg text-gray-400">Пока нет новинок</p>
            </div>
          )}
        </div>
      </section>

      <section id="catalog" className="pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Каталог товаров
            </span>
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Быстрая доставка • Гарантия возврата • Поддержка 24/7
          </p>

          <div className="mb-8">
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-2xl mx-auto block bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
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
                onClick={() => setSelectedCategory(cat.slug)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const price = getPriceForPlatform(product, userPlatform)
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  price={price}
                  onClick={() => setSelectedProduct(product)}
                />
              )
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-xl text-gray-400">Товары не найдены</p>
            </div>
          )}
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-5xl font-bold text-center mb-16">Как это работает</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Выберите', desc: 'Найдите товар', icon: '🛒' },
              { num: '2', title: 'Оплатите', desc: 'Крипта или карты', icon: '💳' },
              { num: '3', title: 'Подтвердите', desc: 'Админ проверит', icon: '✅' },
              { num: '4', title: 'Получите', desc: 'Код за 2 минуты', icon: '🎉' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold">
                  {step.num}
                </div>
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black py-12 px-4">
        <div className="container mx-auto text-center text-gray-400">
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            NeymaryShop
          </div>
          <p className="mb-4">Быстрые и безопасные покупки цифровых товаров</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white">О нас</a>
            <a href="#" className="hover:text-white">Поддержка</a>
            <a href="#" className="hover:text-white">Telegram</a>
          </div>
          <div className="mt-6 text-xs text-gray-600">
            © 2021-2026 NeymaryShop
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-2">{selectedProduct.name}</h3>
            <p className="text-2xl font-bold text-purple-400 mb-4">
              {getPriceForPlatform(selectedProduct, userPlatform)}₽
            </p>
            <p className="text-gray-400 mb-4">{selectedProduct.category_name}</p>
            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
