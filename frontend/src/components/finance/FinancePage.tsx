'use client';

import { useState } from 'react';
import {
  DollarSign, TrendingUp, Users, Zap, Download, ArrowUpRight,
  Clock, CheckCircle, AlertCircle, BarChart3, Bot, CreditCard,
  Lock, ChevronRight, Wallet,
} from 'lucide-react';

// ─── Demo data ───────────────────────────────────────────────────────────────

const PARTNER_BALANCE = {
  balance: 42_300,
  pending: 18_900,
  monthly_cost: 11_200,
  monthly_revenue: 67_400,
  profit: 56_200,
  clients_trial: 3,
  clients_paid: 9,
  forecast_3m: 201_600,
};

const COST_BREAKDOWN = [
  { label: 'AI Консультант (9 сайтов)',  cost: 5_400,  color: '#6b5fd4' },
  { label: 'AI Маркетолог (4 клиента)',   cost: 3_200,  color: '#fb923c' },
  { label: 'Инфраструктура (хостинг)',    cost: 1_800,  color: '#3b82f6' },
  { label: 'Поддержка и интеграции',      cost:   800,  color: '#10b981' },
];

const CLIENT_REVENUES = [
  { name: 'Акрон Скрап Урал',         plan: 'Pro',   monthly: 14_900, status: 'paid',  next_payment: '05.06' },
  { name: 'Платья больших размеров',   plan: 'Базовый', monthly: 6_900, status: 'paid', next_payment: '08.06' },
  { name: 'АКРОН СКРАП НН',           plan: 'Pro',   monthly: 14_900, status: 'paid',  next_payment: '12.06' },
  { name: 'Завод Металлических Изделий', plan: 'Mega', monthly: 24_900, status: 'paid', next_payment: '15.06' },
  { name: 'ЭБС',                       plan: 'Базовый', monthly: 6_900, status: 'overdue', next_payment: '01.06' },
  { name: 'ГК Легенда',               plan: 'Trial', monthly: 0,     status: 'trial', next_payment: '—' },
  { name: 'Клиент А (новый)',          plan: 'Trial', monthly: 0,     status: 'trial', next_payment: '—' },
  { name: 'Клиент Б (демо)',           plan: 'Trial', monthly: 0,     status: 'trial', next_payment: '—' },
];

const TRANSACTIONS = [
  { id: 't1', date: '27.05.2026', client: 'Завод Металлических Изделий', amount: 24_900, type: 'income', status: 'done' },
  { id: 't2', date: '25.05.2026', client: 'Акрон Скрап Урал',            amount: 14_900, type: 'income', status: 'done' },
  { id: 't3', date: '25.05.2026', client: 'Инфраструктура (Timeweb)',     amount: -1_800, type: 'expense', status: 'done' },
  { id: 't4', date: '20.05.2026', client: 'АКРОН СКРАП НН',              amount: 14_900, type: 'income', status: 'done' },
  { id: 't5', date: '15.05.2026', client: 'Платья больших размеров',      amount: 6_900,  type: 'income', status: 'done' },
  { id: 't6', date: '01.05.2026', client: 'ЭБС (просрочка)',              amount: 6_900,  type: 'income', status: 'overdue' },
];

// Client view demo data
const CLIENT_BLOCKS = [
  { id: 'consultant', label: 'AI Консультант', icon: Bot,       color: '#6b5fd4', active: true,  used: 1240, limit: 2000, leads_used: 18, leads_limit: 50, cost: 6_900 },
  { id: 'marketer',   label: 'AI Маркетолог',  icon: TrendingUp,color: '#fb923c', active: true,  used: 94,   limit: 200,  leads_used: 0,  leads_limit: 0,  cost: 2_990 },
  { id: 'hr',         label: 'AI HR',          icon: Users,     color: '#10b981', active: false, used: 0,    limit: 0,    leads_used: 0,  leads_limit: 0,  cost: 1_990 },
  { id: 'finance',    label: 'AI Финансы',     icon: DollarSign,color: '#3b82f6', active: false, used: 0,    limit: 0,    leads_used: 0,  leads_limit: 0,  cost: 2_490 },
  { id: 'legal',      label: 'AI Юрист',       icon: BarChart3, color: '#8b5cf6', active: false, used: 0,    limit: 0,    leads_used: 0,  leads_limit: 0,  cost: 1_490 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    paid:    { label: 'Оплачен',  color: '#10b981', bg: '#d1fae5' },
    trial:   { label: 'Trial',    color: '#6b5fd4', bg: '#ede9ff' },
    overdue: { label: 'Просрочка', color: '#ef4444', bg: '#fee2e2' },
    done:    { label: 'Выполнен', color: '#10b981', bg: '#d1fae5' },
  };
  const s = map[status] ?? map.paid;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { color: string; bg: string }> = {
    Mega:     { color: '#a78bfa', bg: '#ede9ff' },
    Pro:      { color: '#6b5fd4', bg: '#ede9ff' },
    Базовый:  { color: '#374151', bg: '#f3f4f6' },
    Trial:    { color: '#f97316', bg: '#fff7ed' },
  };
  const s = colors[plan] ?? colors.Базовый;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: s.bg, color: s.color }}>
      {plan}
    </span>
  );
}

// ─── Partner view ─────────────────────────────────────────────────────────────

function PartnerView() {
  const [showPayout, setShowPayout] = useState(false);

  const totalMonthly = CLIENT_REVENUES.filter(c => c.status === 'paid').reduce((a, c) => a + c.monthly, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Баланс', value: fmt(PARTNER_BALANCE.balance), icon: Wallet, color: '#6b5fd4', bg: '#ede9ff' },
          { label: 'Выручка (май)', value: fmt(PARTNER_BALANCE.monthly_revenue), icon: TrendingUp, color: '#10b981', bg: '#d1fae5' },
          { label: 'Прибыль (май)', value: fmt(PARTNER_BALANCE.profit), icon: ArrowUpRight, color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Прогноз 3 мес.', value: fmt(PARTNER_BALANCE.forecast_3m), icon: BarChart3, color: '#f97316', bg: '#ffedd5' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#9ca3af' }}>{kpi.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                  <Icon style={{ width: 14, height: 14, color: kpi.color }} />
                </div>
              </div>
              <div className="text-xl font-bold" style={{ color: '#111827' }}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-5">
        {/* Cost breakdown */}
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Расходы в мае</h3>
          <div className="space-y-3">
            {COST_BREAKDOWN.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: '#374151' }}>{item.label}</span>
                  <span className="font-semibold" style={{ color: item.color }}>{fmt(item.cost)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${(item.cost / PARTNER_BALANCE.monthly_cost) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #f3f4f6' }}>
            <span className="text-xs font-semibold" style={{ color: '#374151' }}>Итого расходов</span>
            <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{fmt(PARTNER_BALANCE.monthly_cost)}</span>
          </div>
        </div>

        {/* Payout + trial info */}
        <div className="space-y-4">
          {/* Trial clients */}
          <div className="rounded-xl p-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock style={{ width: 14, height: 14, color: '#f97316' }} />
              <span className="text-sm font-semibold" style={{ color: '#92400e' }}>
                Trial-клиентов: {PARTNER_BALANCE.clients_trial}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#b45309' }}>
              Конвертируйте их в платных — потенциал {fmt(PARTNER_BALANCE.clients_trial * 6900)}/мес минимум.
            </p>
          </div>

          {/* Overdue */}
          <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle style={{ width: 14, height: 14, color: '#ef4444' }} />
              <span className="text-sm font-semibold" style={{ color: '#b91c1c' }}>
                Просроченные платежи
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: '#b91c1c' }}>ЭБС — {fmt(6900)} не оплачен с 01.06</p>
            <button className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: '#ef4444', color: '#fff' }}>
              Отправить напоминание
            </button>
          </div>

          {/* Payout */}
          <div className="rounded-xl p-4" style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: '#065f46' }}>Доступно к выводу</p>
                <p className="text-xl font-bold" style={{ color: '#10b981' }}>{fmt(PARTNER_BALANCE.balance)}</p>
              </div>
              <button onClick={() => setShowPayout(true)}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
                style={{ background: '#10b981' }}>
                <Download style={{ width: 14, height: 14 }} />
                Вывести
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Client revenues table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Выручка по клиентам</h3>
          <span className="text-xs font-bold" style={{ color: '#10b981' }}>
            Всего: {fmt(totalMonthly)}/мес
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Клиент', 'Тариф', 'Ежемесячно', 'Статус', 'След. платёж'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#9ca3af' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLIENT_REVENUES.map((c, i) => (
              <tr key={c.name} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}
                className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>{c.name}</td>
                <td className="px-4 py-3"><PlanBadge plan={c.plan} /></td>
                <td className="px-4 py-3 text-sm font-semibold"
                  style={{ color: c.monthly === 0 ? '#9ca3af' : '#111827' }}>
                  {c.monthly === 0 ? '—' : fmt(c.monthly)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-sm" style={{ color: '#6b7280' }}>{c.next_payment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transactions */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Последние транзакции</h3>
          <button className="text-xs font-medium" style={{ color: '#6b5fd4' }}>Выгрузить CSV</button>
        </div>
        <div className="divide-y divide-gray-100">
          {TRANSACTIONS.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
                style={{ background: t.type === 'income' ? '#d1fae5' : '#fee2e2' }}>
                {t.type === 'income'
                  ? <ArrowUpRight style={{ width: 14, height: 14, color: '#10b981' }} />
                  : <ArrowUpRight style={{ width: 14, height: 14, color: '#ef4444', transform: 'rotate(180deg)' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>{t.client}</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{t.date}</p>
              </div>
              <StatusBadge status={t.status} />
              <span className="text-sm font-bold ml-2"
                style={{ color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                {t.type === 'income' ? '+' : ''}{fmt(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout modal */}
      {showPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowPayout(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-2" style={{ color: '#111827' }}>Вывод средств</h3>
            <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
              Доступно к выводу: <strong style={{ color: '#10b981' }}>{fmt(PARTNER_BALANCE.balance)}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Сумма</label>
                <input type="number" defaultValue={PARTNER_BALANCE.balance}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: '#e5e7eb' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Реквизиты</label>
                <input placeholder="Номер карты или расчётный счёт" type="text"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: '#e5e7eb' }} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowPayout(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>
                  Отмена
                </button>
                <button onClick={() => { alert('Заявка на вывод отправлена — обработка 1-3 рабочих дня'); setShowPayout(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#10b981' }}>
                  Отправить заявку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client view ──────────────────────────────────────────────────────────────

function ClientView() {
  return (
    <div className="space-y-5 max-w-4xl">
      {/* Balance overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Тариф', value: 'Pro', sub: 'AI Консультант + Маркетолог', icon: CreditCard, color: '#6b5fd4' },
          { label: 'Диалогов использовано', value: '1 240 / 2 000', sub: '62% от лимита', icon: BarChart3, color: '#f97316' },
          { label: 'Лидов получено', value: '18 / 50', sub: 'За май 2026', icon: Users, color: '#10b981' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#9ca3af' }}>{kpi.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: kpi.color + '18' }}>
                  <Icon style={{ width: 14, height: 14, color: kpi.color }} />
                </div>
              </div>
              <div className="text-lg font-bold" style={{ color: '#111827' }}>{kpi.value}</div>
              <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Blocks grid */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>AI-блоки</h3>
        <div className="space-y-3">
          {CLIENT_BLOCKS.map(block => {
            const Icon = block.icon;
            return (
              <div key={block.id} className="rounded-xl p-4"
                style={{ background: '#fff', border: `1px solid ${block.active ? '#f0f0f5' : '#f3f4f6'}` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: block.active ? block.color + '18' : '#f3f4f6' }}>
                    <Icon style={{ width: 18, height: 18, color: block.active ? block.color : '#d1d5db' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: block.active ? '#111827' : '#9ca3af' }}>
                        {block.label}
                      </span>
                      {block.active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#d1fae5', color: '#065f46' }}>Активен</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#f3f4f6', color: '#9ca3af' }}>Не подключён</span>
                      )}
                    </div>
                    {block.active && block.limit > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: '#6b7280' }}>Диалогов</span>
                          <span style={{ color: '#374151' }}>{block.used.toLocaleString()} / {block.limit.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#f3f4f6' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${(block.used / block.limit) * 100}%`, background: block.color }} />
                        </div>
                      </div>
                    )}
                    {!block.active && (
                      <p className="text-xs" style={{ color: '#9ca3af' }}>
                        Подключите для доступа к функциям — {fmt(block.cost)}/мес
                      </p>
                    )}
                  </div>
                  {!block.active ? (
                    <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-white flex-shrink-0"
                      style={{ background: block.color }}
                      onClick={() => alert('Для подключения блока обратитесь к вашему партнёру или напишите в поддержку')}>
                      <Zap style={{ width: 12, height: 12 }} />
                      Подключить
                    </button>
                  ) : (
                    <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border flex-shrink-0"
                      style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                      <ChevronRight style={{ width: 12, height: 12 }} />
                      Статистика
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing info */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>Следующий платёж</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold" style={{ color: '#111827' }}>{fmt(9890)}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Спишется 05 июня 2026</p>
          </div>
          <div className="flex gap-2">
            <button className="text-sm px-4 py-2 rounded-xl border"
              style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
              История платежей
            </button>
            <button className="text-sm px-4 py-2 rounded-xl font-semibold"
              style={{ background: '#6b5fd4', color: '#fff' }}>
              Пополнить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [view, setView] = useState<'partner' | 'client'>('partner');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b"
        style={{ background: '#fff', borderColor: '#f0f0f5' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#dbeafe' }}>
              <DollarSign style={{ width: 18, height: 18, color: '#3b82f6' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Финансы</h1>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Доходы, расходы, клиентские блоки</p>
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
            <button onClick={() => setView('partner')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: view === 'partner' ? '#fff' : 'transparent', color: view === 'partner' ? '#3b82f6' : '#9ca3af' }}>
              Партнёр
            </button>
            <button onClick={() => setView('client')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: view === 'client' ? '#fff' : 'transparent', color: view === 'client' ? '#3b82f6' : '#9ca3af' }}>
              Клиент
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6" style={{ background: '#fafafa' }}>
        {view === 'partner' ? <PartnerView /> : <ClientView />}
      </div>
    </div>
  );
}
