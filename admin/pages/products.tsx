import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/AdminProducts.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price_android: number;
  price_pc: number;
  price_ios: number;
  category_id: number;
  category_name?: string;
  image_url?: string;
  is_active: boolean;
  delivery_type: 'auto' | 'manual';
  stock_quantity: number;
}

export default function AdminProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  // Модальные окна
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | Category | null>(null);

  // Формы
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price_android: 0,
    price_pc: 0,
    price_ios: 0,
    category_id: 0,
    image_url: '',
    delivery_type: 'auto' as 'auto' | 'manual',
    stock_quantity: 0
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon_url: '📦',
    sort_order: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err: any) {
      setError('Ошибка загрузки данных');
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  // Категории CRUD
  const handleAddCategory = () => {
    setEditingItem(null);
    setCategoryForm({ name: '', slug: '', description: '', icon_url: '📦', sort_order: 0 });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingItem(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon_url: category.icon_url || '📦',
      sort_order: category.sort_order
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (editingItem) {
        await axios.put(`${API_URL}/admin/categories/${editingItem.id}`, categoryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/categories`, categoryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      setError('Ошибка удаления');
    }
  };

  // Товары CRUD
  const handleAddProduct = () => {
    setEditingItem(null);
    setProductForm({
      name: '',
      description: '',
      price_android: 0,
      price_pc: 0,
      price_ios: 0,
      category_id: categories[0]?.id || 0,
      image_url: '',
      delivery_type: 'auto',
      stock_quantity: 0
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingItem(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price_android: product.price_android,
      price_pc: product.price_pc,
      price_ios: product.price_ios,
      category_id: product.category_id,
      image_url: product.image_url || '',
      delivery_type: product.delivery_type,
      stock_quantity: product.stock_quantity
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (editingItem) {
        await axios.put(`${API_URL}/admin/products/${editingItem.id}`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/products`, productForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowProductModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      setError('Ошибка удаления');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/';
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📦 Управление товарами</h1>
        <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'products' ? styles.active : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Товары ({products.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Категории ({categories.length})
        </button>
      </div>

      {/* Товары */}
      {activeTab === 'products' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Все товары</h2>
            <button onClick={handleAddProduct} className={styles.addBtn}>+ Добавить</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена (Android)</th>
                <th>Доставка</th>
                <th>Остаток</th>
                <th>Активен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category_name}</td>
                  <td>{product.price_android} ₽</td>
                  <td>
                    <span className={product.delivery_type === 'auto' ? styles.badgeAuto : styles.badgeManual}>
                      {product.delivery_type === 'auto' ? '🔄 Авто' : '👤 Ручная'}
                    </span>
                  </td>
                  <td>{product.stock_quantity}</td>
                  <td>{product.is_active ? '✅' : '❌'}</td>
                  <td>
                    <button onClick={() => handleEditProduct(product)} className={styles.editBtn}>✏️</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className={styles.deleteBtn}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Категории */}
      {activeTab === 'categories' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Все категории</h2>
            <button onClick={handleAddCategory} className={styles.addBtn}>+ Добавить</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Иконка</th>
                <th>Название</th>
                <th>Slug</th>
                <th>Сортировка</th>
                <th>Активна</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.icon_url || '📦'}</td>
                  <td>{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.sort_order}</td>
                  <td>{cat.is_active ? '✅' : '❌'}</td>
                  <td>
                    <button onClick={() => handleEditCategory(cat)} className={styles.editBtn}>✏️</button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className={styles.deleteBtn}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка товара */}
      {showProductModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingItem ? 'Редактировать товар' : 'Новый товар'}</h2>
            <div className={styles.form}>
              <input
                placeholder="Название"
                value={productForm.name}
                onChange={e => setProductForm({...productForm, name: e.target.value})}
              />
              <textarea
                placeholder="Описание"
                value={productForm.description}
                onChange={e => setProductForm({...productForm, description: e.target.value})}
              />
              <div className={styles.row}>
                <input
                  type="number"
                  placeholder="Цена Android"
                  value={productForm.price_android}
                  onChange={e => setProductForm({...productForm, price_android: parseFloat(e.target.value)})}
                />
                <input
                  type="number"
                  placeholder="Цена PC"
                  value={productForm.price_pc}
                  onChange={e => setProductForm({...productForm, price_pc: parseFloat(e.target.value)})}
                />
                <input
                  type="number"
                  placeholder="Цена iOS"
                  value={productForm.price_ios}
                  onChange={e => setProductForm({...productForm, price_ios: parseFloat(e.target.value)})}
                />
              </div>
              <select
                value={productForm.category_id}
                onChange={e => setProductForm({...productForm, category_id: parseInt(e.target.value)})}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={productForm.delivery_type}
                onChange={e => setProductForm({...productForm, delivery_type: e.target.value as 'auto' | 'manual'})}
              >
                <option value="auto">🔄 Автовыдача (код)</option>
                <option value="manual">👤 Ручная (вход в аккаунт)</option>
              </select>
              <input
                type="number"
                placeholder="Остаток на складе"
                value={productForm.stock_quantity}
                onChange={e => setProductForm({...productForm, stock_quantity: parseInt(e.target.value)})}
              />
              <input
                placeholder="URL изображения"
                value={productForm.image_url}
                onChange={e => setProductForm({...productForm, image_url: e.target.value})}
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleSaveProduct} className={styles.saveBtn}>Сохранить</button>
              <button onClick={() => setShowProductModal(false)} className={styles.cancelBtn}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка категории */}
      {showCategoryModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{editingItem ? 'Редактировать категорию' : 'Новая категория'}</h2>
            <div className={styles.form}>
              <input
                placeholder="Название"
                value={categoryForm.name}
                onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
              />
              <input
                placeholder="Slug (url)"
                value={categoryForm.slug}
                onChange={e => setCategoryForm({...categoryForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
              />
              <textarea
                placeholder="Описание"
                value={categoryForm.description}
                onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
              />
              <input
                placeholder="Иконка (эмодзи)"
                value={categoryForm.icon_url}
                onChange={e => setCategoryForm({...categoryForm, icon_url: e.target.value})}
              />
              <input
                type="number"
                placeholder="Порядок сортировки"
                value={categoryForm.sort_order}
                onChange={e => setCategoryForm({...categoryForm, sort_order: parseInt(e.target.value)})}
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleSaveCategory} className={styles.saveBtn}>Сохранить</button>
              <button onClick={() => setShowCategoryModal(false)} className={styles.cancelBtn}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
