'use client';

import { useState } from 'react';
import {
  BarChart2, MessageSquare, UserCheck, TrendingUp, ExternalLink,
  Smile, Meh, Frown, Globe, Target,
} from 'lucide-react';
import { PARTNER_WIDGET } from '@/lib/demo-data';

const PARTNER_HAS_WIDGET = true;

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

  if (!PARTNER_HAS_WIDGET) return <div className="p-6"><EmptyState /></div>;

  const maxBar = Math.max(...ANALYTICS.daily);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Аналитика</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            Данные виджета на <span className="font-medium" style={{ color: '#6b5fd4' }}>atlasai.ru</span>
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
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Воронка</h2>
        <div className="flex items-end gap-3">
          {ANALYTICS.funnel.map((step, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className="rounded-xl mb-2 transition-all"
                style={{
                  height: `${Math.max(step.pct * 1.2, 20)}px`,
                  background: `hsl(${250 - i * 40}, 70%, ${55 + i * 5}%)`,
                  opacity: 1 - i * 0.15,
                }}
              />
              <div className="text-lg font-bold" style={{ color: '#111827' }}>{step.value.toLocaleString()}</div>
              <div className="text-xs" style={{ color: '#9ca3af' }}>{step.label}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: '#6b5fd4' }}>{step.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-3 gap-3">
        {ANALYTICS.kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Activity chart */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Диалоги по дням</h2>
        <div className="flex items-end gap-1 h-24">
          {ANALYTICS.daily.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{ height: `${(v / maxBar) * 80}px`, background: '#6b5fd4', opacity: 0.7 + (v / maxBar) * 0.3 }}
              />
              <span className="text-[9px]" style={{ color: '#d1d5db' }}>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: frequent questions + sentiment */}
      <div className="grid grid-cols-2 gap-5">
        {/* Frequent questions */}
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Частые вопросы (Топ-6)</h2>
          <div className="space-y-3">
            {ANALYTICS.frequent_questions.map(q => (
              <div key={q.topic}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: '#374151' }}>{q.topic}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: q.delta.startsWith('+') ? '#10b981' : q.delta === '0%' ? '#9ca3af' : '#ef4444' }}>{q.delta}</span>
                    <span className="font-semibold" style={{ color: '#6b5fd4' }}>{q.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                  <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: '#6b5fd4' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Сентимент диалогов</h2>
          <div className="space-y-3">
            {[
              { label: 'Позитивный', pct: ANALYTICS.sentiment.positive, color: '#10b981', icon: Smile },
              { label: 'Нейтральный', pct: ANALYTICS.sentiment.neutral, color: '#9ca3af', icon: Meh },
              { label: 'Негативный', pct: ANALYTICS.sentiment.negative, color: '#ef4444', icon: Frown },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: s.color }}>
                      <Icon style={{ width: 13, height: 13 }} />
                      {s.label}
                    </div>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cities */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: '#f3f4f6' }}>
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#9ca3af' }}>ГЕО — ТОП ГОРОДОВ</h3>
            <div className="space-y-1.5">
              {ANALYTICS.cities.map(c => (
                <div key={c.city} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Globe style={{ width: 10, height: 10, color: '#9ca3af' }} />
                    <span style={{ color: '#374151' }}>{c.city}</span>
                  </div>
                  <span className="font-medium" style={{ color: '#6b5fd4' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Traffic sources */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Источники трафика</h2>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Источник', 'Диалогов', 'Лидов', 'Конверсия'].map(h => (
                <th key={h} className="text-left pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ANALYTICS.sources.map((s, i) => (
              <tr key={s.source} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                <td className="py-2.5 text-sm font-medium" style={{ color: '#374151' }}>{s.source}</td>
                <td className="py-2.5 text-sm" style={{ color: '#111827' }}>{s.dialogs}</td>
                <td className="py-2.5 text-sm" style={{ color: '#111827' }}>{s.leads}</td>
                <td className="py-2.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#d1fae5', color: '#10b981' }}>
                    {s.conv}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
