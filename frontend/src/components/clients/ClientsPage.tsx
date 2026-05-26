'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { statusColor, statusLabel, modeLabel, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Plus, Globe, Bot, ChevronRight, Zap, MessageSquare, Users2 } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; color: string; label: string }> = {
    active:   { bg: 'var(--success-light)', color: 'var(--success)', label: 'Активен' },
    indexing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Индексация' },
    pending:  { bg: 'var(--warning-light)', color: 'var(--warning)', label: 'Ожидает' },
    error:    { bg: 'var(--danger-light)', color: 'var(--danger)', label: 'Ошибка' },
  };
  const s = colorMap[status] ?? { bg: 'var(--border-light)', color: 'var(--text-muted)', label: status };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function DNABadge({ status }: { status?: string }) {
  if (!status || status === 'none') return null;
  const map: Record<string, { label: string; color: string; bg: string }> = {
    running: { label: '⟳ ДНК', color: '#7c3aed', bg: '#ede9fe' },
    done:    { label: '✓ ДНК', color: 'var(--success)', bg: 'var(--success-light)' },
    failed:  { label: '✗ ДНК', color: 'var(--danger)', bg: 'var(--danger-light)' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search, statusFilter],
    queryFn: () => clientsApi.list({ search: search || undefined, status: statusFilter || undefined }),
    refetchInterval: 5_000,
  });

  const total = clients?.length ?? 0;
  const activeCount = clients?.filter(c => c.status === 'active').length ?? 0;
  const leadsTotal = clients?.reduce((s, c) => s + (c.leads_used ?? 0), 0) ?? 0;
  const dialogsTotal = clients?.reduce((s, c) => s + (c.dialogs_used ?? 0), 0) ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Клиенты</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {total} клиентов · {activeCount} активных
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="w-4 h-4" />
          Добавить клиента
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Всего клиентов', value: total, icon: Users2, color: '#6b5fd4', bg: 'var(--primary-light)' },
          { label: 'Диалогов', value: dialogsTotal, icon: MessageSquare, color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Лидов', value: leadsTotal, icon: Zap, color: '#f97316', bg: '#ffedd5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: 'var(--surface)', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Поиск по имени или домену..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-xl text-sm px-3 py-2 outline-none"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="indexing">Индексация</option>
          <option value="pending">Ожидают</option>
          <option value="error">Ошибка</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', background: '#fafaf9' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>Клиент</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--text-subtle)' }}>Ассистент</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>Статус</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--text-subtle)' }}>Диалоги / Лиды</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-sm" style={{ color: 'var(--text-subtle)' }}>
                  Загрузка...
                </td>
              </tr>
            )}
            {!isLoading && (!clients || clients.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'var(--primary-light)' }}
                  >
                    <Bot className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Клиентов не найдено</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Добавьте первого клиента</p>
                </td>
              </tr>
            )}
            {clients?.map((client, i) => (
              <tr
                key={client.id}
                className="transition-colors group"
                style={{
                  borderTop: i === 0 ? 'none' : `1px solid var(--border-light)`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 text-sm font-bold"
                      style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                      }}
                    >
                      {client.assistant_avatar_url ? (
                        <img src={client.assistant_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (client.assistant_name?.[0] ?? 'A').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{client.name}</div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
                        <Globe className="w-3 h-3" />
                        {client.domain}
                        <span className="ml-1" style={{ color: 'var(--border)' }}>·</span>
                        {timeAgo(client.created_at)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <div className="text-sm" style={{ color: 'var(--text)' }}>{client.assistant_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>{modeLabel(client.assistant_mode)}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={client.status} />
                    <DNABadge status={(client as any).marketing_status} />
                    {client.status === 'indexing' && (
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${client.index_progress}%`, background: 'var(--primary)' }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                  <div className="text-sm" style={{ color: 'var(--text)' }}>
                    {client.dialogs_used}
                    <span style={{ color: 'var(--text-subtle)' }}>/{client.dialogs_limit}</span>
                    <span className="mx-2" style={{ color: 'var(--border)' }}>·</span>
                    {client.leads_used}
                    <span style={{ color: 'var(--text-subtle)' }}>/{client.leads_limit}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                    style={{ color: 'var(--primary)' }}
                  >
                    Открыть
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
