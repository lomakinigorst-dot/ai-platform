'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users, Lightbulb, User, Search, LayoutGrid, TrendingUp,
  Bot, RefreshCw, Loader2, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, Copy, Check, Plus, Trash2, Edit2,
  Globe, AlertCircle, Zap, X,
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

// ─── Editable list (UTPs / Pains / How we close) ──────────────────────────────

function EditableList({ label, items, onChange, color = '#f97316' }: {
  label: string; items: string[]; onChange: (items: string[]) => void; color?: string;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>{label}</p>
        <button
          onClick={() => { onChange([...items, '']); setEditing(items.length); setDraft(''); }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ color, background: color + '12' }}>
          <Plus style={{ width: 11, height: 11 }} /> Добавить
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => editing === i ? (
          <div key={i} className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { const n = [...items]; n[i] = draft; onChange(n); setEditing(null); }
                if (e.key === 'Escape') { if (!item) onChange(items.filter((_, j) => j !== i)); setEditing(null); }
              }}
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: color }}
            />
            <button onClick={() => { const n = [...items]; n[i] = draft; onChange(n); setEditing(null); }}>
              <Check style={{ width: 14, height: 14, color: '#10b981' }} />
            </button>
            <button onClick={() => { if (!item) onChange(items.filter((_, j) => j !== i)); setEditing(null); }}>
              <X style={{ width: 14, height: 14, color: '#9ca3af' }} />
            </button>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-2 group px-3 py-2 rounded-lg"
            style={{ background: '#f9fafb', border: '1px solid #f0f0f5' }}>
            <span className="flex-1 text-sm" style={{ color: '#374151' }}>{item || <em style={{ color: '#d1d5db' }}>Пусто</em>}</span>
            <button onClick={() => { setEditing(i); setDraft(item); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 style={{ width: 12, height: 12, color: '#9ca3af' }} />
            </button>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 style={{ width: 12, height: 12, color: '#ef4444' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Default UTPs when DNA not yet done ──────────────────────────────────────

const DEFAULT_UTPS = ['Быстрый ответ на запросы 24/7', 'Персональный подход к каждому клиенту'];
const DEFAULT_PAINS = ['Долгое ожидание ответа', 'Потеря заявок в нерабочее время'];
const DEFAULT_CLOSE = ['Бесплатное демо', 'Гарантия результата за 14 дней'];

// ─── Competitor UTP suggestions ──────────────────────────────────────────────

const COMP_SUGGESTIONS: Record<string, string[]> = {
  default: [
    'Персонализация без ручной настройки — AI сам определяет сегмент',
    'Мгновенная передача лида с полным контекстом диалога',
  ],
};

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

  const [utps, setUtps] = useState(DEFAULT_UTPS);
  const [pains, setPains] = useState(DEFAULT_PAINS);
  const [howClose, setHowClose] = useState(DEFAULT_CLOSE);
  const [savedSnapshot, setSavedSnapshot] = useState(DEFAULT_UTPS);
  const [kbDialog, setKbDialog] = useState(false);

  type CompEntry = { url: string; status: 'scanning' | 'done'; found: number };
  type Suggestion = { text: string; status: 'pending' | 'applied' | 'rejected' };
  const [competitors, setCompetitors] = useState<CompEntry[]>([]);
  const [newComp, setNewComp] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleAddComp = () => {
    if (!newComp.trim()) return;
    const url = newComp.trim();
    setCompetitors(prev => [...prev, { url, status: 'scanning', found: 0 }]);
    setNewComp('');
    setTimeout(() => {
      setCompetitors(prev => prev.map(c =>
        c.status === 'scanning' ? { ...c, status: 'done', found: Math.floor(Math.random() * 8) + 5 } : c
      ));
      const suggs = COMP_SUGGESTIONS[url] ?? COMP_SUGGESTIONS.default;
      setSuggestions(prev => [
        ...prev.filter(s => s.status !== 'pending'),
        ...suggs.map(t => ({ text: t, status: 'pending' as const })),
      ]);
    }, 2500);
  };

  const handleSave = () => {
    const added = utps.filter(u => !savedSnapshot.includes(u)).length;
    const removed = savedSnapshot.filter(u => !utps.includes(u)).length;
    setSavedSnapshot([...utps]);
    if (added + removed >= 2) setKbDialog(true);
  };

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
    <div className="max-w-4xl space-y-5">
      {/* Header */}
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

      {/* Секции ДНК */}
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

      {/* Прогресс при анализе */}
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

      {/* ─── Позиционирование клиента (редактируемые УТП) ─────────────── */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Позиционирование клиента</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#f97316' }}>
            Влияет на ответы AI-ассистента
          </span>
        </div>
        <div className="space-y-5">
          <EditableList label="УТП клиента" items={utps} onChange={setUtps} color="#f97316" />
          <EditableList label="Боли аудитории" items={pains} onChange={setPains} color="#ef4444" />
          <EditableList label="Как закрываем возражения" items={howClose} onChange={setHowClose} color="#10b981" />
        </div>
        <div className="mt-4 pt-4 flex justify-end gap-2" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-white"
            style={{ background: '#f97316' }}>
            <Check style={{ width: 12, height: 12 }} />
            Сохранить
          </button>
        </div>
      </div>

      {/* ─── Анализ конкурентов клиента ───────────────────────────────── */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Конкуренты клиента</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#d1fae5', color: '#065f46' }}>
            AI предложит улучшения УТП
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={newComp}
            onChange={e => setNewComp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddComp()}
            placeholder="конкурент.ru или https://..."
            className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
          <button onClick={handleAddComp}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ background: '#f97316' }}>
            <Globe style={{ width: 14, height: 14 }} />
            Добавить
          </button>
        </div>

        {competitors.length > 0 && (
          <div className="space-y-2 mb-3">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{ background: '#f9fafb', border: '1px solid #f0f0f5' }}>
                <div className="flex items-center gap-2">
                  <Globe style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  <span className="text-sm font-medium" style={{ color: '#374151' }}>{c.url}</span>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === 'scanning' ? (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#f97316' }}>
                      <RefreshCw style={{ width: 10, height: 10 }} className="animate-spin" />
                      Сканирую...
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: '#10b981' }}>✓ {c.found} элементов</span>
                  )}
                  <button onClick={() => setCompetitors(prev => prev.filter((_, j) => j !== i))}>
                    <Trash2 style={{ width: 13, height: 13, color: '#d1d5db' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions from scan */}
        {suggestions.filter(s => s.status === 'pending').length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #fde68a' }}>
            <div className="px-4 py-2.5" style={{ background: '#fef9c3', borderBottom: '1px solid #fde68a' }}>
              <span className="text-xs font-semibold" style={{ color: '#92400e' }}>
                AI предлагает {suggestions.filter(s => s.status === 'pending').length} улучшения УТП
              </span>
            </div>
            {suggestions.map((sug, i) => sug.status !== 'pending' ? null : (
              <div key={i} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                <div className="flex items-start gap-3">
                  <p className="flex-1 text-sm" style={{ color: '#374151' }}>{sug.text}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setUtps(prev => [...prev, sug.text]);
                        setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, status: 'applied' as const } : s));
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium text-white" style={{ background: '#10b981' }}>
                      Применить
                    </button>
                    <button
                      onClick={() => setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, status: 'rejected' as const } : s))}
                      className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#fca5a5', color: '#ef4444' }}>
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Усилить анализ */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap style={{ width: 13, height: 13, color: '#6b5fd4' }} />
            <span className="text-xs font-semibold" style={{ color: '#6b5fd4' }}>Усилить анализ</span>
          </div>
          <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>
            Добавьте несколько URL конкурентов — AI предложит улучшенные УТП для этого клиента.
          </p>
        </div>
      </div>

      {/* KB update dialog */}
      {kbDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setKbDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#ede9ff' }}>
              <Bot style={{ width: 22, height: 22, color: '#6b5fd4' }} />
            </div>
            <h3 className="text-base font-semibold text-center mb-2" style={{ color: '#111827' }}>
              Обновить базу знаний?
            </h3>
            <p className="text-sm text-center mb-5" style={{ color: '#6b7280' }}>
              Вы внесли значительные изменения в УТП клиента. Обновить базу знаний AI-ассистента, чтобы он использовал новые аргументы в диалогах?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setKbDialog(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>
                Не сейчас
              </button>
              <button onClick={() => setKbDialog(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#6b5fd4' }}>
                Обновить БЗ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
