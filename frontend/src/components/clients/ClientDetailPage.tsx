'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, dashboardApi } from '@/lib/api';
import { modeLabel } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Globe, RefreshCw, ExternalLink,
  MessageSquare, UserCheck, Database, Settings, BarChart3, TrendingUp,
  PlayCircle, Zap, Check, Copy, ShieldCheck,
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
  const [trialActive, setTrialActive] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const demoUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://194.26.138.166'}/api/v1/chat/demo/${client.domain}`;

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
            {/* Demo chat — always available */}
            <button
              onClick={() => window.open(demoUrl, '_blank')}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
              title="Открыть демо-чат — тест AI без подключения к сайту"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Демо-чат
            </button>
            {/* Activate trial — shows widget code in Settings */}
            {!trialActive ? (
              <button
                onClick={() => {
                  if (confirm(`Активировать Trial для ${client.name}?\n\nПосле активации клиент получит код виджета и сможет установить его на сайт.\n\nТриал — 14 дней бесплатно.`)) {
                    setTrialActive(true);
                  }
                }}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90 text-white"
                style={{ background: '#6b5fd4' }}
              >
                <Zap className="w-3.5 h-3.5" />
                Активировать Trial
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl"
                style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Trial активен
              </span>
            )}
            <button
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending || client.status === 'indexing'}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
              onMouseEnter={e => { if (!reindexMutation.isPending) e.currentTarget.style.background = 'var(--border-light)'; }}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reindexMutation.isPending ? 'animate-spin' : ''}`} />
              Обновить БЗ
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
          <div className="max-w-4xl space-y-5">
            {/* Demo chat CTA — prominent */}
            <div className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: '#f0fdf4', border: '1px solid #a7f3d0' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#d1fae5' }}>
                <PlayCircle style={{ width: 20, height: 20, color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#065f46' }}>Демо-чат готов</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                  База знаний проиндексирована. Откройте демо-чат и проверьте, как AI отвечает на вопросы.
                  Отправьте ссылку клиенту для тестирования.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => window.open(demoUrl, '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#10b981' }}>
                  <PlayCircle style={{ width: 14, height: 14 }} />
                  Открыть
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(demoUrl); alert('Ссылка скопирована!'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: '#a7f3d0', color: '#065f46' }}>
                  <Copy style={{ width: 14, height: 14 }} />
                  Скопировать ссылку
                </button>
              </div>
            </div>

            {/* Trial activation CTA — if not active */}
            {!trialActive && (
              <div className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: '#faf5ff', border: '1px solid #ddd6fe' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#ede9ff' }}>
                  <Zap style={{ width: 20, height: 20, color: '#6b5fd4' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#3730a3' }}>Следующий шаг — активировать Trial</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                    После активации клиент получит код виджета во вкладке «Настройки виджета» и сможет установить его на сайт.
                    Trial — 14 дней бесплатно.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Активировать Trial для ${client.name}?\n\nТриал — 14 дней бесплатно. Клиент получит код виджета.`)) {
                      setTrialActive(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                  style={{ background: '#6b5fd4' }}>
                  <Zap style={{ width: 14, height: 14 }} />
                  Активировать Trial
                </button>
              </div>
            )}

            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Диалогов сегодня" value={stats?.conversations_today ?? 0} />
              <StatBox label="Диалогов за неделю" value={stats?.conversations_week ?? 0}
                sub={`всего: ${stats?.conversations_total ?? 0}`} />
              <StatBox label="Лидов" value={stats?.leads_total ?? 0}
                sub={`новых: ${stats?.leads_new ?? 0}`} />
              <StatBox label="Страниц в БЗ" value={client.pages_indexed}
                sub={`качество: ${client.scan_quality}%`} />
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
        {activeTab === 'settings'      && <SettingsTab clientId={clientId} client={client} trialActive={trialActive} />}
      </div>
    </div>
  );
}
