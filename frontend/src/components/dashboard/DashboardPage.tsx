'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, clientsApi, type Client } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn, statusColor, statusLabel, timeAgo } from '@/lib/utils';
import {
  Users, MessageSquare, UserCheck, TrendingUp, Zap,
  ArrowUpRight, ArrowDownRight, Plus, ExternalLink,
  Activity, Globe, Bot, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// Мок данных для графика (последние 7 дней)
function buildChartData(totalWeek: number) {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const avg = Math.max(1, Math.round(totalWeek / 7));
  return days.map((day, i) => ({
    day,
    диалоги: Math.round(avg * (0.6 + Math.random() * 0.8)),
    лиды: Math.round(avg * 0.15 * (0.5 + Math.random())),
  }));
}

// Рассчитать % здоровья клиента
function healthScore(client: Client): number {
  let score = 0;
  if (client.status === 'active') score += 35;
  else if (client.status === 'indexing') score += 15;
  if (client.index_progress >= 100) score += 20;
  if (client.dialogs_used > 0) score += 25;
  if (client.leads_used > 0) score += 20;
  return Math.min(100, score);
}

function healthColor(score: number) {
  if (score >= 75) return 'text-[#16a34a]';
  if (score >= 45) return 'text-[#d97706]';
  return 'text-[#dc2626]';
}

function healthBg(score: number) {
  if (score >= 75) return 'bg-[#dcfce7]';
  if (score >= 45) return 'bg-[#fef3c7]';
  return 'bg-[#fee2e2]';
}

// KPI карточка
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
}

function KpiCard({ label, value, sub, delta, icon: Icon, iconColor = '#6b5fd4', iconBg = '#ede9ff', loading }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-[#111827]">{value}</p>
            )}
            {sub && !loading && (
              <p className="text-xs text-[#9ca3af] mt-1">{sub}</p>
            )}
          </div>
          <div
            className="flex-shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center ml-3"
            style={{ background: iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        </div>
        {delta !== undefined && !loading && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#f3f4f6]">
            {delta >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#16a34a]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-[#dc2626]" />
            )}
            <span className={cn('text-xs font-medium', delta >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]')}>
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
            <span className="text-xs text-[#9ca3af]">vs прошлая неделя</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Кастомный тултип для графика
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-3 text-sm">
      <p className="font-medium text-[#111827] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#6b7280]">{p.name}:</span>
          <span className="font-semibold text-[#111827]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 30_000,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
  });

  const chartData = buildChartData(stats?.total_conversations_week ?? 0);

  // Считаем простые производные метрики
  const totalClients = stats?.total_clients ?? 0;
  const activeClients = stats?.active_clients ?? 0;
  const widgetsWithDialogs = clients?.filter(c => c.dialogs_used > 0).length ?? 0;
  const widgetsWithLeads = clients?.filter(c => c.leads_used > 0).length ?? 0;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Доброе утро' : now.getHours() < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">{greeting} 👋</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="w-4 h-4" />
            Добавить клиента
          </Link>
        </Button>
      </div>

      {/* ── KPI row 1 (главные) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Всего клиентов"
          value={totalClients}
          sub={`${activeClients} активных`}
          delta={12}
          icon={Users}
          iconColor="#6b5fd4"
          iconBg="#ede9ff"
          loading={isLoading}
        />
        <KpiCard
          label="Диалогов за неделю"
          value={stats?.total_conversations_week ?? 0}
          sub={`${stats?.total_conversations_today ?? 0} сегодня`}
          delta={8}
          icon={MessageSquare}
          iconColor="#3b82f6"
          iconBg="#dbeafe"
          loading={isLoading}
        />
        <KpiCard
          label="Лидов за неделю"
          value={stats?.total_leads_week ?? 0}
          sub={`${stats?.total_leads_today ?? 0} сегодня`}
          delta={23}
          icon={UserCheck}
          iconColor="#16a34a"
          iconBg="#dcfce7"
          loading={isLoading}
        />
        <KpiCard
          label="Сообщений сегодня"
          value={stats?.total_messages_today ?? 0}
          sub="через все виджеты"
          icon={Zap}
          iconColor="#f97316"
          iconBg="#fff3e8"
          loading={isLoading}
        />
      </div>

      {/* ── KPI row 2 (воронка) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          label="Виджеты с диалогами"
          value={widgetsWithDialogs}
          sub={totalClients > 0 ? `${Math.round((widgetsWithDialogs / totalClients) * 100)}% от всех` : '—'}
          icon={Activity}
          iconColor="#8b5cf6"
          iconBg="#ede9ff"
          loading={isLoading}
        />
        <KpiCard
          label="Виджеты с лидами"
          value={widgetsWithLeads}
          sub={totalClients > 0 ? `${Math.round((widgetsWithLeads / totalClients) * 100)}% конверсия` : '—'}
          icon={Globe}
          iconColor="#0891b2"
          iconBg="#cffafe"
          loading={isLoading}
        />
        <KpiCard
          label="Доход агентства"
          value="—"
          sub="подключите тариф"
          icon={TrendingUp}
          iconColor="#16a34a"
          iconBg="#dcfce7"
          loading={isLoading}
        />
      </div>

      {/* ── Chart + Clients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* График активности */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#111827]">Активность за 7 дней</CardTitle>
              <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6b5fd4] inline-block" />
                  Диалоги
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] inline-block" />
                  Лиды
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDialogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b5fd4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6b5fd4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="диалоги" stroke="#6b5fd4" strokeWidth={2} fill="url(#gradDialogs)" dot={false} activeDot={{ r: 4, fill: '#6b5fd4' }} />
                <Area type="monotone" dataKey="лиды" stroke="#f97316" strokeWidth={2} fill="url(#gradLeads)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Топ клиентов по здоровью */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#111827]">Здоровье клиентов</CardTitle>
              <Link href="/clients" className="text-xs text-[#6b5fd4] hover:underline flex items-center gap-0.5">
                Все <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {!clients || clients.length === 0 ? (
              <div className="py-8 text-center">
                <Bot className="w-8 h-8 text-[#e5e7eb] mx-auto mb-2" />
                <p className="text-xs text-[#9ca3af]">Клиентов пока нет</p>
              </div>
            ) : (
              clients.slice(0, 6).map(client => {
                const score = healthScore(client);
                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-3 group"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#ede9ff] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#6b5fd4] font-bold text-xs">
                        {client.name?.[0]?.toUpperCase() ?? 'A'}
                      </span>
                    </div>
                    {/* Info + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#111827] truncate group-hover:text-[#6b5fd4] transition-colors">
                          {client.name}
                        </span>
                        <span className={cn('text-xs font-bold ml-2 flex-shrink-0', healthColor(score))}>
                          {score}%
                        </span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Clients table ── */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#111827]">Все клиенты</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/clients">
                Управление клиентами
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          {!clients || clients.length === 0 ? (
            <div className="py-12 text-center">
              <Bot className="w-10 h-10 text-[#e5e7eb] mx-auto mb-3" />
              <p className="text-sm text-[#9ca3af] mb-4">Клиентов пока нет</p>
              <Button asChild size="sm">
                <Link href="/clients/new">
                  <Plus className="w-4 h-4" />
                  Добавить первого клиента
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="text-left text-xs font-medium text-[#9ca3af] px-5 py-3 uppercase tracking-wide">Клиент</th>
                    <th className="text-left text-xs font-medium text-[#9ca3af] px-4 py-3 uppercase tracking-wide hidden md:table-cell">Статус</th>
                    <th className="text-left text-xs font-medium text-[#9ca3af] px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Диалоги</th>
                    <th className="text-left text-xs font-medium text-[#9ca3af] px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Лиды</th>
                    <th className="text-left text-xs font-medium text-[#9ca3af] px-4 py-3 uppercase tracking-wide">Здоровье</th>
                    <th className="text-left text-xs font-medium text-[#9ca3af] px-4 py-3 uppercase tracking-wide hidden sm:table-cell">Добавлен</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9fafb]">
                  {clients.map(client => {
                    const score = healthScore(client);
                    return (
                      <tr key={client.id} className="hover:bg-[#fafafa] transition-colors group">
                        {/* Клиент */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#ede9ff] flex items-center justify-center flex-shrink-0">
                              <span className="text-[#6b5fd4] font-bold text-xs">
                                {client.name?.[0]?.toUpperCase() ?? 'A'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#111827] group-hover:text-[#6b5fd4] transition-colors">
                                {client.name}
                              </p>
                              <p className="text-xs text-[#9ca3af]">{client.domain}</p>
                            </div>
                          </div>
                        </td>
                        {/* Статус */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusColor(client.status))}>
                            {statusLabel(client.status)}
                          </span>
                        </td>
                        {/* Диалоги */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-sm font-medium text-[#111827]">{client.dialogs_used}</span>
                          <span className="text-xs text-[#9ca3af] ml-1">/ {client.dialogs_limit}</span>
                        </td>
                        {/* Лиды */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-sm font-medium text-[#111827]">{client.leads_used}</span>
                          <span className="text-xs text-[#9ca3af] ml-1">/ {client.leads_limit}</span>
                        </td>
                        {/* Здоровье */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', healthBg(score), healthColor(score))}>
                              {score}
                            </div>
                            <Progress value={score} className="w-16 h-1.5 hidden sm:block" />
                          </div>
                        </td>
                        {/* Дата */}
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-[#9ca3af]">{timeAgo(client.created_at)}</span>
                        </td>
                        {/* Action */}
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/clients/${client.id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              Открыть <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
