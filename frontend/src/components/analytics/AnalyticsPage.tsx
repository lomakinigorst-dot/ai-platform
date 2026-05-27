'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, Users, MessageSquare, UserCheck, TrendingUp } from 'lucide-react';

function KpiCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => dashboardApi.analytics(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка аналитики...</p>
      </div>
    );
  }

  // Build chart data: last 7 days merged
  const allDays = Array.from(new Set([
    ...Object.keys(data.daily_leads),
    ...Object.keys(data.daily_conversations),
  ])).sort();

  const chartData = allDays.map(day => ({
    day: day.slice(5), // MM-DD
    leads: data.daily_leads[day] ?? 0,
    conversations: data.daily_conversations[day] ?? 0,
  }));

  const convRate = data.totals.conversations > 0
    ? Math.round(data.totals.leads / data.totals.conversations * 100)
    : 0;

  return (
    <div className="max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Аналитика</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Общая статистика агентства по всем клиентам
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Клиентов" value={data.totals.clients} icon={Users} color="#6b5fd4" />
        <KpiCard label="Активных клиентов" value={data.totals.active_clients} icon={TrendingUp} color="#10b981" />
        <KpiCard label="Всего диалогов" value={data.totals.conversations} icon={MessageSquare} color="#3b82f6" />
        <KpiCard label="Всего лидов" value={data.totals.leads} icon={UserCheck} color="#f97316" />
      </div>

      {/* Конверсия */}
      {data.totals.conversations > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Конверсия диалогов в лиды</h3>
            <span className="text-2xl font-bold" style={{ color: '#6b5fd4' }}>{convRate}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${convRate}%`, background: 'var(--primary)' }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {data.totals.leads} лидов из {data.totals.conversations} диалогов
          </p>
        </div>
      )}

      {/* Activity chart */}
      {chartData.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
            Активность за 7 дней
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b5fd4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6b5fd4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Area
                type="monotone"
                dataKey="conversations"
                name="Диалоги"
                stroke="#6b5fd4"
                fill="url(#gradConv)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="leads"
                name="Лиды"
                stroke="#f97316"
                fill="url(#gradLeads)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopTable
          title="Топ клиентов по лидам"
          rows={data.top_by_leads}
          label="лидов"
          color="#f97316"
        />
        <TopTable
          title="Топ клиентов по диалогам"
          rows={data.top_by_conversations}
          label="диалогов"
          color="#6b5fd4"
        />
      </div>
    </div>
  );
}

function TopTable({
  title, rows, label, color,
}: {
  title: string;
  rows: { id: string; name: string; domain: string; count: number }[];
  label: string;
  color: string;
}) {
  const max = Math.max(...rows.map(r => r.count), 1);
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Нет данных</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3">
              <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Link
                    href={`/clients/${r.id}`}
                    className="text-sm font-medium truncate hover:underline"
                    style={{ color: 'var(--text)' }}
                  >
                    {r.name || r.domain}
                  </Link>
                  <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {r.count} {label}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(r.count / max) * 100}%`, background: color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
