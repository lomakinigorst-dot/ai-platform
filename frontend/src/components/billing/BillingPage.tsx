'use client';

import { CreditCard, Zap, TrendingDown, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

const MODULES = [
  { label: 'AI Консультант', days: 45, color: '#60a5fa', used: 45 },
  { label: 'AI Маркетолог',  days: 28, color: '#fb923c', used: 72 },
  { label: 'AI Atlas',       days: 60, color: '#a78bfa', used: 20 },
];

const TRANSACTIONS = [
  { date: '27.05.2026', desc: 'Пополнение баланса',       amount: '+5 000 ₽', type: 'in' },
  { date: '25.05.2026', desc: 'AI Консультант — тариф Lite', amount: '−990 ₽',  type: 'out' },
  { date: '20.05.2026', desc: 'AI Маркетолог — тариф Pro',  amount: '−1 490 ₽', type: 'out' },
  { date: '15.05.2026', desc: 'Пополнение баланса',       amount: '+3 000 ₽', type: 'in' },
  { date: '01.05.2026', desc: 'AI Atlas — тариф Lite',    amount: '−490 ₽',  type: 'out' },
];

const PLANS = [
  {
    name: 'Lite',
    price: '990 ₽/мес',
    current: true,
    features: ['1 сайт', 'до 500 диалогов/мес', 'Базовый RAG', 'Email уведомления'],
  },
  {
    name: 'Pro',
    price: '2 490 ₽/мес',
    current: false,
    features: ['до 10 сайтов', 'до 5 000 диалогов/мес', 'Продвинутый RAG', 'Telegram интеграция', 'Приоритетная поддержка'],
  },
  {
    name: 'Mega AI',
    price: '5 990 ₽/мес',
    current: false,
    features: ['Безлимит сайтов', 'Безлимит диалогов', 'Все AI-блоки', 'White-label', 'Персональный менеджер'],
  },
];

export default function BillingPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Баланс и подписка</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Управление тарифом, пополнение баланса и история платежей</p>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1a1535 0%, #2d2060 100%)', color: '#fff' }}>
        <div>
          <p className="text-sm opacity-60 mb-1">Баланс платформы</p>
          <p className="text-4xl font-bold mb-1">₽ 2 450</p>
          <p className="text-sm opacity-60">Прогноз расхода — на ~32 дня при текущей нагрузке</p>
          <div className="flex gap-4 mt-3">
            {MODULES.map(m => (
              <div key={m.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span className="text-xs opacity-75">{m.label}</span>
                <span className="text-xs font-semibold">~{m.days} дн.</span>
              </div>
            ))}
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex-shrink-0"
          style={{ background: '#6b5fd4' }}
        >
          <Plus className="w-4 h-4" />
          Пополнить баланс
        </button>
      </div>

      {/* Module usage */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Расход по модулям</h2>
        <div className="space-y-3">
          {MODULES.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: '#374151' }}>{m.label}</span>
                <span style={{ color: '#6b7280' }}>~{m.days} дней осталось</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: '#f3f4f6' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${100 - m.used}%`, background: m.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>Тарифы AI Консультанта</h2>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="rounded-xl p-4 relative"
              style={{
                background: plan.current ? '#f5f3ff' : '#fff',
                border: `1px solid ${plan.current ? '#6b5fd4' : '#f0f0f5'}`,
              }}
            >
              {plan.current && (
                <div className="absolute -top-2.5 left-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#6b5fd4' }}>
                    Текущий
                  </span>
                </div>
              )}
              <p className="font-bold text-base mb-0.5" style={{ color: '#111827' }}>{plan.name}</p>
              <p className="text-lg font-semibold mb-3" style={{ color: '#6b5fd4' }}>{plan.price}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs" style={{ color: '#374151' }}>
                    <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: '#10b981' }} />
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button
                  className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: '#f3f4f6', color: '#374151' }}
                >
                  Перейти
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>История операций</h2>
        <div className="space-y-0">
          {TRANSACTIONS.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid #f9fafb' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.type === 'in' ? '#d1fae5' : '#fef3c7' }}
                >
                  {t.type === 'in'
                    ? <Plus className="w-4 h-4" style={{ color: '#10b981' }} />
                    : <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  }
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#111827' }}>{t.desc}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{t.date}</p>
                </div>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: t.type === 'in' ? '#10b981' : '#374151' }}
              >
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
