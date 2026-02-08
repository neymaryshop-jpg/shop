import { AuthProvider } from '../context/AuthContext'
import './globals.css'

export const metadata = {
  title: 'NeymaryShop - Пополнение игровых счетов',
  description: 'Быстрое пополнение через TON Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
