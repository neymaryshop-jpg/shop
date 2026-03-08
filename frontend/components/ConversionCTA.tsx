import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface ConversionCTAProps {
  price: number
  inStock: boolean
  onBuyNow?: () => void
  onAddToCart?: () => void
  variant?: 'default' | 'green' | 'purple'
  text?: string
}

// A/B тест вариантов кнопки
const CTA_VARIANTS = {
  default: {
    text: 'КУПИТЬ СЕЙЧАС',
    class: 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]',
  },
  green: {
    text: 'ПОЛУЧИТЬ КОД',
    class: 'bg-[#00ff9d] text-black hover:bg-[#00cc7d]',
  },
  purple: {
    text: 'ОФОРМИТЬ ЗАКАЗ',
    class: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
  },
} as const

export function ConversionCTA({
  price,
  inStock,
  onBuyNow,
  onAddToCart,
  variant = 'default',
  text,
}: ConversionCTAProps) {
  const [abVariant, setAbVariant] = useState<'default' | 'green' | 'purple'>('default')

  // Определяем вариант A/B теста
  useEffect(() => {
    const saved = localStorage.getItem('ab_variant_cta') as keyof typeof CTA_VARIANTS | null
    if (saved && CTA_VARIANTS[saved]) {
      setAbVariant(saved)
    } else {
      const variants = Object.keys(CTA_VARIANTS) as Array<keyof typeof CTA_VARIANTS>
      const random = variants[Math.floor(Math.random() * variants.length)]
      localStorage.setItem('ab_variant_cta', random)
      setAbVariant(random)
    }
  }, [])

  const cta = CTA_VARIANTS[abVariant]
  const buttonText = text || cta.text

  // Мобильная липкая кнопка
  return (
    <>
      {/* Десктоп кнопка */}
      <div className="hidden md:block space-y-3">
        <button
          onClick={onBuyNow}
          disabled={!inStock}
          className={`w-full font-bold py-4 rounded-lg text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cta.class}`}
        >
          {buttonText}
        </button>

        {onAddToCart && (
          <button
            onClick={onAddToCart}
            disabled={!inStock}
            className="w-full bg-gray-800 border border-gray-700 text-[#e0e0e0] font-semibold py-3 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            В корзину
          </button>
        )}
      </div>

      {/* Мобильная липкая кнопка */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-gray-800 p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-[#00ff9d]">{price.toFixed(2)}₽</div>
            <div className="text-xs text-gray-500">
              {inStock ? '✓ В наличии' : '✗ Нет в наличии'}
            </div>
          </div>
          <button
            onClick={onBuyNow}
            disabled={!inStock}
            className={`flex-1 max-w-[180px] font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cta.class}`}
          >
            {buttonText}
          </button>
        </div>
      </div>

      {/* Отступ для мобильной кнопки */}
      <div className="h-20 md:hidden"></div>
    </>
  )
}

// Компонент плавающей кнопки корзины
export function FloatingCart() {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = localStorage.getItem('cart')
        const items = cart ? JSON.parse(cart) : []
        setItemCount(Array.isArray(items) ? items.length : 0)
      } catch {
        setItemCount(0)
      }
    }

    updateCount()

    const handleStorage = () => updateCount()
    window.addEventListener('storage', handleStorage)

    // Проверка каждые 5 секунд
    const interval = setInterval(updateCount, 5000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  if (itemCount === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-[#00ff9d] hover:bg-[#00cc7d] text-black px-5 py-3 rounded-full shadow-lg z-40 transition-all hover:scale-105 flex items-center gap-2 font-bold"
    >
      <span>🛒</span>
      <span>{itemCount}</span>
    </Link>
  )
}
