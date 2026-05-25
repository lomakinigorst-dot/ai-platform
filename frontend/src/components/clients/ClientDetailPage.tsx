'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, dashboardApi } from '@/lib/api';
import { statusColor, statusLabel, modeLabel, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Globe, RefreshCw, Trash2, ExternalLink,
  MessageSquare, UserCheck, Database, Settings, BarChart3
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import LeadsTab from './tabs/LeadsTab';
import KnowledgeTab from './tabs/KnowledgeTab';
import SettingsTab from './tabs/SettingsTab';
import ConversationsTab from './tabs/ConversationsTab';

const TABS = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'leads', label: 'Лиды', icon: UserCheck },
  { id: 'conversations', label: 'Диалоги', icon: MessageSquare },
  { id: 'knowledge', label: 'База знаний', icon: Database },
  { id: 'settings', label: 'Настройки', icon: Settings },
] as const;

type Tab = typeof TABS[number]['id'];

export default function ClientDetailPage({ clientId }: { clientId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.get(clientId),
    refetchInterval: (query) => query.state.data?.status === 'indexing' ? 3_000 : false,
  });

  const { data: stats } = useQuery({
    queryKey: ['client-stats', clientId],
    queryFn: () => dashboardApi.clientStats(clientId),
    enabled: !!client,
  });

  const reindexMutation = useMutation({
    mutationFn: () => clientsApi.reindex(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', clientId] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-gray-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Link href="/clients" className="text-blue-600 text-sm">← Назад</Link>
        <p className="mt-4 text-gray-500">Клиент не найден</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href="/clients" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" />
          Назад к клиентам
        </Link>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {client.assistant_avatar_url ? (
              <img src={client.assistant_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-700 font-bold text-lg">{client.assistant_name?.[0] ?? 'A'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(client.status))}>
                {statusLabel(client.status)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <a
                href={`https://${client.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
              >
                <Globe className="w-3.5 h-3.5" />
                {client.domain}
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-sm text-gray-400">{modeLabel(client.assistant_mode)}</span>
              {client.niche && <span className="text-sm text-gray-400">{client.niche}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`http://localhost:8000/api/v1/chat/demo/${client.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Demo
            </a>
            <button
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending || client.status === 'indexing'}
              className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', reindexMutation.isPending && 'animate-spin')} />
              Переиндексировать
            </button>
          </div>
        </div>

        {/* Indexing progress */}
        {client.status === 'indexing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Индексация сайта...</span>
              <span>{client.pages_indexed}/{client.pages_total} страниц · {Math.round(client.index_progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${client.index_progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Диалогов сегодня" value={stats?.conversations_today ?? 0} icon={MessageSquare} />
              <StatCard label="Диалогов за неделю" value={stats?.conversations_week ?? 0} icon={MessageSquare} trend={`всего: ${stats?.conversations_total ?? 0}`} />
              <StatCard label="Лидов" value={stats?.leads_total ?? 0} icon={UserCheck} trend={`новых: ${stats?.leads_new ?? 0}`} />
              <StatCard label="Чанков БЗ" value={stats?.knowledge_chunks ?? 0} icon={Database} trend={`${client.pages_indexed} страниц`} />
            </div>

            {/* Embed code */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Код для вставки на сайт</h3>
              <p className="text-sm text-gray-500 mb-3">
                Скопируйте этот код и вставьте перед <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> на сайте клиента
              </p>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
{`<script>
  window.AIPlatformConfig = {
    apiBase: 'http://localhost:8000',
    domain:  '${client.domain}',
    name:    '${client.assistant_name}',
    triggerDelay: 5000,
  };
</script>
<script src="http://localhost:8000/static/widget/widget.js" async></script>`}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `<script>\n  window.AIPlatformConfig = {\n    apiBase: 'http://localhost:8000',\n    domain:  '${client.domain}',\n    name:    '${client.assistant_name}',\n    triggerDelay: 5000,\n  };\n</script>\n<script src="http://localhost:8000/static/widget/widget.js" async></script>`
                  );
                }}
                className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Скопировать код
              </button>
            </div>
          </div>
        )}

        {activeTab === 'leads' && <LeadsTab clientId={clientId} />}
        {activeTab === 'conversations' && <ConversationsTab clientId={clientId} />}
        {activeTab === 'knowledge' && <KnowledgeTab clientId={clientId} />}
        {activeTab === 'settings' && <SettingsTab clientId={clientId} client={client} />}
      </div>
    </div>
  );
}
