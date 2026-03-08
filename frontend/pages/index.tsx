import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FloatingCart } from '../components/ConversionCTA'

interface Category {
  id: number
  name: string
  slug: string
  icon_url?: string
  art_url?: string
  emoji_set?: string
  description?: string
  show_on_main?: boolean
}

interface Product {
  id: number
  name: string
  price_android: number
  price_pc: number
  price_ios: number
  image_url?: string
  category_name?: string
  stock_quantity?: number
  sales_count?: number
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlatform, setUserPlatform] = useState<'android' | 'pc' | 'ios'>('pc')

  useEffect(() => {
    const savedPlatform = localStorage.getItem('user_platform') as 'android' | 'pc' | 'ios' | null
    if (savedPlatform) {
      setUserPlatform(savedPlatform)
    } else {
      const userAgent = navigator.userAgent.toLowerCase()
      if (userAgent.includes('android')) setUserPlatform('android')
      else if (userAgent.includes('iphone') || userAgent.includes('ipad')) setUserPlatform('ios')
      else setUserPlatform('pc')
      localStorage.setItem('user_platform', userPlatform)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/categories`).then(r => r.ok ? r.json() : []),
          fetch(`${API_URL}/products?limit=12`).then(r => r.ok ? r.json() : [])
        ])
        setCategories(Array.isArray(categoriesRes) ? categoriesRes.filter((c: Category) => c.show_on_main !== false) : [])
        setPopularProducts(Array.isArray(productsRes) ? productsRes : [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getPrice = (product: Product): number => {
    const key = `price_${userPlatform}` as keyof Product
    const price = product[key]
    return typeof price === 'number' ? price : parseFloat(price as string) || 0
  }

  const getCategoryEmoji = (category: Category): string => {
    if (category.emoji_set) {
      const emojis = category.emoji_set.split(',').map(e => e.trim())
      return emojis[Math.floor(Math.random() * emojis.length)] || '📦'
    }
    return category.icon_url || '📦'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      {/* Navigation */}
      <nav className="bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#00ff9d]">
            NeymaryShop
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/catalog" className="text-gray-400 hover:text-[#e0e0e0] transition-colors text-sm md:text-base">
              Каталог
            </Link>
            <Link href="/cart" className="text-[#00ff9d] font-semibold hover:opacity-80 transition-colors">
              🛒 Корзина
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Categories Grid - donatov.net style */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="text-[#00ff9d]">Категории товаров</span>
          </h1>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Выберите категорию для просмотра всех товаров
          </p>

          {loading ? (
            <div className="text-center text-gray-500 py-20">Загрузка категорий...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => {
                const emoji = getCategoryEmoji(category)
                const emojis = category.emoji_set?.split(',').map((e: string) => e.trim()) || [emoji]

                return (
                  <Link
                    key={category.id}
                    href={`/catalog?category=${category.slug}`}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border border-gray-800 hover:border-[#00ff9d] transition-all duration-300 hover:transform hover:scale-105"
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                      <div className="absolute top-4 right-4 text-6xl">{emojis[0]}</div>
                      <div className="absolute bottom-4 left-4 text-4xl">{emojis[1] || emojis[0]}</div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-6 md:p-8">
                      {/* Icon */}
                      <div className="text-5xl md:text-6xl mb-4 transition-transform group-hover:scale-110">
                        {emoji}
                      </div>

                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-[#00ff9d] transition-colors">
                        {category.name}
                      </h2>

                      {/* Description */}
                      {category.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      {/* Emoji Set Preview */}
                      {category.emoji_set && (
                        <div className="text-lg mb-4 opacity-70">
                          {emojis.slice(0, 4).join(' ')}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-[#00ff9d] font-semibold group-hover:gap-3 transition-all">
                        <span>Перейти</span>
                        <span className="text-xl">→</span>
                      </div>
                    </div>

                    {/* Hover Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00ff9d]/0 to-[#03dac6]/0 group-hover:from-[#00ff9d]/5 group-hover:to-[#03dac6]/5 transition-all" />
                  </Link>
                )
              })}
            </div>
          )}

          {categories.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">Категории временно отсутствуют</p>
              <Link href="/catalog" className="inline-block mt-6 text-[#00ff9d] hover:underline">
                Перейти в полный каталог →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Popular Products */}
      {!loading && popularProducts.length > 0 && (
        <section className="py-12 px-4 bg-[#111]">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-center mb-2">
              <span className="text-[#00ff9d]">Популярные товары</span>
            </h2>
            <p className="text-gray-500 text-center text-sm mb-8">
              Выбор покупателей за эту неделю
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularProducts.map((product) => {
                const price = getPrice(product)
                const isLowStock = product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-[#0a0a0a] rounded-lg overflow-hidden border border-gray-800 hover:border-[#00ff9d] transition-all group"
                  >
                    <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                      {isLowStock && (
                        <div className="absolute top-2 right-2 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded">
                          🔥
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold mb-2 line-clamp-2 text-sm group-hover:text-[#00ff9d] transition-colors min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[#00ff9d] font-bold text-sm">
                          {price.toFixed(2)}₽
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/catalog"
                className="inline-block bg-[#16213e] border border-gray-800 hover:border-[#00ff9d] text-[#e0e0e0] font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Смотреть все товары →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '⚡', title: 'Мгновенная выдача', desc: 'Автовыдача < 60 секунд' },
              { icon: '🔒', title: 'TON защита', desc: 'Безопасная оплата' },
              { icon: '🎧', title: 'Поддержка 24/7', desc: 'Всегда на связи' },
              { icon: '💳', title: 'Оплата картой', desc: 'Все способы оплаты' },
            ].map((badge) => (
              <div key={badge.title} className="bg-[#111] border border-gray-800 rounded-lg p-4 text-center hover:border-[#00ff9d]/50 transition-colors">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-bold text-[#e0e0e0] text-sm mb-1">{badge.title}</div>
                <div className="text-gray-500 text-xs">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-[#111]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">
            Как это <span className="text-[#00ff9d]">работает</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1', icon: '🛒', title: 'Выберите', desc: 'Найдите товар в каталоге' },
              { num: '2', icon: '💳', title: 'Оплатите', desc: 'Картой или криптой' },
              { num: '3', icon: '⚡', title: 'Получите', desc: 'Код в течение 60 сек' },
              { num: '4', icon: '🎧', title: 'Поддержка', desc: '24/7 на связи' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#00ff9d]/10 rounded-full flex items-center justify-center text-xl font-bold text-[#00ff9d]">
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
      <footer className="bg-[#050505] border-t border-gray-900 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="text-2xl font-bold text-[#00ff9d] mb-4">NeymaryShop</div>
          <p className="text-gray-500 text-sm mb-6">Цифровые товары с мгновенной доставкой</p>
          <div className="flex justify-center gap-6 text-sm mb-6">
            <a href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">О нас</a>
            <a href="#" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Поддержка</a>
            <a href="https://t.me/neymaryshop_support" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00ff9d] transition-colors">Telegram</a>
          </div>
          <div className="text-gray-600 text-xs">
            © 2021-2026 NeymaryShop. Все права защищены.
          </div>
        </div>
      </footer>

      <FloatingCart />
    </div>
  )
}
