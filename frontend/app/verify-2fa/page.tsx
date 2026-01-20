'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Компонент формы, который использует useSearchParams
function Verify2FAFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  useEffect(() => {
    const id = searchParams.get('userId') || localStorage.getItem('2fa_userId');
    if (!id) {
      router.push('/login');
      return;
    }
    setUserId(parseInt(id as string));
  }, [searchParams, router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && !showBackup) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newCode = [...code];
      digits.forEach((digit, index) => {
        if (index < 6) newCode[index] = digit;
      });
      setCode(newCode);
      
      setTimeout(() => handleSubmit(pastedData), 100);
    }
  };

  const handleSubmit = async (codeValue?: string) => {
    const verificationCode = codeValue || code.join('');
    
    if (!userId || verificationCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('temp_auth_token');
      
      const response = await axios.post(
        `${API_URL}/auth/2fa/verify`,
        {
          userId,
          token: verificationCode
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.removeItem('temp_auth_token');
        localStorage.removeItem('2fa_userId');

        if (response.data.user?.isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Неверный код. Попробуйте снова.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        setError('Слишком много попыток. Подождите 15 минут.');
      } else {
        setError(error.response?.data?.error || 'Ошибка верификации');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackupSubmit = async () => {
    if (!userId || !backupCode.trim()) {
      setError('Введите backup код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/2fa/verify-backup`, {
        userId,
        backupCode: backupCode.trim().toUpperCase()
      });

      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.removeItem('temp_auth_token');
        localStorage.removeItem('2fa_userId');

        if (response.data.user?.isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Неверный backup код');
        setBackupCode('');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ошибка верификации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Двухфакторная аутентификация
            </h1>
            <p className="text-gray-400">
              Введите код из приложения Google Authenticator
            </p>
          </div>

          {!showBackup ? (
            <>
              <div className="mb-8">
                <div className="flex justify-center gap-3 mb-6">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        if (el) {
                          inputRefs.current[index] = el;
                        }
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-14 h-14 text-center text-2xl font-bold bg-gray-900 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none text-white"
                      autoFocus={index === 0}
                      disabled={loading}
                    />
                  ))}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || code.some(d => !d)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Проверка...' : 'Подтвердить'}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowBackup(true)}
                  className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  Использовать backup код
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">
                  Backup код (8 символов)
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-white uppercase"
                  maxLength={8}
                  disabled={loading}
                />
                <p className="text-gray-500 text-xs mt-2">
                  Каждый backup код можно использовать только один раз
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleBackupSubmit}
                  disabled={loading || !backupCode.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Проверка...' : 'Использовать backup код'}
                </button>
                <button
                  onClick={() => setShowBackup(false)}
                  className="w-full text-gray-400 hover:text-white py-2 text-sm transition-colors"
                >
                  ← Вернуться к коду из приложения
                </button>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="space-y-3 text-sm text-gray-500">
              <p className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Код обновляется каждые 30 секунд
              </p>
              <p className="flex items-center gap-2">
                <span className="text-yellow-400">⚠</span>
                Backup коды храните в безопасном месте
              </p>
              <p className="flex items-center gap-2">
                <span className="text-blue-400">ⓘ</span>
                При утере всех backup кодов обратитесь в поддержку
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Главный компонент страницы
export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Загрузка...</h1>
              <p className="text-gray-400">Пожалуйста, подождите</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <Verify2FAFormContent />
    </Suspense>
  );
}