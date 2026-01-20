'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  product_count?: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`)
      setCategories(response.data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-xl text-gray-400">Загрузка каталога...</p>
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
          <div className="flex gap-6 text-sm text-gray-300">
            <Link href="/" className="hover:text-white">Главная</Link>
            <Link href="/catalog" className="text-purple-400">Каталог</Link>
            <Link href="/contacts" className="hover:text-white">Контакты</Link>
          </div>
        </div>
      </nav>

      {/* Hero секция каталога */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Каталог товаров
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Выберите категорию для просмотра товаров
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Быстрая доставка</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Гарантия качества</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Поддержка 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Сетка категорий */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl text-gray-400">Категории пока не добавлены</p>
              <p className="text-sm text-gray-500 mt-2">
                Администратор скоро добавит товары
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className="group"
                  >
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 hover:from-purple-900/30 hover:to-pink-900/30 transition-all transform hover:scale-105 cursor-pointer border border-gray-700 hover:border-purple-500 shadow-lg hover:shadow-purple-500/20 h-full overflow-hidden">
                      {/* Фоновый эффект */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative z-10">
                        {/* Иконка категории */}
                        <div className="text-center mb-6">
                          {category.icon_url ? (
                            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-purple-500/30 group-hover:border-purple-500 transition-colors">
                              <img
                                src={category.icon_url}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-4xl">
                              📦
                            </div>
                          )}
                        </div>

                        {/* Название */}
                        <h3 className="text-2xl font-bold text-center mb-3 group-hover:text-purple-400 transition-colors">
                          {category.name}
                        </h3>

                        {/* Описание */}
                        {category.description && (
                          <p className="text-gray-400 text-center text-sm line-clamp-2 mb-4">
                            {category.description}
                          </p>
                        )}

                        {/* Счётчик товаров */}
                        {category.product_count !== undefined && (
                          <div className="text-center">
                            <span className="inline-block bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-400">
                              {category.product_count} {category.product_count === 1 ? 'товар' : 'товаров'}
                            </span>
                          </div>
                        )}

                        {/* Кнопка */}
                        <div className="mt-6 text-center">
                          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 group-hover:from-purple-700 group-hover:to-pink-700 text-white font-semibold px-6 py-2 rounded-lg transition-all">
                            Смотреть товары
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Кнопка "Все товары" */}
              <div className="text-center">
                <Link href="/products">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all border border-gray-700 hover:border-purple-500 inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Показать все товары
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 px-4 border-t border-gray-800 mt-20">
        <div className="container mx-auto text-center text-gray-400">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            NeymaryShop
          </div>
          <p className="text-sm mb-4">Быстрые и безопасные покупки цифровых товаров</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/" className="hover:text-white">Главная</Link>
            <Link href="/contacts" className="hover:text-white">Контакты</Link>
            <a href="https://t.me/neymaryshop" className="hover:text-white">Telegram</a>
          </div>
          <div className="mt-6 text-xs text-gray-600">
            © 2024-2026 NeymaryShop • TON Network
          </div>
        </div>
      </footer>
    </div>
  )
}