'use client';

import { useState } from 'react';
import {
  Search, RefreshCw, Eye, Plus, X, Globe, AlertCircle,
  CheckCircle2, Clock, Loader2, Download, ChevronRight,
} from 'lucide-react';
import { DEMO_SCANS } from '@/lib/demo-data';
import { timeAgo } from '@/lib/utils';

const SCAN_LIMIT = 7;
const SCAN_USED  = 7;

type ScanStatus = 'active' | 'error' | 'indexing' | 'pending';

interface ScanItem {
  id: string;
  name: string;
  domain: string;
  language: string;
  status: ScanStatus;
  pages: number;
  analyzed_at: string;
  quality: number;
}

const STATUS_MAP: Record<ScanStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: 'Активный',   color: '#10b981', bg: '#d1fae5', icon: CheckCircle2 },
  error:    { label: 'Ошибка',     color: '#ef4444', bg: '#fee2e2', icon: AlertCircle },
  indexing: { label: 'Сканирует',  color: '#3b82f6', bg: '#dbeafe', icon: Loader2 },
  pending:  { label: 'Очередь',    color: '#f97316', bg: '#ffedd5', icon: Clock },
};

function StatusBadge({ status }: { status: ScanStatus }) {
  const s = STATUS_MAP[status];
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      <Icon style={{ width: 10, height: 10 }} />
      {s.label}
    </span>
  );
}

function QualityDot({ q }: { q: number }) {
  const color = q >= 80 ? '#10b981' : q >= 60 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-sm font-medium" style={{ color: '#374151' }}>{q}%</span>
    </div>
  );
}

export default function ScannerPage() {
  const [url, setUrl] = useState('');
  const [lang, setLang] = useState('ru');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [scans] = useState<ScanItem[]>(DEMO_SCANS as ScanItem[]);
  const [viewItem, setViewItem] = useState<ScanItem | null>(null);

  const filtered = scans.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.domain.toLowerCase().includes(search.toLowerCase())
  );

  const handleScan = () => {
    if (!url.trim()) return;
    setScanning(true);
    setTimeout(() => setScanning(false), 2500);
  };

  const pctUsed = Math.round((SCAN_USED / SCAN_LIMIT) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>AI Сканер</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          Расширенный анализ веб-сайтов клиентов — умное сканирование + ДНК-анализ
        </p>
      </div>

      {/* Scan form */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        {/* Warning banner */}
        <div
          className="flex items-start gap-3 rounded-lg p-3 mb-4"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <AlertCircle style={{ width: 15, height: 15, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1 text-xs" style={{ color: '#92400e' }}>
            <strong>Внимание: сканирование использует ресурсы сервера.</strong>
            <br />Не покидайте эту страницу, пока выполняется сканирование. Сканирование может быть прервано.
          </div>
          <div
            className="text-xs font-semibold flex-shrink-0"
            style={{ color: pctUsed >= 80 ? '#dc2626' : '#6b5fd4' }}
          >
            {SCAN_USED} из {SCAN_LIMIT} сканов использовано
          </div>
        </div>

        {/* Usage bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#9ca3af' }}>
            <span>Использовано в этом месяце</span>
            <span>{pctUsed}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pctUsed}%`, background: pctUsed >= 80 ? '#ef4444' : '#6b5fd4' }}
            />
          </div>
        </div>

        {!batchMode ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>URL веб-сайта</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e5e7eb', color: '#111827' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
              />
            </div>
            <div style={{ width: 160 }}>
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>Язык анализа</label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e5e7eb', color: '#111827' }}
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇺🇸 English</option>
                <option value="kz">🇰🇿 Казахский</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>
              Добавить несколько сайтов (каждый с новой строки)
            </label>
            <textarea
              placeholder={'https://site1.ru\nhttps://site2.ru\nhttps://site3.ru'}
              value={batchUrls}
              onChange={e => setBatchUrls(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#e5e7eb', color: '#111827' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleScan}
            disabled={scanning || (!url.trim() && !batchUrls.trim())}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#6b5fd4' }}
          >
            {scanning ? (
              <>
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                Сканирование...
              </>
            ) : (
              <>
                <Search style={{ width: 14, height: 14 }} />
                Начать расширенный анализ
              </>
            )}
          </button>
          <button
            onClick={() => setBatchMode(b => !b)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e5e7eb', color: '#374151' }}
          >
            {batchMode ? <X style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
            {batchMode ? 'Одиночный режим' : 'Добавить несколько сайтов'}
          </button>
        </div>
      </div>

      {/* Recent scans */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#f3f4f6' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>Недавние сканирования</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Профили компаний, проанализированные с помощью AI</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none w-40"
                style={{ borderColor: '#e5e7eb', color: '#111827' }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: '#10b981' }}
              onClick={() => alert('Экспорт CSV — скоро!')}
            >
              <Download style={{ width: 12, height: 12 }} />
              Экспорт CSV
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafaf9' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Сайт</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Язык</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Качество</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Статус</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Проанализировано</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((scan, i) => (
              <tr
                key={scan.id}
                className="transition-colors hover:bg-[#fafaf9]"
                style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: '#ede9ff', color: '#6b5fd4' }}
                    >
                      {scan.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#111827' }}>{scan.name}</div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{scan.domain}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: '#f3f4f6', color: '#374151' }}>
                    🇷🇺 {scan.language.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <QualityDot q={scan.quality} />
                  <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{scan.pages} страниц</div>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={scan.status} />
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: '#9ca3af' }}>
                  {timeAgo(scan.analyzed_at)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      title="Посмотреть результат"
                      onClick={() => setViewItem(scan)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#ede9ff]"
                    >
                      <Eye style={{ width: 14, height: 14, color: '#6b5fd4' }} />
                    </button>
                    <button
                      title="Пересканировать"
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#d1fae5]"
                    >
                      <RefreshCw style={{ width: 14, height: 14, color: '#10b981' }} />
                    </button>
                    <button
                      title="Открыть клиента"
                      onClick={() => window.location.href = `/clients/${scan.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#f3f4f6]"
                    >
                      <ChevronRight style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setViewItem(null)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: '#111827' }}>{viewItem.name}</h3>
              <button onClick={() => setViewItem(null)}>
                <X style={{ width: 16, height: 16, color: '#9ca3af' }} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>Домен</span>
                <a href={`https://${viewItem.domain}`} target="_blank" rel="noreferrer"
                  className="font-medium" style={{ color: '#6b5fd4' }}>
                  {viewItem.domain} ↗
                </a>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>Страниц проиндексировано</span>
                <span className="font-medium" style={{ color: '#111827' }}>{viewItem.pages}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>Качество базы</span>
                <QualityDot q={viewItem.quality} />
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>Статус</span>
                <StatusBadge status={viewItem.status} />
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b7280' }}>Последний анализ</span>
                <span style={{ color: '#374151' }}>{timeAgo(viewItem.analyzed_at)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setViewItem(null); window.location.href = `/clients/${viewItem.id}`; }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#6b5fd4' }}
              >
                Открыть карточку клиента
              </button>
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 rounded-xl text-sm border"
                style={{ borderColor: '#e5e7eb', color: '#374151' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
