'use client';

import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { statusColor, statusLabel, modeLabel, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Plus, Globe, Bot, RefreshCw } from 'lucide-react';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients', search, statusFilter],
    queryFn: () => clientsApi.list({ search: search || undefined, status: statusFilter || undefined }),
    refetchInterval: 5_000,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-500 text-sm mt-1">{clients?.length ?? 0} клиентов</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить клиента
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени или домену..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="indexing">Индексация</option>
          <option value="pending">Ожидают</option>
          <option value="error">Ошибка</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Клиент</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Домен</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Ассистент</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">Статус</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Диалоги</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Лиды</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Загрузка...
                </td>
              </tr>
            )}
            {!isLoading && (!clients || clients.length === 0) && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Bot className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Клиентов не найдено</p>
                </td>
              </tr>
            )}
            {clients?.map(client => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {client.assistant_avatar_url ? (
                        <img src={client.assistant_avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-700 font-bold text-sm">{client.assistant_name?.[0] ?? 'A'}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{client.name}</div>
                      <div className="text-xs text-gray-400">{timeAgo(client.created_at)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    {client.domain}
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="text-sm text-gray-700">{client.assistant_name}</div>
                  <div className="text-xs text-gray-400">{modeLabel(client.assistant_mode)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(client.status))}>
                      {statusLabel(client.status)}
                    </span>
                    {client.status === 'indexing' && (
                      <div className="w-20">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${client.index_progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-sm text-gray-700">{client.dialogs_used}</span>
                  <span className="text-xs text-gray-400">/{client.dialogs_limit}</span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-sm text-gray-700">{client.leads_used}</span>
                  <span className="text-xs text-gray-400">/{client.leads_limit}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
                  >
                    Открыть →
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
