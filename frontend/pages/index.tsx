import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/catalog" className="text-gray-300 hover:text-white">
              Каталог
            </Link>
            <Link href="/cart" className="text-purple-400 font-semibold">
              🛒 Корзина
            </Link>
            <Link href="/contacts" className="text-gray-300 hover:text-white">
              Контакты
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-6">
            Добро пожаловать в{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NeymaryShop
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Интернет-магазин цифровых товаров и услуг
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold mb-2">Игры</h3>
              <p className="text-gray-400">
                Последние новинки игр
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold mb-2">Подписки</h3>
              <p className="text-gray-400">
                Цифровые сервисы
              </p>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Аккаунты</h3>
              <p className="text-gray-400">
                Игровые аккаунты
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/catalog"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-semibold transition-all text-lg"
            >
              Перейти в каталог
            </Link>
            <Link
              href="/cart"
              className="bg-gray-700 hover:bg-gray-600 px-8 py-4 rounded-lg font-semibold transition-all text-lg"
            >
              Корзина
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
