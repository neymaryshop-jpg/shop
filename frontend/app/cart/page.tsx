'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface CartItem {
  id: number
  product_id: number
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  platform: string
}

interface Product {
  id: number
  name: string
  price_android: number
  price_pc: number
  price_ios: number
  image_url?: string
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadCart()
    loadProducts()
  }, [])

  const loadCart = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await axios.get(`${API_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setCartItems(response.data.items || [])
    } catch (error: any) {
      setError(error.response?.data?.message || 'Не удалось загрузить корзину')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`)
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(new Set([...updating, itemId]))

    try {
      const token = localStorage.getItem('auth_token')
      const item = cartItems.find(i => i.id === itemId)
      
      if (!item) return

      await axios.put(`${API_URL}/cart/update`, 
        { 
          product_id: item.product_id, 
          quantity: newQuantity,
          platform: item.platform
        },
        { headers: { 'Authorization': `Bearer ${token}` }}
      )
      
      await loadCart()
    } catch (error) {
      console.error('Error updating cart:', error)
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const removeItem = async (itemId: number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const item = cartItems.find(i => i.id === itemId)
      
      if (!item) return

      await axios.delete(`${API_URL}/cart/remove`, 
        { 
          data: { product_id: item.product_id, platform: item.platform },
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      await loadCart()
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.subtotal * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-400">Загрузка корзины...</p>
        </div>
      </div>
    )
  }

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
              🛒 Корзина ({getTotalItems()})
            </Link>
            <Link href="/contacts" className="text-gray-300 hover:text-white">
              Контакты
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Корзина</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-4">Корзина пуста</h2>
            <p className="text-gray-400 mb-8">Добавьте товары из каталога</p>
            <Link 
              href="/catalog" 
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-all inline-block"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = products.find(p => p.id === item.product_id)
                  
                  return (
                    <div key={item.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg flex items-center justify-center">
                          {product?.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={item.product_name} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-3xl">🎮</div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2">{item.product_name}</h3>
                          <div className="text-sm text-gray-400 mb-3">
                            {formatPrice(item.product_price)} ₽ × {item.quantity}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating.has(item.id)}
                              className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 disabled:opacity-50"
                            >
                              −
                            </button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating.has(item.id)}
                              className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center hover:bg-gray-600 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Платформа: {item.platform}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-purple-400 mb-4">
                            {formatPrice(item.subtotal * item.quantity)} ₽
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Итого</h2>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-gray-400">
                    <span>Товары ({getTotalItems()} шт.):</span>
                    <span className="text-white">{formatPrice(getTotalPrice())} ₽</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Доставка:</span>
                    <span className="text-green-400">Бесплатно</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>К оплате:</span>
                      <span className="text-purple-400">{formatPrice(getTotalPrice())} ₽</span>
                    </div>
                  </div>
                </div>

                <Link 
                  href="/checkout"
                  className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-all block text-center mb-3"
                >
                  Оформить заказ
                </Link>
                
                <Link 
                  href="/catalog"
                  className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-all block text-center"
                >
                  Продолжить покупки
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}