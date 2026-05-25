'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, clientsApi } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import { MessageSquare, Users, UserCheck, Zap, TrendingUp, Bot } from 'lucide-react';
import Link from 'next/link';
import { timeAgo, statusColor, statusLabel, modeLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 30_000,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-1">Общая статистика по всем клиентам</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Клиентов"
          value={statsLoading ? '—' : stats?.total_clients ?? 0}
          icon={Users}
          trend={`${stats?.active_clients ?? 0} активных`}
        />
        <StatCard
          label="Диалогов сегодня"
          value={statsLoading ? '—' : stats?.total_conversations_today ?? 0}
          icon={MessageSquare}
          trend={`${stats?.total_conversations_week ?? 0} за неделю`}
        />
        <StatCard
          label="Лидов сегодня"
          value={statsLoading ? '—' : stats?.total_leads_today ?? 0}
          icon={UserCheck}
          trend={`${stats?.total_leads_week ?? 0} за неделю`}
        />
        <StatCard
          label="Сообщений сегодня"
          value={statsLoading ? '—' : stats?.total_messages_today ?? 0}
          icon={Zap}
        />
      </div>

      {/* Clients list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Клиенты</h2>
          <Link
            href="/clients/new"
            className="text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            + Добавить клиента
          </Link>
        </div>

        {!clients || clients.length === 0 ? (
          <div className="py-16 text-center">
            <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Клиентов пока нет</p>
            <Link
              href="/clients/new"
              className="mt-4 inline-block text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Добавить первого клиента →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {client.assistant_avatar_url ? (
                    <img src={client.assistant_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-700 font-bold text-sm">
                      {client.assistant_name?.[0] ?? 'A'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{client.name}</div>
                  <div className="text-sm text-gray-400 truncate">{client.domain}</div>
                </div>

                {/* Status */}
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(client.status))}>
                  {statusLabel(client.status)}
                </span>

                {/* Mode */}
                <span className="text-xs text-gray-400 hidden sm:block">
                  {modeLabel(client.assistant_mode)}
                </span>

                {/* Progress (indexing) */}
                {client.status === 'indexing' && (
                  <div className="w-20">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${client.index_progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 text-right">{Math.round(client.index_progress)}%</div>
                  </div>
                )}

                {/* Stats */}
                {client.status === 'active' && (
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{client.dialogs_used}</div>
                    <div className="text-xs text-gray-400">диалогов</div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
