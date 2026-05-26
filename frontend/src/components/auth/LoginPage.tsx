'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      document.cookie = `token=${data.access_token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('agent_email', data.email);
      router.push('/');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--rail-bg)' }}
    >
      {/* Left: branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--primary)' }}
          >
            A
          </div>
          <span className="text-white font-bold text-base">ATLAS</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Платформа для<br />
            AI-ассистентов
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.6 }}>
            Управляйте AI-консультантами для ваших клиентов.
            ДНК-анализ, база знаний, лиды — всё в одном месте.
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-3">
          {[
            { dot: '#a78bfa', text: 'Автоматический ДНК-анализ сайта' },
            { dot: '#60a5fa', text: 'SSE-стриминг диалогов в реальном времени' },
            { dot: '#4ade80', text: 'RAG: база знаний на pgvector' },
          ].map(({ dot, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ background: 'var(--bg)' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'var(--primary)' }}
            >
              A
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text)' }}>ATLAS</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            Вход
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
            Агентский кабинет
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text)' }}
              >
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm border"
                style={{
                  background: 'var(--danger-light)',
                  borderColor: '#fca5a5',
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition-opacity flex items-center justify-center gap-2 mt-2"
              style={{
                background: 'var(--primary)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
