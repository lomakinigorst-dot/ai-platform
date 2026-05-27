'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2, MessageSquare, UserCheck, TrendingUp, ExternalLink,
  Globe, Target,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#ede9ff' }}>
        <BarChart2 className="w-8 h-8" style={{ color: '#6b5fd4' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#111827' }}>Нет данных для аналитики</h3>
      <p className="text-sm max-w-sm mb-5" style={{ color: '#9ca3af' }}>
        Установите виджет Atlas на свой сайт. После того как появятся первые диалоги и лиды — аналитика начнёт наполняться.
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

// Demo analytics data for partner's own widget
const ANALYTICS = {
  period: '30 дней',
  funnel: [
    { label: 'Посетители сайта', value: 1240, pct: 100 },
    { label: 'Открыли виджет',   value: 387,  pct: 31 },
    { label: 'Написали',         value: 124,  pct: 10 },
    { label: 'Конвертировались', value: 18,   pct: 1.5 },
  ],
  kpis: [
    { label: 'Диалогов',                value: 124,   color: '#6b5fd4', icon: MessageSquare },
    { label: 'Уникальных пользователей', value: 98,    color: '#3b82f6', icon: Target },
    { label: 'Конверсия (диалог→лид)',   value: '14.5%',color: '#10b981', icon: UserCheck },
    { label: 'Среднее сообщений',        value: 6.2,   color: '#f97316', icon: BarChart2 },
    { label: 'AI решил без оператора',   value: '87%',  color: '#8b5cf6', icon: TrendingUp },
    { label: 'Лиды за период',           value: 18,    color: '#ef4444', icon: UserCheck },
  ],
  frequent_questions: [
    { topic: 'Тарифы и цены',         pct: 34, delta: '+5%' },
    { topic: 'Как подключить виджет', pct: 22, delta: '+2%' },
    { topic: 'Количество клиентов',   pct: 18, delta: '0%' },
    { topic: 'Интеграции',            pct: 12, delta: '-1%' },
    { topic: 'Бесплатный тариф',      pct: 8,  delta: '+3%' },
    { topic: 'Технические вопросы',   pct: 6,  delta: '-2%' },
  ],
  sentiment: { positive: 68, neutral: 24, negative: 8 },
  sources: [
    { source: 'Органика',   dialogs: 54, leads: 6, conv: '11%' },
    { source: 'yandex/cpc', dialogs: 38, leads: 8, conv: '21%' },
    { source: 'vk/target',  dialogs: 19, leads: 3, conv: '16%' },
    { source: 'telegram',   dialogs: 13, leads: 1, conv: '8%' },
  ],
  cities: [
    { city: 'Москва',           pct: 42 },
    { city: 'Санкт-Петербург',  pct: 17 },
    { city: 'Новосибирск',      pct: 9 },
    { city: 'Екатеринбург',     pct: 7 },
    { city: 'Казань',           pct: 5 },
    { city: 'Другие',           pct: 20 },
  ],
  daily: [12, 8, 15, 22, 19, 14, 11, 9, 18, 24, 21, 17, 13, 16],
};

function KpiCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon style={{ width: 14, height: 14, color }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: '#111827' }}>{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => dashboardApi.analytics(),
    refetchInterval: 60_000,
  });

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#6b5fd4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!analytics || analytics.totals.conversations === 0) return <div className="p-6"><EmptyState /></div>;

  const dailyData = Object.entries(analytics.daily_conversations).map(([day, count]) => ({ day, count: count as number }));
  const maxBar = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.count), 1) : 1;
  const convRate = analytics.totals.conversations > 0
    ? ((analytics.totals.leads / analytics.totals.conversations) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Аналитика</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            Все клиенты · реальные данные
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
          {[['7', '7 дней'], ['30', '30 дней'], ['90', '90 дней']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: period === v ? '#fff' : 'transparent', color: period === v ? '#6b5fd4' : '#9ca3af' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel */}
      {/* KPI grid */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Диалогов" value={analytics.totals.conversations} color="#6b5fd4" icon={MessageSquare} />
        <KpiCard label="Лидов" value={analytics.totals.leads} color="#10b981" icon={UserCheck} />
        <KpiCard label="Конверсия" value={`${convRate}%`} color="#f97316" icon={TrendingUp} />
        <KpiCard label="Активных клиентов" value={analytics.totals.active_clients} color="#3b82f6" icon={Globe} />
        <KpiCard label="Всего клиентов" value={analytics.totals.clients} color="#8b5cf6" icon={Target} />
        <KpiCard label="Лидов / клиент" value={analytics.totals.clients > 0 ? (analytics.totals.leads / analytics.totals.clients).toFixed(1) : '0'} color="#ef4444" icon={BarChart2} />
      </div>

      {/* Activity chart */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Диалоги за последние 7 дней</h2>
        {dailyData.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#9ca3af' }}>Нет данных за последние 7 дней</p>
        ) : (
          <div className="flex items-end gap-2 h-24">
            {dailyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{ height: `${Math.max((d.count / maxBar) * 80, 4)}px`, background: '#6b5fd4', opacity: 0.7 + (d.count / maxBar) * 0.3 }}
                />
                <span className="text-[9px]" style={{ color: '#d1d5db' }}>{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top clients */}
      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Топ по лидам</h2>
          <div className="space-y-2">
            {analytics.top_by_leads.length === 0 ? (
              <p className="text-xs" style={{ color: '#9ca3af' }}>Нет данных</p>
            ) : analytics.top_by_leads.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#374151' }}>{c.name || c.domain}</span>
                <span className="text-sm font-bold" style={{ color: '#6b5fd4' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Топ по диалогам</h2>
          <div className="space-y-2">
            {analytics.top_by_conversations.length === 0 ? (
              <p className="text-xs" style={{ color: '#9ca3af' }}>Нет данных</p>
            ) : analytics.top_by_conversations.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#374151' }}>{c.name || c.domain}</span>
                <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
