'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users, Lightbulb, User, Search, LayoutGrid, TrendingUp,
  Bot, RefreshCw, Loader2, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  yellow: 'bg-yellow-50 border-yellow-200',
  blue:   'bg-blue-50 border-blue-200',
  purple: 'bg-purple-50 border-purple-200',
  green:  'bg-green-50 border-green-200',
  pink:   'bg-pink-50 border-pink-200',
  orange: 'bg-orange-50 border-orange-200',
  indigo: 'bg-indigo-50 border-indigo-200',
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
    <div className="text-sm text-gray-800 leading-relaxed space-y-1">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        if (line.startsWith('## '))  return <h3 key={i} className="font-bold text-gray-900 text-base mt-4 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return <p key={i}>{parts.map((p, j) => p.startsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong> : p)}</p>;
      })}
    </div>
  );
}

function SectionCard({
  title, icon: Icon, color, content, isReady,
}: {
  title: string; icon: React.ElementType; color: string;
  content: unknown; isReady: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = content
    ? (typeof content === 'string' ? content : JSON.stringify(content, null, 2))
    : null;

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
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconColor[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="flex-1 font-medium text-gray-900 text-sm">{title}</span>
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

export default function MarketingTab({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['marketing-dna', clientId],
    queryFn: () => api.get(`/marketing/clients/${clientId}/dna`).then(r => r.data),
    refetchInterval: (query) =>
      (query.state.data as { status?: string } | undefined)?.status === 'running' ? 5_000 : false,
  });

  const rerunMutation = useMutation({
    mutationFn: () => api.post(`/marketing/clients/${clientId}/dna/run`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-dna', clientId] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const status: string = (data as { status?: string } | undefined)?.status ?? 'none';
  const dnaData: Record<string, unknown> = (data as { data?: Record<string, unknown> } | undefined)?.data ?? {};

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ДНК-Анализ</h2>
          <p className="text-sm text-gray-500 mt-0.5">Автоматический маркетинговый анализ по 7 шагам</p>
        </div>
        {status === 'done' && (
          <button
            onClick={() => rerunMutation.mutate()}
            disabled={rerunMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', rerunMutation.isPending && 'animate-spin')} />
            Обновить анализ
          </button>
        )}
      </div>

      {/* Статус-баннер */}
      {status === 'running' && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">ДНК-анализ запущен</p>
            <p className="text-xs text-blue-600 mt-0.5">Анализирую по 7 шагам, ~2–5 минут. Результаты появляются по мере готовности.</p>
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
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">Анализ запустится автоматически после сканирования сайта</p>
          </div>
          <button onClick={() => rerunMutation.mutate()} disabled={rerunMutation.isPending} className="text-xs text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50">
            Запустить сейчас
          </button>
        </div>
      )}

      {/* Секции */}
      <div className="space-y-3">
        {DNA_SECTIONS.map(({ key, title, icon, color }) => (
          <SectionCard
            key={key}
            title={title}
            icon={icon}
            color={color}
            content={dnaData[key] ?? null}
            isReady={!!dnaData[key]}
          />
        ))}
      </div>

      {/* Чеклист прогресса (только пока идёт анализ) */}
      {status === 'running' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Прогресс</p>
          <div className="space-y-2">
            {DNA_SECTIONS.map(({ key, title }) => (
              <div key={key} className="flex items-center gap-3">
                {dnaData[key]
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
                }
                <span className={cn('text-xs', dnaData[key] ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
