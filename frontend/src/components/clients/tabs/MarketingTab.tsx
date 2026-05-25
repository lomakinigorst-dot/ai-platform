'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';
import { TrendingUp, Users, Lightbulb, FileText, BarChart2, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'target_audience',    title: 'Целевая аудитория',       icon: Users,       color: 'blue' },
  { id: 'value_proposition',  title: 'УТП и позиционирование',  icon: Lightbulb,   color: 'yellow' },
  { id: 'content_strategy',   title: 'Контент-стратегия',       icon: FileText,    color: 'green' },
  { id: 'sales_scripts',      title: 'Скрипты продаж',          icon: TrendingUp,  color: 'purple' },
  { id: 'competitor_analysis',title: 'Анализ конкурентов',      icon: BarChart2,   color: 'red' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

const colorMap: Record<string, string> = {
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  green:  'bg-green-50 border-green-200 text-green-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  red:    'bg-red-50 border-red-200 text-red-700',
};

const iconBg: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  green:  'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  red:    'bg-red-100 text-red-600',
};

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-gray-900 mt-4 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{line.slice(4)}</h4>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-900">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc">{renderInline(line.slice(2))}</li>;
        if (/^\d+\. /.test(line)) return <li key={i} className="ml-4 list-decimal">{renderInline(line.replace(/^\d+\. /, ''))}</li>;
        if (line === '') return <div key={i} className="h-2" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p);
}

export default function MarketingTab({ clientId }: { clientId: string }) {
  const [results, setResults] = useState<Partial<Record<SectionId, string>>>({});
  const [loading, setLoading] = useState<SectionId | null>(null);
  const [expanded, setExpanded] = useState<SectionId | null>(null);
  const [copied, setCopied] = useState<SectionId | null>(null);
  const [competitorUrls, setCompetitorUrls] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const runSection = async (sectionId: SectionId) => {
    if (loading) return;
    setLoading(sectionId);
    setExpanded(sectionId);
    setResults(r => ({ ...r, [sectionId]: '' }));

    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing/clients/${clientId}/analyze/${sectionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            competitor_urls: competitorUrls.split('\n').map(s => s.trim()).filter(Boolean),
          }),
          signal: abortRef.current.signal,
        }
      );

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) setResults(r => ({ ...r, [sectionId]: (r[sectionId] ?? '') + data.text }));
          } catch {}
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setResults(r => ({ ...r, [sectionId]: (r[sectionId] ?? '') + '\n\n_Ошибка генерации_' }));
      }
    } finally {
      setLoading(null);
    }
  };

  const copySection = (sectionId: SectionId) => {
    const text = results[sectionId];
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(sectionId);
    setTimeout(() => setCopied(null), 2000);
  };

  const allDone = SECTIONS.every(s => results[s.id]);

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-xl font-bold">AI-Маркетолог</h2>
        </div>
        <p className="text-blue-100 text-sm">
          Автоматический маркетинговый анализ на основе базы знаний компании.
          Каждый раздел генерируется отдельно — можно запускать выборочно.
        </p>

        {/* Competitor URLs */}
        <div className="mt-4">
          <label className="block text-blue-100 text-xs font-medium mb-1.5">
            Сайты конкурентов (опционально, по одному на строку)
          </label>
          <textarea
            value={competitorUrls}
            onChange={e => setCompetitorUrls(e.target.value)}
            placeholder="https://competitor1.ru&#10;https://competitor2.ru"
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-300 text-xs resize-none focus:outline-none focus:bg-white/20"
          />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ id, title, icon: Icon, color }) => {
        const result = results[id];
        const isLoading = loading === id;
        const isExpanded = expanded === id;

        return (
          <div key={id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-4 p-5">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg[color])}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{title}</div>
                {result && !isLoading && (
                  <div className="text-xs text-green-600 mt-0.5">✓ Готово</div>
                )}
                {isLoading && (
                  <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Генерируется...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {result && (
                  <button
                    onClick={() => copySection(id)}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    title="Скопировать"
                  >
                    {copied === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}

                {result && (
                  <button
                    onClick={() => setExpanded(isExpanded ? null : id)}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={() => runSection(id)}
                  disabled={!!loading}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    result
                      ? 'border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
                  )}
                >
                  {isLoading ? 'Стоп' : result ? 'Повторить' : 'Запустить'}
                </button>
              </div>
            </div>

            {/* Result */}
            {(isExpanded || isLoading) && result !== undefined && (
              <div className={cn('border-t border-gray-100 p-5', colorMap[color])}>
                {result ? (
                  <MarkdownText text={result} />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Генерация анализа...
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Run all button */}
      {!allDone && (
        <button
          onClick={() => SECTIONS.forEach((s, i) => setTimeout(() => runSection(s.id), i * 100))}
          disabled={!!loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Генерация...</>
          ) : (
            <><TrendingUp className="w-4 h-4" /> Запустить полный анализ</>
          )}
        </button>
      )}
    </div>
  );
}
