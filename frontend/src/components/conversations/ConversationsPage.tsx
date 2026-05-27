'use client';

import { useState } from 'react';
import { MessageSquare, ExternalLink, X, Clock, Check, UserCheck } from 'lucide-react';
import { PARTNER_WIDGET } from '@/lib/demo-data';

const PARTNER_HAS_WIDGET = true;

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#ede9ff' }}>
        <MessageSquare className="w-8 h-8" style={{ color: '#6b5fd4' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#111827' }}>Виджет не подключён</h3>
      <p className="text-sm max-w-sm mb-5" style={{ color: '#9ca3af' }}>
        Установите виджет Atlas на свой сайт, чтобы здесь отображались диалоги с посетителями.
      </p>
      <a href="/settings"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#6b5fd4' }}>
        <ExternalLink className="w-4 h-4" />
        Установить виджет
      </a>
    </div>
  );
}

type Conv = typeof PARTNER_WIDGET.conversations[0];

const DEMO_MESSAGES: Record<string, { role: 'user' | 'ai'; text: string }[]> = {
  'pc-1': [
    { role: 'user', text: 'Добрый день! Расскажите о тарифах для агентств' },
    { role: 'ai',   text: 'Здравствуйте! У нас есть несколько тарифных планов для агентств: Starter (до 5 клиентов), Pro (до 20 клиентов) и Enterprise (без ограничений). Стоимость зависит от количества клиентов и подключённых AI-блоков. Сейчас актуальна скидка 20% при оплате за 3 месяца. Подскажите, сколько у вас клиентов планируется?' },
    { role: 'user', text: 'У меня около 10 клиентов сейчас, планирую расти до 30' },
    { role: 'ai',   text: 'Отлично! Для 10 клиентов подойдёт тариф Pro, а при росте до 30 — Enterprise. Я могу записать вас на демонстрацию, где покажем возможности платформы на реальных примерах. Как вас зовут и какой мессенджер предпочитаете?' },
  ],
  'pc-2': [
    { role: 'user', text: 'Сколько клиентских сайтов можно подключить к одному кабинету?' },
    { role: 'ai',   text: 'В зависимости от тарифа: Starter — до 5 сайтов, Pro — до 20, Enterprise — без ограничений. Каждый сайт получает свой виджет с отдельной базой знаний и настройками AI-консультанта.' },
    { role: 'user', text: 'А можно ли разным менеджерам давать доступ только к определённым клиентам?' },
    { role: 'ai',   text: 'Да, это стандартная функция управления командой. Вы можете добавить сотрудников с ролями Manager, Integrator или Sales Manager и настроить доступ к конкретным клиентам или ко всем сразу.' },
  ],
};

export default function ConversationsPage() {
  const [filter, setFilter] = useState<'all' | 'converted' | 'today' | 'week'>('all');
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState<Conv | null>(null);

  if (!PARTNER_HAS_WIDGET) return <div className="p-6"><EmptyState /></div>;

  const convs = PARTNER_WIDGET.conversations;

  const filtered = convs.filter(c => {
    if (filter === 'converted') return c.is_lead;
    if (filter === 'today') {
      const today = new Date().toDateString();
      return new Date(c.created_at).toDateString() === today;
    }
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.created_at) >= weekAgo;
    }
    if (search) return c.preview.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const counts = {
    all: convs.length,
    converted: convs.filter(c => c.is_lead).length,
    today: convs.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length,
    week: convs.length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Мои диалоги</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
          Переписки AI-виджета на{' '}
          <span className="font-medium" style={{ color: '#6b5fd4' }}>atlasai.ru</span>
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {([
          ['all', 'Всего', counts.all, '#6b5fd4', '#ede9ff'],
          ['converted', 'В лиды', counts.converted, '#10b981', '#d1fae5'],
          ['today', 'Сегодня', counts.today, '#3b82f6', '#dbeafe'],
          ['week', 'За неделю', counts.week, '#f97316', '#ffedd5'],
        ] as const).map(([f, label, count, color, bg]) => (
          <button key={f} onClick={() => setFilter(f as any)}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: filter === f ? bg : '#fff',
              border: `1px solid ${filter === f ? color + '44' : '#f0f0f5'}`,
            }}>
            <div className="text-xl font-bold" style={{ color }}>{count}</div>
            <div className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по тексту диалога..."
          value={search}
          onChange={e => { setSearch(e.target.value); setFilter('all'); }}
          className="w-full px-4 py-2 rounded-xl border text-sm outline-none"
          style={{ borderColor: '#e5e7eb' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
        />
      </div>

      {/* Conversations list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl py-10 text-center"
            style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Диалогов нет</p>
          </div>
        )}
        {filtered.map(conv => (
          <div key={conv.id}
            className="rounded-xl px-4 py-3.5 cursor-pointer hover:shadow-md transition-all"
            style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            onClick={() => setSelectedConv(conv)}>
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: conv.is_lead ? '#d1fae5' : '#f3f4f6', color: conv.is_lead ? '#10b981' : '#9ca3af' }}>
                {conv.is_lead ? <UserCheck style={{ width: 15, height: 15 }} /> : <MessageSquare style={{ width: 15, height: 15 }} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs" style={{ color: '#9ca3af' }}>
                    {new Date(conv.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>
                    · {conv.message_count} сообщений
                  </span>
                  {conv.utm_source && (
                    <span className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                      {conv.utm_source}
                    </span>
                  )}
                  {conv.is_lead && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#d1fae5', color: '#10b981' }}>
                      → Лид
                    </span>
                  )}
                </div>
                <p className="text-sm line-clamp-1" style={{ color: '#374151' }}>{conv.preview}</p>
              </div>

              <div className="flex-shrink-0">
                {conv.resolved
                  ? <Check style={{ width: 14, height: 14, color: '#10b981' }} />
                  : <Clock style={{ width: 14, height: 14, color: '#9ca3af' }} />
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelectedConv(null)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
              style={{ borderColor: '#f3f4f6' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#111827' }}>Диалог</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  {new Date(selectedConv.created_at).toLocaleString('ru-RU')} · {selectedConv.message_count} сообщений
                  {selectedConv.is_lead && ' · Конвертирован в лид'}
                </p>
              </div>
              <button onClick={() => setSelectedConv(null)}>
                <X style={{ width: 18, height: 18, color: '#9ca3af' }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {(DEMO_MESSAGES[selectedConv.id] ?? [
                { role: 'user' as const, text: selectedConv.preview },
                { role: 'ai' as const, text: 'Здравствуйте! Рад помочь. Уточните, пожалуйста, ваш вопрос подробнее.' },
              ]).map((msg, i) => (
                <div key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                    style={{
                      background: msg.role === 'user' ? '#6b5fd4' : '#f3f4f6',
                      color: msg.role === 'user' ? '#fff' : '#374151',
                    }}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
