'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import {
  Search, Plus, Globe, Globe2, MessageSquare, UserCheck,
  DollarSign, Wifi, WifiOff, Clock, AlertCircle, ShoppingCart,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type PlanId = 'demo' | 'new' | 'trial' | 'mega' | 'pro';

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Демонстрация': { label: 'Демо', color: '#8b5cf6', bg: '#ede9fe' },
  'Новый':        { label: 'Новый', color: '#10b981', bg: '#d1fae5' },
  'Trial':        { label: 'Trial', color: '#f97316', bg: '#ffedd5' },
  'Mega AI':      { label: 'Mega AI', color: '#6b5fd4', bg: '#ede9ff' },
  'Pro':          { label: 'Pro', color: '#3b82f6', bg: '#dbeafe' },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon style={{ width: 14, height: 14, color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: '#111827' }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: '#9ca3af' }}>{sub}</div>}
    </div>
  );
}

// ─── Health bar ────────────────────────────────────────────────────────────

function HealthBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold w-8 flex-shrink-0" style={{ color }}>{pct}%</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Retention badge ───────────────────────────────────────────────────────

function RetentionBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs" style={{ color: '#d1d5db' }}>—</span>;
  const urgent = days <= 5;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: urgent ? '#fef2f2' : '#fff7ed', color: urgent ? '#dc2626' : '#ea580c' }}
    >
      <Clock style={{ width: 10, height: 10 }} />
      Удерж.: {days}д
    </span>
  );
}

// ─── Plan badge ────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_CONFIG[plan] ?? { label: plan, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Widget status ─────────────────────────────────────────────────────────

function WidgetStatus({ online }: { online: boolean }) {
  return online
    ? <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#10b981' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Онлайн
      </span>
    : <span className="inline-flex items-center gap-1 text-xs" style={{ color: '#9ca3af' }}>
        <WifiOff style={{ width: 11, height: 11 }} />
        Оффлайн
      </span>;
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data: apiClients } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list({ search: search || undefined }),
    refetchInterval: 10_000,
  });

  const allClients = (apiClients ?? []).map(c => ({
    ...c,
    plan: (c as any).plan ?? 'Новый',
    plan_color: '#10b981',
    retention_days: (c as any).retention_days ?? null,
    monthly_revenue: (c as any).monthly_revenue ?? 0,
    widget_online: c.status === 'active',
    demo_chat_url: `http://ai.lomakin-igor.ru/api/v1/chat/demo/${c.domain}`,
    trial_active: false,
  }));

  const filtered = allClients.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.domain.toLowerCase().includes(search.toLowerCase());
    const matchPlan = !planFilter || (c as any).plan === planFilter;
    return matchSearch && matchPlan;
  });

  // KPI aggregates
  const total         = allClients.length;
  const withDialogs   = allClients.filter(c => c.dialogs_used > 0).length;
  const withLeads     = allClients.filter(c => c.leads_used > 0).length;
  const online        = allClients.filter(c => c.widget_online).length;
  const onTrial       = allClients.filter(c => (c as any).plan === 'Trial').length;
  const onPaid        = allClients.filter(c => (c as any).plan === 'Mega AI' || (c as any).plan === 'Pro').length;
  const monthlyRev    = allClients.reduce((s, c) => s + ((c as any).monthly_revenue ?? 0), 0);
  const highTraffic   = allClients.filter(c => c.dialogs_used >= 20).length;

  const KPIS = [
    { label: 'Всего сайтов',           value: total,         sub: `${online} онлайн сейчас`,              icon: Globe2,        color: '#6b5fd4', bg: '#ede9ff' },
    { label: 'Виджеты с диалогами',    value: withDialogs,   sub: `сайты с 3+ диалогами`,                 icon: MessageSquare, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Виджеты с лидами',       value: withLeads,     sub: 'сайты с лидами',                       icon: UserCheck,     color: '#10b981', bg: '#d1fae5' },
    { label: 'Высокий трафик',         value: highTraffic,   sub: 'сайты с 20+ посетителями',             icon: Wifi,          color: '#06b6d4', bg: '#cffafe' },
    { label: 'Пробный период',         value: onTrial,       sub: 'активных Trial',                       icon: Clock,         color: '#f97316', bg: '#ffedd5' },
    { label: 'Платные подписки',       value: onPaid,        sub: 'Pro и Mega AI',                        icon: ShoppingCart,  color: '#8b5cf6', bg: '#ede9fe' },
    { label: 'Требуют внимания',       value: allClients.filter(c => (c as any).retention_days !== null && (c as any).retention_days <= 5).length,
      sub: 'удержание ≤5 дней',        icon: AlertCircle,   color: '#ef4444', bg: '#fef2f2' },
    { label: 'Ежемесячный доход',      value: `₽ ${monthlyRev.toLocaleString('ru-RU')}`, sub: `₽ ${(monthlyRev * 12).toLocaleString('ru-RU')} в год`, icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Клиенты</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            {total} клиентов · {online} активных виджетов
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e5e7eb', color: '#374151' }}
            onClick={() => alert('Маркетплейс — скоро!')}
          >
            <ShoppingCart className="w-4 h-4" style={{ color: '#6b5fd4' }} />
            Маркетплейс
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#ede9ff', color: '#6b5fd4' }}>3 646</span>
          </button>
          <Link
            href="/clients/new"
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: '#6b5fd4' }}
          >
            <Plus className="w-4 h-4" />
            Добавить клиента
          </Link>
        </div>
      </div>

      {/* 8 KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {KPIS.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Поиск клиентов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#e5e7eb', background: '#fff', color: '#111827' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="border rounded-xl text-sm px-3 py-2 outline-none"
          style={{ borderColor: '#e5e7eb', background: '#fff', color: '#374151' }}
        >
          <option value="">Все тарифы</option>
          <option value="Демонстрация">Демонстрация</option>
          <option value="Новый">Новый</option>
          <option value="Trial">Trial</option>
          <option value="Pro">Pro</option>
          <option value="Mega AI">Mega AI</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafaf9' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Клиент</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: '#9ca3af' }}>Статистика</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Здоровье</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Статус</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: '#9ca3af' }}>Удержание</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden xl:table-cell" style={{ color: '#9ca3af' }}>Доход/мес</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#ede9ff' }}>
                    <Globe className="w-6 h-6" style={{ color: '#6b5fd4' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#374151' }}>Клиентов не найдено</p>
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Добавьте первого клиента или измените фильтр</p>
                </td>
              </tr>
            )}
            {filtered.map((client, i) => {
              const plan = (client as any).plan ?? 'Новый';
              const retDays = (client as any).retention_days as number | null;
              const rev = (client as any).monthly_revenue as number;
              const online = (client as any).widget_online as boolean;
              return (
                <tr
                  key={client.id}
                  className="cursor-pointer transition-colors group"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => window.location.href = `/clients/${client.id}`}
                >
                  {/* Client name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: '#ede9ff', color: '#6b5fd4' }}
                      >
                        {client.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#111827' }}>{client.name}</div>
                        <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                          <Globe className="w-3 h-3" />
                          {client.domain}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#6b7280' }}>
                      {client.dialogs_used > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare style={{ width: 11, height: 11 }} />
                          {client.dialogs_used}
                        </span>
                      )}
                      {client.pages_indexed > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe style={{ width: 11, height: 11 }} />
                          {client.pages_indexed} стр.
                        </span>
                      )}
                      {client.leads_used > 0 && (
                        <span className="flex items-center gap-1">
                          <UserCheck style={{ width: 11, height: 11 }} />
                          {client.leads_used}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <WidgetStatus online={online} />
                    </div>
                  </td>

                  {/* Health */}
                  <td className="px-4 py-3.5">
                    <div className="w-28">
                      <HealthBar pct={client.scan_quality} />
                    </div>
                    {client.pages_indexed > 0 && (
                      <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                        {client.pages_indexed} стр., Готово
                      </div>
                    )}
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3.5">
                    <PlanBadge plan={plan} />
                  </td>

                  {/* Retention */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <RetentionBadge days={retDays} />
                  </td>

                  {/* Revenue */}
                  <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                    {rev > 0 ? (
                      <span className="text-sm font-medium" style={{ color: '#111827' }}>
                        ₽ {rev.toLocaleString('ru-RU')}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-semibold transition-colors"
                      style={{ color: '#6b5fd4' }}
                    >
                      Открыть →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
