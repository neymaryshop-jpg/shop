'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Навигация */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl z-50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </Link>
          <div className="hidden md:flex gap-8 text-sm text-gray-300">
            <Link href="/catalog" className="hover:text-purple-400 transition-colors">Каталог</Link>
            <Link href="/contacts" className="hover:text-purple-400 transition-colors">Контакты</Link>
            <Link href="/login" className="hover:text-purple-400 transition-colors">Войти</Link>
          </div>
          <Link href="/catalog">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg font-semibold transition-all">
              Каталог
            </button>
          </Link>
        </div>
      </nav>

      
      {/* Преимущества */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            Почему выбирают нас?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-900/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-white">Мгновенная доставка</h3>
              <p className="text-gray-400">Получите товар за 2-5 минут после оплаты</p>
            </div>
            <div className="text-center p-8 bg-gray-900/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3 text-white">100% безопасно</h3>
              <p className="text-gray-400">Оплата через TON Network и карты РФ</p>
            </div>
            <div className="text-center p-8 bg-gray-900/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white">Гарантия возврата</h3>
              <p className="text-gray-400">Вернём деньги если код не работает</p>
            </div>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                10,000+
              </div>
              <p className="text-gray-400">Довольных клиентов</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <p className="text-gray-400">Поддержка онлайн</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                2-5 мин
              </div>
              <p className="text-gray-400">Средняя доставка</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-5xl font-bold mb-6 text-white">
            Готовы начать покупки?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Более 1000+ товаров в нашем каталоге
          </p>
          <Link href="/catalog">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-5 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50">
              Открыть каталог →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 px-4 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                NeymaryShop
              </h3>
              <p className="text-gray-400 text-sm">
                Быстрые и безопасные покупки цифровых товаров
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Навигация</h4>
              <div className="space-y-2 text-sm">
                <Link href="/catalog" className="block text-gray-400 hover:text-white">Каталог</Link>
                <Link href="/products" className="block text-gray-400 hover:text-white">Товары</Link>
                <Link href="/contacts" className="block text-gray-400 hover:text-white">Контакты</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Поддержка</h4>
              <div className="space-y-2 text-sm">
                <a href="/faq" className="block text-gray-400 hover:text-white">FAQ</a>
                <a href="/terms" className="block text-gray-400 hover:text-white">Условия</a>
                <a href="/privacy" className="block text-gray-400 hover:text-white">Конфиденциальность</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Контакты</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <a href="https://t.me/neymaryshop" className="block hover:text-white">Telegram</a>
                <a href="mailto:neymaryshop@gmail.com" className="block hover:text-white">Email</a>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-gray-600 border-t border-gray-800 pt-8">
            © 2024-2026 NeymaryShop • Работает на TON Network
          </div>
        </div>
      </footer>
    </main>
  )
}
