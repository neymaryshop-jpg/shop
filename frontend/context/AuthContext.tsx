'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface User {
  id: number
  email: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, passwordHash: string) => Promise<void>
  register: (email: string, passwordHash: string, full_name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const axios = await import('axios')
      const response = await axios.default.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, passwordHash: string) => {
    const axios = await import('axios')
    const response = await axios.default.post(`${API_URL}/auth/login`, {
      email,
      password: passwordHash
    })

    localStorage.setItem('auth_token', response.data.token)
    localStorage.setItem('user_data', JSON.stringify(response.data.user))
    setUser(response.data.user)
  }

  const register = async (email: string, passwordHash: string, full_name: string) => {
    const axios = await import('axios')
    const response = await axios.default.post(`${API_URL}/auth/register`, {
      email,
      password: passwordHash,
      full_name
    })

    localStorage.setItem('auth_token', response.data.token)
    localStorage.setItem('user_data', JSON.stringify(response.data.user))
    setUser(response.data.user)
  }

  const logout = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const axios = await import('axios')
        await axios.default.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
