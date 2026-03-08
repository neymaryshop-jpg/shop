import React from 'react'

interface TrustBadge {
  icon: string
  title: string
  description: string
}

const badges: TrustBadge[] = [
  {
    icon: '⚡',
    title: 'Мгновенная выдача',
    description: 'Автовыдача < 60 секунд',
  },
  {
    icon: '🔒',
    title: 'TON защита',
    description: 'Безопасная оплата',
  },
  {
    icon: '🎧',
    title: 'Поддержка 24/7',
    description: 'Всегда на связи',
  },
]

export function TrustBadges() {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="bg-[#111] border border-gray-800 rounded-lg p-3 md:p-4 text-center hover:border-[#00ff9d]/50 transition-colors"
        >
          <div className="text-2xl md:text-3xl mb-1 md:mb-2">{badge.icon}</div>
          <div className="font-bold text-[#e0e0e0] text-xs md:text-sm mb-1">
            {badge.title}
          </div>
          <div className="text-gray-500 text-[10px] md:text-xs">
            {badge.description}
          </div>
        </div>
      ))}
    </div>
  )
}
