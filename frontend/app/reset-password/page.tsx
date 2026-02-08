'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { hashPassword } from '../../utils/passwordHash'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const resetToken = searchParams.get('token')
    if (resetToken) {
      setToken(resetToken)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      setLoading(false)
      return
    }

    try {
      const passwordHash = await hashPassword(password)
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        password: passwordHash
      })
      setMessage('Пароль успешно изменён! Теперь вы можете войти.')
      setTimeout(() => router.push('/login'), 2000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Ошибка при сбросе пароля')
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
            <p className="text-gray-400">Сброс пароля</p>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Новый пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Повторите пароль"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Сохранение...' : 'Изменить пароль'}
              </button>
            </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Загрузка...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
