'use client';

import { useState } from 'react';
import {
  MessageSquare, Ticket, ChevronRight, AlertCircle,
  Clock, CheckCircle2, Loader2, X,
} from 'lucide-react';
import { DEMO_SUPPORT_TICKETS, DEMO_CLIENTS } from '@/lib/demo-data';
import { timeAgo } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TicketStatus = 'open' | 'in_progress' | 'closed';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:    { label: 'Низкий',   color: '#9ca3af' },
  medium: { label: 'Средний',  color: '#f97316' },
  high:   { label: 'Высокий',  color: '#ef4444' },
  urgent: { label: 'Срочный',  color: '#dc2626' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: 'Открыт',     color: '#3b82f6', icon: MessageSquare },
  in_progress: { label: 'В работе',   color: '#f97316', icon: Loader2 },
  closed:      { label: 'Закрыто',    color: '#10b981', icon: CheckCircle2 },
};

export default function SupportPage() {
  const [tab, setTab] = useState<'my' | 'clients'>('my');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Общая поддержка');
  const [relatedClient, setRelatedClient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setSubject(''); setMessage('');
      setTimeout(() => setSent(false), 4000);
    }, 1500);
  };

  const tickets = DEMO_SUPPORT_TICKETS;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Поддержка</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>Создайте заявку или посмотрите историю обращений</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: '#f0f0f5' }}>
        {[
          { id: 'my' as const,      label: 'Мои запросы' },
          { id: 'clients' as const, label: 'Тикеты клиентов' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={{
              color: tab === t.id ? '#6b5fd4' : '#6b7280',
              borderBottom: tab === t.id ? '2px solid #6b5fd4' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my' && (
        <>
          {/* Form */}
          <div
            className="rounded-xl p-5 mb-5"
            style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: '#111827' }}>Отправить заявку</h2>

            {sent && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 text-sm"
                style={{ background: '#d1fae5', color: '#065f46' }}>
                <CheckCircle2 style={{ width: 15, height: 15 }} />
                Заявка отправлена! Ответим в течение 5 минут.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Тема</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Кратко опишите проблему"
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e5e7eb' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Приоритет</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Категория</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <option>Общая поддержка</option>
                    <option>Техническая поддержка</option>
                    <option>Финансовый вопрос</option>
                    <option>Feature Request</option>
                    <option>Баг</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Связанный клиент</label>
                  <select
                    value={relatedClient}
                    onChange={e => setRelatedClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <option value="">—</option>
                    {DEMO_CLIENTS.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>Сообщение</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Опишите вашу проблему или вопрос..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: '#e5e7eb' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
              className="mt-4 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#6b5fd4' }}
            >
              {sending ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : null}
              {sending ? 'Отправляем...' : 'Отправить'}
            </button>
          </div>

          {/* Tickets history */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: '#f3f4f6' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>Недавние заявки на поддержку</h2>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>История ваших запросов в поддержку</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafaf9' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Тема</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Статус</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Приоритет</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Обновлено</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => {
                  const st = STATUS_CONFIG[t.status as TicketStatus];
                  const pr = PRIORITY_CONFIG[t.priority as Priority];
                  const Icon = st.icon;
                  return (
                    <tr key={t.id} className="hover:bg-[#fafaf9] transition-colors"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium" style={{ color: '#111827' }}>{t.subject}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                          #{t.id.replace('ticket-', '')} · {t.category} · {t.related_client}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: st.color }}>
                          <Icon style={{ width: 11, height: 11 }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium" style={{ color: pr.color }}>
                        {pr.label}
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: '#9ca3af' }}>
                        {timeAgo(t.updated_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button className="text-xs font-medium" style={{ color: '#6b5fd4' }}
                          onClick={() => alert(`Тикет: ${t.subject}\n\n${t.message}`)}>
                          Просмотр деталей
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'clients' && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: '#fff', border: '1px solid #f0f0f5' }}
        >
          <Ticket className="w-10 h-10 mx-auto mb-3" style={{ color: '#e5e7eb' }} />
          <p className="text-sm font-medium" style={{ color: '#374151' }}>Тикеты клиентов</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            Здесь будут отображаться обращения в поддержку от ваших клиентов
          </p>
          <div className="mt-4 text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1"
            style={{ background: '#ede9ff', color: '#6b5fd4' }}>
            Скоро
          </div>
        </div>
      )}
    </div>
  );
}
