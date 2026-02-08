'use client'

import { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })

      // Сохраняем токен
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user_data', JSON.stringify(response.data.user))

      // Перенаправляем на главную
      window.location.href = '/'
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NeymaryShop
            </h1>
            <p className="text-gray-400">Вход в аккаунт</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300">
                Зарегистрироваться
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-purple-400">
              Забыли пароль?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}