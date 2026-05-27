'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, dashboardApi } from '@/lib/api';
import { modeLabel } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Globe, RefreshCw, ExternalLink,
  MessageSquare, UserCheck, Database, Settings, BarChart3, TrendingUp
} from 'lucide-react';
import LeadsTab from './tabs/LeadsTab';
import KnowledgeTab from './tabs/KnowledgeTab';
import SettingsTab from './tabs/SettingsTab';
import ConversationsTab from './tabs/ConversationsTab';
import MarketingTab from './tabs/MarketingTab';

const TABS = [
  { id: 'overview',      label: 'Обзор',        icon: BarChart3     },
  { id: 'leads',         label: 'Лиды',          icon: UserCheck     },
  { id: 'conversations', label: 'Диалоги',       icon: MessageSquare },
  { id: 'knowledge',     label: 'База знаний',   icon: Database      },
  { id: 'marketing',     label: 'Маркетолог',    icon: TrendingUp    },
  { id: 'settings',      label: 'Настройки',     icon: Settings      },
] as const;

type Tab = typeof TABS[number]['id'];

function StatBox({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      <div className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{sub}</div>}
    </div>
  );
}

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
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm" style={{ color: 'var(--text-subtle)' }}>Загрузка...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Link href="/clients" className="text-sm" style={{ color: 'var(--primary)' }}>← Назад</Link>
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Клиент не найден</p>
      </div>
    );
  }

  const demoUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000'}/api/v1/chat/demo/${client.domain}`;

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div
        className="flex-shrink-0 border-b px-6 pt-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          <Link href="/clients" className="flex items-center gap-1 hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-3.5 h-3.5" />
            Клиенты
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ color: 'var(--text)' }}>{client.name}</span>
        </div>

        {/* Client info row */}
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden text-base font-bold flex-shrink-0"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
          >
            {client.assistant_avatar_url ? (
              <img src={client.assistant_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (client.assistant_name?.[0] ?? 'A').toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{client.name}</h1>
              {client.niche && (
                <span
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}
                >
                  {client.niche}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <a
                href={`https://${client.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: 'var(--text-subtle)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
              >
                <Globe className="w-3 h-3" />
                {client.domain}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{modeLabel(client.assistant_mode)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { navigator.clipboard.writeText(demoUrl); window.open(demoUrl, '_blank'); }}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Демо
            </button>
            <button
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending || client.status === 'indexing'}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
              onMouseEnter={e => { if (!reindexMutation.isPending) e.currentTarget.style.background = 'var(--border-light)'; }}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reindexMutation.isPending ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>
        </div>

        {/* Indexing progress */}
        {client.status === 'indexing' && (
          <div className="mt-3 pb-1">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              <span>Индексация сайта...</span>
              <span>{client.pages_indexed}/{client.pages_total} страниц · {Math.round(client.index_progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-light)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${client.index_progress}%`, background: 'var(--primary)' }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 mt-3 -mx-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2"
              style={{
                borderBottomColor: activeTab === id ? 'var(--primary)' : 'transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="max-w-4xl space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Диалогов сегодня" value={stats?.conversations_today ?? 0} />
              <StatBox
                label="Диалогов за неделю"
                value={stats?.conversations_week ?? 0}
                sub={`всего: ${stats?.conversations_total ?? 0}`}
              />
              <StatBox
                label="Лидов"
                value={stats?.leads_total ?? 0}
                sub={`новых: ${stats?.leads_new ?? 0}`}
              />
              <StatBox
                label="Чанков БЗ"
                value={stats?.knowledge_chunks ?? 0}
                sub={`${client.pages_indexed} страниц`}
              />
            </div>

            {/* Widget embed */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
            >
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Код для вставки</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Вставьте перед{' '}
                <code
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: 'var(--border-light)', color: 'var(--text)' }}
                >
                  &lt;/body&gt;
                </code>{' '}
                на сайте клиента
              </p>
              <pre
                className="rounded-xl p-4 text-xs overflow-x-auto leading-relaxed"
                style={{ background: '#0f0f23', color: '#a9dc76' }}
              >
{`<script>
  window.AIPlatformConfig = {
    apiBase: '${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000'}',
    domain:  '${client.domain}',
    name:    '${client.assistant_name}',
    triggerDelay: 5000,
  };
</script>
<script src="${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000'}/static/widget/widget.js" async></script>`}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(
                  `<script>\n  window.AIPlatformConfig = {\n    apiBase: '${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') ?? 'http://localhost:8000'}',\n    domain:  '${client.domain}',\n    name:    '${client.assistant_name}',\n    triggerDelay: 5000,\n  };\n</script>\n<script src="${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') ?? 'http://localhost:8000'}/static/widget/widget.js" async></script>`
                )}
                className="mt-3 text-sm font-medium transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                Скопировать код
              </button>
            </div>
          </div>
        )}

        {activeTab === 'leads'         && <LeadsTab clientId={clientId} />}
        {activeTab === 'conversations' && <ConversationsTab clientId={clientId} />}
        {activeTab === 'knowledge'     && (
          <KnowledgeTab
            clientId={clientId}
            scanQuality={client.scan_quality}
            needsDeepScan={client.needs_deep_scan}
            isIndexing={client.status === 'indexing'}
            scanPhase={client.scan_phase}
          />
        )}
        {activeTab === 'marketing'     && <MarketingTab clientId={clientId} />}
        {activeTab === 'settings'      && <SettingsTab clientId={clientId} client={client} />}
      </div>
    </div>
  );
}
