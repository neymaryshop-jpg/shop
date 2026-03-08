import React, { useState, useEffect } from 'react'

interface PostPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  referralCode?: string | null
  orderId?: string
  productName?: string
}

export function PostPurchaseModal({
  isOpen,
  onClose,
  referralCode,
  orderId,
  productName,
}: PostPurchaseModalProps) {
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [copied, setCopied] = useState(false)

  // Авто-открытие через 2 секунды после покупки
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        // Модал уже открыт, ничего не делаем
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const copyReferralLink = async () => {
    if (!referralCode) return

    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`
    
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const submitReview = async () => {
    if (!reviewText.trim()) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('Пожалуйста, войдите для оставления отзыва')
        return
      }

      // TODO: Интеграция с API отзывов
      alert('Спасибо за ваш отзыв!')
      setReviewText('')
      onClose()
    } catch (e) {
      console.error('Review error:', e)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Заголовок */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Покупка успешна!
            </h3>
            {orderId && (
              <p className="text-gray-500 text-sm">Заказ #{orderId}</p>
            )}
          </div>

          {/* Реферальная секция */}
          {referralCode && (
            <div className="bg-[#111] rounded border border-gray-800 p-4 mb-6">
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-bold text-white mb-1">
                  Получите 5% с каждой покупки друга!
                </h4>
                <p className="text-gray-400 text-sm mb-3">
                  Поделитесь своей реферальной ссылкой
                </p>
                
                <div className="bg-black rounded border border-gray-800 p-3 mb-3">
                  <code className="text-lg text-[#00ff9d] block break-all">
                    {referralCode}
                  </code>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyReferralLink}
                    className={`flex-1 font-semibold px-4 py-2 rounded text-sm transition-all ${
                      copied
                        ? 'bg-[#00ff9d] text-black'
                        : 'bg-gray-800 border border-gray-700 text-[#e0e0e0] hover:bg-gray-700'
                    }`}
                  >
                    {copied ? '✓ Скопировано' : '📋 Копировать'}
                  </button>
                  <button
                    onClick={copyReferralLink}
                    className="flex-1 bg-[#00ff9d] text-black font-semibold px-4 py-2 rounded text-sm hover:bg-[#00cc7d]"
                  >
                    🔗 Поделиться
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Секция отзыва */}
          <div className="border-t border-gray-800 pt-6">
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-bold text-white mb-1">
                Понравилась покупка?
              </h4>
              <p className="text-gray-400 text-sm">
                Оставьте отзыв и помогите другим
              </p>
            </div>

            {/* Звёзды */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-3xl transition-all ${
                    star <= reviewRating
                      ? 'text-yellow-400 scale-110'
                      : 'text-gray-600'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Текст отзыва */}
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Напишите ваш отзыв..."
              rows={3}
              className="w-full bg-[#111] border border-gray-800 rounded px-4 py-3 focus:outline-none focus:border-[#00ff9d] text-sm text-[#e0e0e0] mb-3 resize-none"
            />

            <button
              onClick={submitReview}
              disabled={!reviewText.trim()}
              className="w-full bg-gray-800 border border-gray-700 text-[#e0e0e0] font-semibold py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
            >
              Отправить отзыв
            </button>
          </div>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-500 hover:text-white text-sm py-2"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

// Хук для управления модалом после покупки
export function usePostPurchaseModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [orderData, setOrderData] = useState<{
    referralCode?: string | null
    orderId?: string
    productName?: string
  }>({})

  const show = (data: typeof orderData) => {
    setOrderData(data)
    setIsOpen(true)
  }

  const hide = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    show,
    hide,
    ...orderData,
  }
}
