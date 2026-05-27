'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import api from '@/lib/api';
import {
  Users, Lightbulb, User, Search, LayoutGrid, TrendingUp, Bot,
  RefreshCw, Loader2, ChevronDown, ChevronUp, Copy, Check,
  Clock, XCircle, Dna, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const DNA_SECTIONS = [
  { key: 'niche_analysis',   title: 'Анализ ниши',         icon: Lightbulb,  color: 'yellow' },
  { key: 'target_audience',  title: 'Целевая аудитория',   icon: Users,      color: 'blue'   },
  { key: 'avatars',          title: 'Аватары клиентов',    icon: User,       color: 'purple' },
  { key: 'search_scenarios', title: 'Сценарии поиска',     icon: Search,     color: 'green'  },
  { key: 'segments',         title: 'Сегментация',         icon: LayoutGrid, color: 'pink'   },
  { key: 'utps_headlines',   title: 'Заголовки и УТП',     icon: TrendingUp, color: 'orange' },
  { key: 'agent_settings',   title: 'Настройки AI-агента', icon: Bot,        color: 'indigo' },
] as const;

const colorBorder: Record<string, string> = {
  yellow: 'border-yellow-200 bg-yellow-50',
  blue:   'border-blue-200 bg-blue-50',
  purple: 'border-purple-200 bg-purple-50',
  green:  'border-green-200 bg-green-50',
  pink:   'border-pink-200 bg-pink-50',
  orange: 'border-orange-200 bg-orange-50',
  indigo: 'border-indigo-200 bg-indigo-50',
};
const iconColor: Record<string, string> = {
  yellow: 'text-yellow-600 bg-yellow-100',
  blue:   'text-blue-600 bg-blue-100',
  purple: 'text-purple-600 bg-purple-100',
  green:  'text-green-600 bg-green-100',
  pink:   'text-pink-600 bg-pink-100',
  orange: 'text-orange-600 bg-orange-100',
  indigo: 'text-indigo-600 bg-indigo-100',
};

function MarkdownBlock({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed space-y-1" style={{ color: 'var(--text)' }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        if (line.startsWith('## '))  return <h3 key={i} className="font-bold text-base mt-4 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <p key={i}>{parts.map((p, j) => p.startsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong> : p)}</p>;
      })}
    </div>
  );
}

function SectionCard({ title, icon: Icon, color, content, isReady }: {
  title: string; icon: React.ElementType; color: string;
  content: unknown; isReady: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = content ? (typeof content === 'string' ? content : JSON.stringify(content, null, 2)) : null;
  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={cn('border rounded-xl overflow-hidden', colorBorder[color])}>
      <button
        onClick={() => isReady && setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:opacity-90 transition-opacity"
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconColor[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text)' }}>{title}</span>
        {isReady
          ? (open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)
          : <span className="text-xs text-gray-400">ожидание...</span>
        }
      </button>
      {open && text && (
        <div className="border-t border-black/5 px-4 pb-4 pt-3">
          <div className="flex justify-end mb-2">
            <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
          <MarkdownBlock text={text} />
        </div>
      )}
    </div>
  );
}

export default function MarketingPageFull() {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
    onSuccess: (data) => {
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(data[0].id);
      }
    },
  } as Parameters<typeof useQuery>[0]);

  const { data: dnaData, isLoading } = useQuery({
    queryKey: ['marketing-dna', selectedClientId],
    queryFn: () => api.get(`/marketing/clients/${selectedClientId}/dna`).then(r => r.data),
    enabled: !!selectedClientId,
    refetchInterval: (query) =>
      (query.state.data as { status?: string } | undefined)?.status === 'running' ? 5_000 : false,
  });

  const rerunMutation = useMutation({
    mutationFn: () => api.post(`/marketing/clients/${selectedClientId}/dna/run`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-dna', selectedClientId] }),
  });

  const status: string = (dnaData as { status?: string } | undefined)?.status ?? 'none';
  const sections: Record<string, unknown> = (dnaData as { data?: Record<string, unknown> } | undefined)?.data ?? {};
  const selectedClient = clients?.find(c => c.id === selectedClientId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
              <Dna className="w-5 h-5" style={{ color: '#f97316' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>AI Маркетолог</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ДНК-анализ аудитории по 7 шагам</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Client selector */}
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)', minWidth: 180 }}
            >
              <option value="">Выберите клиента</option>
              {clients?.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.domain}</option>
              ))}
            </select>

            {selectedClient && (
              <Link
                href={`/clients/${selectedClient.id}`}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                style={{ color: 'var(--primary)', background: '#ede9ff' }}
              >
                Карточка клиента <ChevronRight className="w-3 h-3" />
              </Link>
            )}

            {selectedClientId && status === 'done' && (
              <button
                onClick={() => rerunMutation.mutate()}
                disabled={rerunMutation.isPending}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'transparent' }}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', rerunMutation.isPending && 'animate-spin')} />
                Обновить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedClientId ? (
          <div
            className="rounded-xl p-16 text-center max-w-lg mx-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Dna className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Выберите клиента для просмотра ДНК-анализа
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="max-w-4xl space-y-4">
            {/* Status banners */}
            {status === 'running' && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">ДНК-анализ запущен</p>
                  <p className="text-xs text-blue-600 mt-0.5">Анализирую по 7 шагам, ~2–5 минут.</p>
                </div>
              </div>
            )}
            {status === 'failed' && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">Ошибка анализа — проверьте API-ключи</p>
                </div>
                <button onClick={() => rerunMutation.mutate()} className="text-xs text-red-600 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100">
                  Повторить
                </button>
              </div>
            )}
            {status === 'none' && (
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <p className="text-sm text-orange-700">Анализ ещё не запускался для этого клиента</p>
                </div>
                <button
                  onClick={() => rerunMutation.mutate()}
                  disabled={rerunMutation.isPending}
                  className="text-xs text-orange-700 border border-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-100 disabled:opacity-50"
                >
                  {rerunMutation.isPending ? 'Запуск...' : 'Запустить анализ'}
                </button>
              </div>
            )}

            {/* DNA sections */}
            <div className="space-y-3">
              {DNA_SECTIONS.map(({ key, title, icon, color }) => (
                <SectionCard
                  key={key}
                  title={title}
                  icon={icon}
                  color={color}
                  content={sections[key] ?? null}
                  isReady={!!sections[key]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
