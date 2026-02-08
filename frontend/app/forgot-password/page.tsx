'use client'

import { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      setMessage('Инструкции по восстановлению пароля отправлены на ваш email')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка при отправке запроса')
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
            <p className="text-gray-400">Восстановление пароля</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-6 text-green-400">
              {message}
            </div>
          )}

          {!message && (
            <>
              <p className="text-gray-400 mb-6 text-center">
                Введите ваш email, и мы отправим вам инструкции по восстановлению пароля
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Отправка...' : 'Отправить инструкции'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
