'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { TrustBadges } from './TrustBadges'
import { FloatingCart } from './ConversionCTA'
import { Header } from './Header'
import { Footer } from './Footer'
import { detectPlatformGroup, getCategoryPriority, getPlatformDisplayName } from '../utils/platformDetector'

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
  is_active: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  icon_url?: string
  is_active: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

function getPriceForPlatform(product: Product, platform: string): number {
  const price = product[`price_${platform}` as keyof Product]
  return typeof price === 'number' ? price : parseFloat(price as string) || 0
}

export default function Homepage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')
  const [platformGroup, setPlatformGroup] = useState<'standard' | 'premium'>('standard')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Определяем платформу и группу
    const platformInfo = detectPlatformGroup()
    setUserPlatform(platformInfo.platform === 'ios' ? 'ios' : platformInfo.platform === 'android' ? 'android' : 'pc')
    setPlatformGroup(platformInfo.group)
    localStorage.setItem('user_platform', platformInfo.platform === 'ios' ? 'ios' : platformInfo.platform === 'android' ? 'android' : 'pc')
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [userPlatform])

  useEffect(() => {
    // Обновляем счётчик корзины
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
    const handleStorage = () => updateCartCount()
    window.addEventListener('storage', handleStorage)
    const interval = setInterval(updateCartCount, 5000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  const loadInitialData = async () => {
    try {
      const categoriesRes = await axios.get(`${API_URL}/categories`)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, { params: { limit: 12 } })
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Platform-aware сортировка категорий
  const getSortedCategories = () => {
    const priority = getCategoryPriority(platformGroup)
    
    return [...categories].sort((a, b) => {
      const aIndex = priority.findIndex(p => a.slug.includes(p) || p.includes(a.slug))
      const bIndex = priority.findIndex(p => b.slug.includes(p) || p.includes(b.slug))
      
      // Категории в приоритете идут первыми
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // Остальные по алфавиту
      return a.name.localeCompare(b.name)
    })
  }

  const sortedCategories = getSortedCategories()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex flex-col">
      {/* Header */}
      <Header showCart={true} cartCount={cartCount} />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 flex-shrink-0">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-[#00ff9d]">Цифровые товары</span> с мгновенной выдачей
          </h1>
          <p className="text-gray-500 text-sm md:text-base mb-8 max-w-2xl mx-auto">
            Автоматическая доставка кодов в течение 60 секунд после оплаты.
            Безопасно. Анонимно. Надёжно.
          </p>

          <TrustBadges />

          <div className="mt-8">
            <Link
              href="/catalog"
              className="inline-block bg-[#00ff9d] text-black font-bold py-4 px-8 rounded-lg text-lg hover:bg-[#00cc7d] transition-all"
            >
              ПЕРЕЙТИ В КАТАЛОГ →
            </Link>
          </div>

          {/* Platform badge */}
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-full px-4 py-2 text-sm text-[#00ff9d]">
              ⚡ Рекомендовано для {getPlatformDisplayName(userPlatform === 'ios' || userPlatform === 'android' ? userPlatform : 'pc')}
              <Link href="/catalog" className="underline hover:opacity-80">
                Показать все категории →
              </Link>
            </span>
          </div>
        </div>
      </section>

      {/* Categories - Platform aware */}
      <section className="py-12 px-4 bg-[#111] flex-shrink-0">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-center mb-2">
            <span className="text-[#00ff9d]">Категории</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            {platformGroup === 'premium' 
              ? 'Telegram, Apple и премиум сервисы' 
              : 'Steam, Epic Games и игровые ключи'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sortedCategories.slice(0, 8).map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalog?category=${cat.slug}`}
                className="bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-[#00ff9d] transition-all group text-center"
              >
                <div className="text-3xl mb-2">{cat.icon_url || '📦'}</div>
                <h3 className="font-semibold group-hover:text-[#00ff9d] transition-colors text-sm">
                  {cat.name}
                </h3>
              </Link>
            ))}

            {/* Fixed popular categories */}
            <Link href="/catalog?search=steam" className="bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-[#00ff9d] transition-all group text-center">
              <div className="text-3xl mb-2">🎮</div>
              <h3 className="font-semibold group-hover:text-[#00ff9d] transition-colors text-sm">Steam</h3>
            </Link>
            {platformGroup === 'premium' ? (
              <Link href="/catalog?search=telegram" className="bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-[#00ff9d] transition-all group text-center">
                <div className="text-3xl mb-2">✈️</div>
                <h3 className="font-semibold group-hover:text-[#00ff9d] transition-colors text-sm">Telegram</h3>
              </Link>
            ) : (
              <Link href="/catalog?search=discord" className="bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-[#00ff9d] transition-all group text-center">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="font-semibold group-hover:text-[#00ff9d] transition-colors text-sm">Discord</h3>
              </Link>
            )}
            <Link href="/catalog" className="bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-[#00ff9d] transition-all group text-center">
              <div className="text-3xl mb-2">🔍</div>
              <h3 className="font-semibold group-hover:text-[#00ff9d] transition-colors text-sm">Все товары</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12 px-4 flex-shrink-0">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-center mb-2">
            <span className="text-[#00ff9d]">Популярные товары</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            Выбор покупателей за эту неделю
          </p>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Загрузка...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">📦</div>
              <p>Товары временно отсутствуют</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => {
                const price = getPriceForPlatform(product, userPlatform)
                const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-[#111] rounded-lg overflow-hidden border border-gray-800 hover:border-[#00ff9d] transition-all group"
                  >
                    <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                      {isLowStock && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          🔥
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold mb-2 line-clamp-2 text-sm group-hover:text-[#00ff9d] transition-colors min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[#00ff9d] font-bold text-lg">
                          {price.toFixed(2)}₽
                        </span>
                        {product.sales_count > 0 && (
                          <span className="text-gray-600 text-xs">
                            {product.sales_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/catalog"
              className="inline-block bg-[#111] border border-gray-800 hover:border-[#00ff9d] text-[#e0e0e0] font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Смотреть все товары →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-[#111] flex-shrink-0">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">
            Как это <span className="text-[#00ff9d]">работает</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1', icon: '🛒', title: 'Выберите', desc: 'Найдите товар' },
              { num: '2', icon: '💳', title: 'Оплатите', desc: 'Картой или криптой' },
              { num: '3', icon: '⚡', title: 'Получите', desc: 'Код за 60 сек' },
              { num: '4', icon: '🎧', title: 'Поддержка', desc: '24/7 на связи' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#00ff9d]/10 rounded-full flex items-center justify-center text-2xl font-bold text-[#00ff9d]">
                  {step.num}
                </div>
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="font-bold text-white mb-1">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <FloatingCart />
    </div>
  )
}
