import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-gray-900 py-8 px-4 mt-auto">
      <div className="container mx-auto text-center">
        {/* Brand */}
        <div className="text-2xl font-bold text-[#00ff9d] mb-4">NeymaryShop</div>
        <p className="text-gray-500 text-sm mb-6">
          Цифровые товары с мгновенной доставкой
        </p>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm mb-6">
          <Link href="/catalog" className="text-gray-400 hover:text-[#00ff9d] transition-colors">
            Каталог
          </Link>
          <Link href="/legal/terms" className="text-gray-400 hover:text-[#00ff9d] transition-colors">
            Соглашение
          </Link>
          <Link href="/legal/privacy" className="text-gray-400 hover:text-[#00ff9d] transition-colors">
            Политика
          </Link>
          <a
            href="https://t.me/neymaryshop_support"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#00ff9d] transition-colors"
          >
            Поддержка
          </a>
          <a
            href="https://t.me/neymaryshop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#00ff9d] transition-colors"
          >
            Telegram канал
          </a>
        </div>

        {/* Owner info */}
        <div className="text-gray-600 text-xs mb-2">
          © 2021-2026 NeymaryShop. Все права защищены.
        </div>
        <div className="text-gray-700 text-xs">
          Владелец: ИП Ионцев К.К. (сделка между физическими лицами)
        </div>
        <div className="text-gray-800 text-xs mt-1">
          Origin: Web
        </div>
      </div>
    </footer>
  )
}

export default Footer
