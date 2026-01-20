'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Типы данных
interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  price_android: number;
  price_pc: number;
  price_ios: number;
  image_url?: string;
  stock_quantity: number;
  sales_count: number;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon_url?: string;
  is_active: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  details: {
    address?: string;
    network?: string;
    card_number?: string;
    card_holder?: string;
    bank_name?: string;
  };
}

interface Order {
  id: number;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items?: any[];
}

// API базовый URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Компонент карточки товара
function ProductCard({ product, platform, onClick }: {
  product: Product;
  platform: string;
  onClick: () => void;
}) {
  const price = product[`price_${platform}` as keyof Product] as number;

  // Определяем иконку по категории
  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, string> = {
      'Игры': '🎮',
      'Подписки': '📺',
      'Валюта': '💰',
      'Аккаунты': '👤',
      'ПО': '💻',
      'Стриминг': '🎵'
    };
    return icons[categoryName] || '📦';
  };

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 hover:from-purple-900/30 hover:to-pink-900/30 transition-all transform hover:scale-105 cursor-pointer border border-gray-700 hover:border-purple-500 shadow-lg hover:shadow-purple-500/20"
    >
      <div className="text-5xl mb-4 text-center">
        {getCategoryIcon(product.category_name)}
      </div>
      <h3 className="font-bold text-white mb-2 text-base line-clamp-2 min-h-[3rem]">
        {product.name}
      </h3>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {price.toFixed(2)}₽
        </span>
        <span className="text-xs text-gray-400">
          {product.stock_quantity > 0 ? `В наличии: ${product.stock_quantity}` : 'Под заказ'}
        </span>
      </div>
      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all">
        Купить
      </button>
      {product.sales_count > 0 && (
        <div className="mt-2 text-center text-xs text-gray-500">
          Продано: {product.sales_count}
        </div>
      )}
    </div>
  );
}

// Модальное окно заказа
function OrderModal({
  product,
  onClose,
  paymentMethods
}: {
  product: Product;
  onClose: () => void;
  paymentMethods: PaymentMethod[];
}) {
  const [stage, setStage] = useState('select-payment');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerTelegram, setCustomerTelegram] = useState('');

  // Создание заказа
  const createOrder = async () => {
    try {
      const response = await axios.post(`${API_URL}/orders`, {
        product_id: product.id,
        payment_method: selectedPayment?.id,
        customer_email: customerEmail || undefined,
        customer_telegram: customerTelegram || undefined,
      });

      if (response.data.success) {
        setOrderId(response.data.order_id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating order:', error);
      return false;
    }
  };

  // Подтверждение оплаты
  const confirmPayment = async () => {
    setShowConfirmDialog(false);

    // Создаём заказ если ещё не создан
    if (!orderId) {
      const created = await createOrder();
      if (!created) {
        alert('Ошибка при создании заказа');
        return;
      }
    }

    setStage('awaiting_payment');

    try {
      // Отправляем подтверждение оплаты
      const response = await axios.post(`${API_URL}/orders/${orderId}/confirm-payment`);

      if (response.data.success) {
        setStage('admin_confirming');

        // Подключаемся к WebSocket для получения обновлений
        connectWebSocket();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Ошибка при подтверждении оплаты');
    }
  };

  // WebSocket для real-time обновлений
  const connectWebSocket = () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}?order_id=${orderId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'payment_confirmed') {
        setStage('confirmed');
        setTimeout(() => setStage('processing'), 2000);
      } else if (data.type === 'order_processing') {
        setStage('processing');
      } else if (data.type === 'order_completed') {
        setStage('completed');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    if (!method.enabled) return;
    setSelectedPayment(method);
  };

  const handlePaidClick = () => {
    if (!customerEmail && !customerTelegram) {
      alert('Укажите хотя бы один способ связи (Email или Telegram)');
      return;
    }
    setShowConfirmDialog(true);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-purple-500/30 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{product.name}</h2>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {product.price_android}₽
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">
            &times;
          </button>
        </div>

        {/* Этапы заказа */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['Выбор оплаты', 'Ожидание', 'Проверка', 'Завершение'].map((label, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  ['select-payment', 'awaiting_payment', 'admin_confirming', 'confirmed', 'processing', 'completed'].indexOf(stage) >= idx
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-xs text-gray-400 mt-2 text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Выбор способа оплаты */}
        {stage === 'select-payment' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Контактные данные</h3>
            <div className="space-y-3 mb-6">
              <input
                type="email"
                placeholder="Email (опционально)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Telegram @username (опционально)"
                value={customerTelegram}
                onChange={(e) => setCustomerTelegram(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Выберите способ оплаты</h3>
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentSelect(method)}
                  disabled={!method.enabled}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    method.enabled
                      ? selectedPayment?.id === method.id
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-gray-700 hover:border-purple-500/50 bg-gray-800'
                      : 'border-gray-800 bg-gray-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{method.icon}</span>
                      <div>
                        <div className="font-bold text-white">{method.name}</div>
                        <div className="text-sm text-gray-400">{method.description}</div>
                      </div>
                    </div>
                    {!method.enabled && (
                      <span className="text-sm text-yellow-400 font-semibold">
                        Временно недоступно
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedPayment && selectedPayment.enabled && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-white mb-3">Инструкция по оплате:</h4>
                <div className="text-gray-300 space-y-2 text-sm">
                  {selectedPayment.id === 'crypto' ? (
                    <>
                      <p>1️⃣ Переведите <span className="text-purple-400 font-bold">{product.price_android}₽</span> в TON на адрес:</p>
                      <div className="bg-gray-800 p-3 rounded font-mono text-xs break-all">
                        {selectedPayment.details.address || 'Адрес не указан'}
                      </div>
                      <p>2️⃣ После перевода нажмите кнопку "Я оплатил"</p>
                      <p>3️⃣ Администратор проверит платёж в течение 5-10 минут</p>
                    </>
                  ) : (
                    <>
                      <p>1️⃣ Переведите <span className="text-pink-400 font-bold">{product.price_android}₽</span> на карту:</p>
                      <div className="bg-gray-800 p-3 rounded font-mono text-lg">
                        {selectedPayment.details.card_number || 'Номер не указан'}
                      </div>
                      <p className="text-yellow-400">
                        💳 <b>{selectedPayment.details.bank_name}</b> - {selectedPayment.details.card_holder}
                      </p>
                      <p>2️⃣ После перевода нажмите кнопку "Я оплатил"</p>
                      <p>3️⃣ Администратор проверит платёж в течение 5-10 минут</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handlePaidClick}
              disabled={!selectedPayment || !selectedPayment.enabled}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                selectedPayment && selectedPayment.enabled
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Я оплатил
            </button>
          </div>
        )}

        {/* Подтверждение */}
        {showConfirmDialog && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-xl max-w-md text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Подтвердите оплату</h3>
              <p className="text-gray-300 mb-6">
                Вы уверены, что совершили перевод на сумму{' '}
                <span className="text-purple-400 font-bold">{product.price_android}₽</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmPayment}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold"
                >
                  Да, оплатил
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Статусы заказа */}
        {stage === 'awaiting_payment' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6 animate-bounce">📤</div>
            <h3 className="text-2xl font-bold text-white mb-3">Запрос отправлен!</h3>
            <p className="text-gray-400">Ожидайте, администратор скоро проверит ваш платёж...</p>
          </div>
        )}

        {(stage === 'admin_confirming' || stage === 'confirmed') && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">✅</div>
            <h3 className="text-2xl font-bold text-green-400 mb-3">Платёж получен!</h3>
            <p className="text-gray-400 mb-4">Администратор подтвердил оплату. Готовим ваш заказ...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse" style={{width: '33%'}}></div>
            </div>
          </div>
        )}

        {stage === 'processing' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6 animate-spin">⚙️</div>
            <h3 className="text-2xl font-bold text-blue-400 mb-3">Заказ выполняется</h3>
            <p className="text-gray-400 mb-4">Осталось совсем немного, мы готовим ваш товар...</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '66%'}}></div>
            </div>
          </div>
        )}

        {stage === 'completed' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-2xl font-bold text-purple-400 mb-3">Заказ доставлен!</h3>
            <div className="bg-gray-800 p-6 rounded-xl mb-6">
              <p className="text-gray-400 mb-3">Ваш код активации:</p>
              <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-4 rounded-lg font-mono text-2xl text-white">
                XXXX-XXXX-XXXX-XXXX
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">Код также отправлен на указанные контакты</p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold"
            >
              Отлично, спасибо!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Главный компонент
export default function Homepage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadInitialData();
  }, []);

  // Загрузка товаров при изменении категории или поиска
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Параллельная загрузка всех данных
      const [categoriesRes, paymentMethodsRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/payment-methods`)
      ]);

      setCategories(categoriesRes.data);
      setPaymentMethods(paymentMethodsRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await axios.get(`${API_URL}/products`, { params });
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const filteredProducts = products;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-xl text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Навигация */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl z-40 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NeymaryShop
          </div>
          <div className="hidden md:flex gap-8 text-sm">
            <a href="#catalog" className="hover:text-purple-400 transition-colors">Каталог</a>
            <a href="#how-it-works" className="hover:text-purple-400 transition-colors">Как работает</a>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg font-semibold transition-all">
            Войти
          </button>
        </div>
      </nav>

      {/* Каталог */}
      <section id="catalog" className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Каталог товаров
            </span>
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Быстрая доставка • Гарантия возврата • Поддержка 24/7
          </p>

          {/* Поиск */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="🔍 Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-2xl mx-auto block bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Категории */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Все товары
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Сетка товаров */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                platform="android"
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-xl text-gray-400">Товары не найдены</p>
            </div>
          )}
        </div>
      </section>

      {/* Как это работает */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-5xl font-bold text-center mb-16">Как это работает</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Выберите', desc: 'Найдите товар', icon: '🛒' },
              { num: '2', title: 'Оплатите', desc: 'Крипта или карты', icon: '💳' },
              { num: '3', title: 'Подтвердите', desc: 'Админ проверит', icon: '✅' },
              { num: '4', title: 'Получите', desc: 'Код за 2 минуты', icon: '🎉' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold">
                  {step.num}
                </div>
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 px-4">
        <div className="container mx-auto text-center text-gray-400">
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            NeymaryShop
          </div>
          <p className="mb-4">Быстрые и безопасные покупки цифровых товаров</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white">О нас</a>
            <a href="#" className="hover:text-white">Поддержка</a>
            <a href="#" className="hover:text-white">Telegram</a>
          </div>
          <div className="mt-6 text-xs text-gray-600">
            © 2021-2026 NeymaryShop • Работает на TON Network
          </div>
        </div>
      </footer>

      {/* Модальное окно заказа */}
      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}
