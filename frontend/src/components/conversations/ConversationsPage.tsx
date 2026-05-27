'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ExternalLink, X, Clock, Check, UserCheck, Globe } from 'lucide-react';
import { dashboardApi, type AggregatedConversation } from '@/lib/api';

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

export default function ConversationsPage() {
  const [filter, setFilter] = useState<'all' | 'converted' | 'today' | 'week'>('all');
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState<AggregatedConversation | null>(null);

  const { data: convs = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => dashboardApi.allConversations(),
    refetchInterval: 30_000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConv?.id],
    queryFn: () => dashboardApi.messages(selectedConv!.client_id, selectedConv!.id),
    enabled: !!selectedConv,
  });

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#6b5fd4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (convs.length === 0) return <div className="p-6"><EmptyState /></div>;

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
    if (search) return c.client_name.toLowerCase().includes(search.toLowerCase()) || c.visitor_id.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const counts = {
    all: convs.length,
    converted: convs.filter(c => c.is_lead).length,
    today: convs.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length,
    week: convs.filter(c => { const w = new Date(); w.setDate(w.getDate() - 7); return new Date(c.created_at) >= w; }).length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Диалоги</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
          Все переписки AI-виджетов · {convs.length} диалогов
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
                <div className="flex items-center gap-2">
                  <p className="text-sm" style={{ color: '#374151' }}>Посетитель {conv.visitor_id.slice(0, 8)}</p>
                  <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded"
                    style={{ background: '#f0f0f5', color: '#6b5fd4' }}>
                    <Globe style={{ width: 10, height: 10 }} />
                    {conv.client_name}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                {conv.is_lead
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
              {messages.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>Загрузка сообщений...</p>
              ) : (messages as any[]).map((msg, i) => (
                <div key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                    style={{
                      background: msg.role === 'user' ? '#6b5fd4' : '#f3f4f6',
                      color: msg.role === 'user' ? '#fff' : '#374151',
                    }}>
                    {msg.content}
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
