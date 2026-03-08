import Link from 'next/link'

interface HeaderProps {
  showCart?: boolean
  cartCount?: number
}

export function Header({ showCart = true, cartCount = 0 }: HeaderProps) {
  return (
    <nav className="bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#00ff9d]">
          NeymaryShop
        </Link>

        {/* Cart Icon Only */}
        {showCart && (
          <Link
            href="/cart"
            className="relative text-gray-400 hover:text-[#00ff9d] transition-colors"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#00ff9d] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Header
