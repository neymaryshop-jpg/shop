'use client'

import Link from 'next/link'

export default function ContactsPage() {
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
            <Link href="/catalog" className="hover:text-white">Каталог</Link>
            <Link href="/contacts" className="text-purple-400">Контакты</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Контакты
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Свяжитесь с нами любым удобным способом
          </p>
        </div>
      </section>

      {/* Контактная информация */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Telegram */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-2xl font-bold mb-3">Telegram</h3>
              <p className="text-gray-400 mb-6">
                Самый быстрый способ связи. Отвечаем в течение 5 минут.
              </p>
              <a 
                href="https://t.me/neymaryshop" 
                target="_blank"
                className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Написать в Telegram
              </a>
            </div>

            {/* Email */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-2xl font-bold mb-3">Email</h3>
              <p className="text-gray-400 mb-6">
                Для официальных запросов и партнёрских предложений.
              </p>
              <a 
                href="mailto:support@neymaryshop.ton"
                className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                support@neymaryshop.ton
              </a>
            </div>
          </div>

          {/* Поддержка 24/7 */}
          <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-purple-500/30">
            <div className="text-center">
              <div className="text-6xl mb-4">🎧</div>
              <h3 className="text-3xl font-bold mb-3">Поддержка 24/7</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Наша команда работает круглосуточно, чтобы помочь вам решить любые вопросы.
                Среднее время ответа — 5 минут.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-gray-800 px-6 py-3 rounded-lg">
                  <div className="text-sm text-gray-400">Средний ответ</div>
                  <div className="text-xl font-bold text-purple-400">5 мин</div>
                </div>
                <div className="bg-gray-800 px-6 py-3 rounded-lg">
                  <div className="text-sm text-gray-400">Решение проблем</div>
                  <div className="text-xl font-bold text-green-400">98%</div>
                </div>
                <div className="bg-gray-800 px-6 py-3 rounded-lg">
                  <div className="text-sm text-gray-400">Рейтинг</div>
                  <div className="text-xl font-bold text-yellow-400">4.9/5</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h3 className="text-3xl font-bold mb-8 text-center">Частые вопросы</h3>
            <div className="space-y-4">
              <details className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <summary className="font-semibold cursor-pointer text-lg">
                  Как быстро я получу товар?
                </summary>
                <p className="mt-4 text-gray-400">
                  После подтверждения оплаты администратором, товар доставляется в течение 2-5 минут.
                  Вы получите код на email или в Telegram (в зависимости от указанных контактов).
                </p>
              </details>

              <details className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <summary className="font-semibold cursor-pointer text-lg">
                  Какие способы оплаты доступны?
                </summary>
                <p className="mt-4 text-gray-400">
                  Мы принимаем оплату через криптовалюту (TON Network) и карты российских банков
                  (Сбербанк, Тинькофф, ВТБ и др.). Выберите удобный способ при оформлении заказа.
                </p>
              </details>

              <details className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <summary className="font-semibold cursor-pointer text-lg">
                  Что делать если код не работает?
                </summary>
                <p className="mt-4 text-gray-400">
                  Сразу напишите в поддержку в Telegram (@neymaryshop) с номером заказа.
                  Мы заменим код или вернём деньги в течение 24 часов.
                </p>
              </details>

              <details className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <summary className="font-semibold cursor-pointer text-lg">
                  Можно ли заказать оптом?
                </summary>
                <p className="mt-4 text-gray-400">
                  Да! Для оптовых заказов (от 10 товаров) напишите на email support@neymaryshop.ton
                  или в Telegram. Мы предоставим специальные условия и скидки.
                </p>
              </details>
            </div>
          </div>
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
            <Link href="/catalog" className="hover:text-white">Каталог</Link>
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