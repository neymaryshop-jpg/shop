import React from 'react'

interface UrgencyBannerProps {
  stockQuantity?: number
  deliveryType?: 'auto' | 'manual'
  salesCount?: number
}

export function UrgencyBanner({ stockQuantity, deliveryType, salesCount }: UrgencyBannerProps) {
  // Не показывать, если нет данных
  if (stockQuantity === undefined && salesCount === undefined) {
    return null
  }

  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 10
  const isOutOfStock = stockQuantity !== undefined && stockQuantity === 0
  const isAutoDelivery = deliveryType === 'auto'

  return (
    <div className="space-y-2">
      {/* Автовыдача */}
      {isAutoDelivery && (
        <div className="bg-[#00ff9d]/10 border border-[#00ff9d]/30 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <div className="text-[#00ff9d] font-bold text-sm">Автовыдача</div>
            <div className="text-[#00ff9d]/70 text-xs">Код придёт в течение 60 секунд</div>
          </div>
        </div>
      )}

      {/* Мало товара */}
      {isLowStock && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <div className="text-red-400 font-bold text-sm">
              Осталось всего {stockQuantity} шт.
            </div>
            <div className="text-red-400/70 text-xs">Успейте купить, пока есть в наличии</div>
          </div>
        </div>
      )}

      {/* Нет в наличии */}
      {isOutOfStock && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">⏳</span>
          <div>
            <div className="text-gray-400 font-bold text-sm">Нет в наличии</div>
            <div className="text-gray-500 text-xs">Ожидаем поступление в течение 24 часов</div>
          </div>
        </div>
      )}

      {/* Популярный товар */}
      {salesCount !== undefined && salesCount > 10 && !isOutOfStock && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-center gap-2">
          <span className="text-xl">📈</span>
          <div>
            <div className="text-purple-400 font-bold text-sm">
              {salesCount} покупок за неделю
            </div>
            <div className="text-purple-400/70 text-xs">Популярный товар</div>
          </div>
        </div>
      )}
    </div>
  )
}
