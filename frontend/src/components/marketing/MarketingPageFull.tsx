'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Dna, Megaphone, Radio, Users, Sparkles, ScrollText, Lock,
  Plus, Trash2, RefreshCw, Download, Globe, Send, AlertCircle,
  ChevronDown, Check, X, Zap, Mail, MessageSquare, Phone, Bot,
  Clock, ArrowRight, ToggleLeft, ToggleRight, Info, Edit2,
  FileText, Calendar, Image, Camera, Video,
} from 'lucide-react';

// ─── Demo data ───────────────────────────────────────────────────────────────

const DEMO_UTPS = [
  'Готовый AI-виджет за 24 часа без программистов',
  'База знаний из сайта клиента — автоматически',
  'Лиды в Telegram и CRM в режиме реального времени',
  'Партнёрская маржа 30% с каждого клиента',
];
const DEMO_PAINS = [
  'Менеджеры не успевают отвечать ночью и в выходные',
  'Клиенты уходят к конкурентам пока ждут ответа',
  'Сложно обучить нового сотрудника за счёт скриптов',
  'CRM заполняется вручную — много ошибок',
];
const DEMO_HOW_WE_CLOSE = [
  'Бесплатный демо-чат на базе знаний клиента',
  '14-дневный Trial с полным функционалом',
  'Кейс-пак: 3 реальных клиента с метриками',
  'Гарантия: первый лид за 7 дней или возврат',
];
const DEMO_SEGMENTS = [
  { name: 'Горячие лиды', size: 18,  pct: 82,  color: '#ef4444' },
  { name: 'Тёплые (открыли демо)',   size: 47,  pct: 61,  color: '#f97316' },
  { name: 'Холодные (не открыли)',   size: 112, pct: 28,  color: '#6b7280' },
  { name: 'Trial пользователи',      size: 9,   pct: 100, color: '#10b981' },
  { name: 'Отток (>14 дней молчат)', size: 23,  pct: 15,  color: '#3b82f6' },
];
const DEMO_COMPETITORS = [
  { url: 'suvvy.ai',  status: 'done', found: 12 },
  { url: 'intly.io',  status: 'done', found: 9  },
];
const COMPETITOR_UTP_SUGGESTIONS: Record<string, string[]> = {
  'suvvy.ai': [
    'AI-ассистент без лимита диалогов на всех тарифах',
    'Белый лейбл для агентств без дополнительной оплаты',
    'Готовая интеграция с Битрикс24 и amoCRM в 1 клик',
  ],
  'intly.io': [
    'Запуск виджета за 30 минут без технического специалиста',
    'База знаний из любого источника: сайт, PDF, Google Doc',
  ],
  default: [
    'Персонализация под каждый сегмент без ручной настройки',
    'Мгновенная передача лида с полным контекстом диалога',
  ],
};
const DEMO_CAMPAIGNS = [
  { id: 'c1', name: 'Reactivation — апрель',      channels: ['email','tg'],  segment: 'Отток', status: 'done',   period: '01–07 апр', sent: 23, open_rate: '41%', leads: 3 },
  { id: 'c2', name: 'Trial → Paid upsell',         channels: ['email'],       segment: 'Trial', status: 'active', period: 'Текущий',  sent: 9,  open_rate: '67%', leads: 2 },
  { id: 'c3', name: 'Холодный старт (май)',         channels: ['email','wa'],  segment: 'Холодные', status: 'draft', period: '—',      sent: 0,  open_rate: '—',   leads: 0 },
];
const DEMO_BROADCASTS = [
  { id: 'b1', name: 'Добро пожаловать',         active: true,  segment: 'Все новые', delay: 'сразу', channels: ['email','tg'], sent: 47 },
  { id: 'b2', name: 'Напоминание о демо-чате',  active: true,  segment: 'Тёплые',    delay: 'День 3', channels: ['email'],     sent: 31 },
  { id: 'b3', name: 'Trial заканчивается',      active: false, segment: 'Trial',     delay: 'День 12', channels: ['tg','wa'],  sent: 0  },
  { id: 'b4', name: 'Апсейл в Pro',             active: false, segment: 'Trial',     delay: 'День 14', channels: ['email'],    sent: 0  },
];
const DEMO_LOG = [
  { id: 1, ts: '27 мая, 14:32', actor: 'AI',    text: 'ДНК-анализ обновлён — найдено 3 новых УТП конкурентов (suvvy.ai)' },
  { id: 2, ts: '27 мая, 12:01', actor: 'Игорь', text: 'Изменены УТП — добавлено «Гарантия: первый лид за 7 дней»' },
  { id: 3, ts: '26 мая, 09:15', actor: 'AI',    text: 'Кампания «Reactivation — апрель» завершена: 3 лида из 23 отправок' },
  { id: 4, ts: '25 мая, 18:44', actor: 'Игорь', text: 'Запущена рассылка «Напоминание о демо-чате» — сегмент Тёплые (31 чел.)' },
  { id: 5, ts: '24 мая, 11:20', actor: 'AI',    text: 'Сформирован контент: 4 поста для VK и TG-канала' },
  { id: 6, ts: '23 мая, 16:05', actor: 'Игорь', text: 'Добавлен конкурент intly.io — найдено 9 релевантных элементов' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  email: { icon: Mail,         label: 'Email',    color: '#3b82f6' },
  tg:    { icon: MessageSquare,label: 'Telegram', color: '#0ea5e9' },
  wa:    { icon: Phone,        label: 'WhatsApp', color: '#10b981' },
  vk:    { icon: Globe,        label: 'VK',       color: '#4c6ef5' },
};

function ChannelBadge({ ch }: { ch: string }) {
  const cfg = CHANNEL_ICONS[ch];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.color + '18', color: cfg.color }}>
      <Icon style={{ width: 10, height: 10 }} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    done:   { label: 'Завершена', color: '#10b981', bg: '#d1fae5' },
    active: { label: 'Активна',   color: '#f97316', bg: '#ffedd5' },
    draft:  { label: 'Черновик',  color: '#9ca3af', bg: '#f3f4f6' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Editable list ────────────────────────────────────────────────────────────

function EditableList({ label, items, onChange, color = '#6b5fd4' }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  color?: string;
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
                if (e.key === 'Enter') { const next = [...items]; next[i] = draft; onChange(next); setEditing(null); }
                if (e.key === 'Escape') { if (!item) { onChange(items.filter((_, j) => j !== i)); } setEditing(null); }
              }}
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none"
              style={{ borderColor: color, background: '#fff' }}
            />
            <button onClick={() => { const next = [...items]; next[i] = draft; onChange(next); setEditing(null); }}>
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
            <button onClick={() => { setEditing(i); setDraft(item); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 style={{ width: 12, height: 12, color: '#9ca3af' }} />
            </button>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 style={{ width: 12, height: 12, color: '#ef4444' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DNA Tab ─────────────────────────────────────────────────────────────────

function DnaTab() {
  const [utps, setUtps] = useState(DEMO_UTPS);
  const [pains, setPains] = useState(DEMO_PAINS);
  const [howWeClose, setHowWeClose] = useState(DEMO_HOW_WE_CLOSE);
  const [competitors, setCompetitors] = useState(DEMO_COMPETITORS);
  const [newComp, setNewComp] = useState('');
  const [regenDialog, setRegenDialog] = useState(false);
  const [regenStep, setRegenStep] = useState(0);
  const REGEN_LIMIT = 3;
  const regenUsed = 1;

  type Suggestion = { text: string; status: 'pending' | 'applied' | 'rejected'; edit?: string };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [kbUpdateDialog, setKbUpdateDialog] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState([...DEMO_UTPS]);
  const [strengthUrls, setStrengthUrls] = useState('');
  const [strengthRunning, setStrengthRunning] = useState(false);
  type StrengthSugg = { text: string; original?: string; status: 'pending' | 'applied' | 'rejected' };
  const [strengthSuggestions, setStrengthSuggestions] = useState<StrengthSugg[]>([]);

  const handleAddCompetitor = () => {
    if (!newComp.trim()) return;
    const url = newComp.trim();
    setCompetitors(prev => [...prev, { url, status: 'scanning', found: 0 }]);
    setNewComp('');
    setTimeout(() => {
      setCompetitors(prev => prev.map(c =>
        c.status === 'scanning' ? { ...c, status: 'done', found: Math.floor(Math.random() * 8) + 5 } : c
      ));
      const known = (COMPETITOR_UTP_SUGGESTIONS as Record<string, string[]>)[url]
        ?? COMPETITOR_UTP_SUGGESTIONS.default;
      setSuggestions(prev => [
        ...prev.filter(s => s.status !== 'pending'),
        ...known.map(t => ({ text: t, status: 'pending' as const })),
      ]);
    }, 2500);
  };

  const applySuggestion = (i: number) => {
    const sug = suggestions[i];
    setUtps(prev => [...prev, sug.edit ?? sug.text]);
    setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, status: 'applied' as const } : s));
  };

  const rejectSuggestion = (i: number) => {
    setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, status: 'rejected' as const } : s));
  };

  const handleSave = () => {
    const added = utps.filter(u => !savedSnapshot.includes(u)).length;
    const removed = savedSnapshot.filter(u => !utps.includes(u)).length;
    setSavedSnapshot([...utps]);
    if (added + removed >= 2) setKbUpdateDialog(true);
  };

  const handleStrengthen = () => {
    if (!strengthUrls.trim() || strengthRunning) return;
    setStrengthRunning(true);
    setStrengthSuggestions([]);
    setTimeout(() => {
      setStrengthRunning(false);
      setStrengthSuggestions([
        { text: utps[0] + ' — подтверждено конкурентным анализом', original: utps[0], status: 'pending' },
        { text: 'Мобильное приложение партнёра без дополнительной разработки', status: 'pending' },
        { text: 'Лиды в Telegram, CRM и Email одновременно — ни одна заявка не потеряется', original: utps[2], status: 'pending' },
      ]);
    }, 2800);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Regen limit banner */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
        <Info style={{ width: 16, height: 16, color: '#f97316', flexShrink: 0 }} />
        <p className="text-sm" style={{ color: '#92400e' }}>
          Перегенерация ДНК: использовано <strong>{regenUsed}</strong> из <strong>{REGEN_LIMIT}</strong> в этом месяце.
          Анализ конкурентов всегда запускает обновление автоматически.
        </p>
        <button
          onClick={() => setRegenDialog(true)}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: regenUsed >= REGEN_LIMIT ? '#e5e7eb' : '#f97316', color: regenUsed >= REGEN_LIMIT ? '#9ca3af' : '#fff' }}
          disabled={regenUsed >= REGEN_LIMIT}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
          Обновить ДНК
        </button>
      </div>

      {/* Segments */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Сегменты аудитории</h3>
        <div className="space-y-3">
          {DEMO_SEGMENTS.map(seg => (
            <div key={seg.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: '#374151' }}>{seg.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold" style={{ color: seg.color }}>{seg.size} чел.</span>
                  <span style={{ color: '#9ca3af' }}>{seg.pct}% охвата</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                <div className="h-full rounded-full" style={{ width: `${seg.pct}%`, background: seg.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable blocks */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <h3 className="text-sm font-semibold mb-5" style={{ color: '#111827' }}>УТП и позиционирование</h3>
        <div className="space-y-6">
          <EditableList label="УТП (уникальные торговые предложения)" items={utps} onChange={setUtps} color="#6b5fd4" />
          <EditableList label="Боли и проблемы аудитории" items={pains} onChange={setPains} color="#ef4444" />
          <EditableList label="Как мы закрываем возражения" items={howWeClose} onChange={setHowWeClose} color="#10b981" />
        </div>
        <div className="mt-5 pt-4 flex justify-end gap-2" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border"
            style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
            <Download style={{ width: 12, height: 12 }} />
            Скачать DOCX
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-white"
            style={{ background: '#6b5fd4' }}>
            <Check style={{ width: 12, height: 12 }} />
            Сохранить
          </button>
        </div>
      </div>

      {/* Competitor analysis */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Анализ конкурентов</h3>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: '#d1fae5', color: '#065f46' }}>Всегда запускает обновление ДНК</span>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={newComp}
            onChange={e => setNewComp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCompetitor()}
            placeholder="конкурент.ru или https://..."
            className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
          <button onClick={handleAddCompetitor}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ background: '#f97316' }}>
            <Globe style={{ width: 14, height: 14 }} />
            Добавить
          </button>
        </div>
        <div className="space-y-2">
          {competitors.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg px-4 py-2.5"
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

        {/* UTP suggestions from competitor scan */}
        {suggestions.filter(s => s.status === 'pending').length > 0 && (
          <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #fde68a' }}>
            <div className="px-4 py-2.5" style={{ background: '#fef9c3', borderBottom: '1px solid #fde68a' }}>
              <span className="text-xs font-semibold" style={{ color: '#92400e' }}>
                AI предлагает {suggestions.filter(s => s.status === 'pending').length} улучшения УТП на основе анализа конкурентов
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {suggestions.map((sug, i) => sug.status !== 'pending' ? null : (
                <div key={i} className="px-4 py-3">
                  {editingIdx === i ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, edit: editDraft } : s)); setEditingIdx(null); }
                          if (e.key === 'Escape') setEditingIdx(null);
                        }}
                        className="flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none"
                        style={{ borderColor: '#f97316' }}
                      />
                      <button onClick={() => { setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, edit: editDraft } : s)); setEditingIdx(null); }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ background: '#10b981' }}>OK</button>
                      <button onClick={() => setEditingIdx(null)}
                        className="text-xs px-2 py-1.5 rounded-lg" style={{ color: '#9ca3af' }}>✕</button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <p className="flex-1 text-sm" style={{ color: '#374151' }}>{sug.edit ?? sug.text}</p>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => applySuggestion(i)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium text-white" style={{ background: '#10b981' }}>Применить</button>
                        <button onClick={() => { setEditingIdx(i); setEditDraft(sug.edit ?? sug.text); }}
                          className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>Изменить</button>
                        <button onClick={() => rejectSuggestion(i)}
                          className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#fca5a5', color: '#ef4444' }}>Отклонить</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {suggestions.some(s => s.status === 'applied') && (
              <div className="px-4 py-2.5" style={{ background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
                <span className="text-xs" style={{ color: '#065f46' }}>
                  ✓ Применено {suggestions.filter(s => s.status === 'applied').length} УТП — добавлены в список
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strengthen analysis */}
      <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Усилить анализ</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ede9ff', color: '#6b5fd4' }}>AI предложит улучшенные УТП</span>
        </div>
        <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
          Вставьте несколько URL конкурентов через запятую — AI сравнит их позиционирование с вашим и предложит конкретные улучшения.
        </p>
        <div className="flex gap-2 mb-3">
          <input
            value={strengthUrls}
            onChange={e => setStrengthUrls(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStrengthen()}
            placeholder="site1.ru, site2.ru, site3.com"
            className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
            style={{ borderColor: '#e5e7eb' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
          <button
            onClick={handleStrengthen}
            disabled={!strengthUrls.trim() || strengthRunning}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ background: '#6b5fd4' }}>
            {strengthRunning
              ? <RefreshCw style={{ width: 14, height: 14 }} className="animate-spin" />
              : <Zap style={{ width: 14, height: 14 }} />}
            {strengthRunning ? 'Анализирую...' : 'Усилить анализ'}
          </button>
        </div>
        {strengthSuggestions.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            <div className="px-4 py-2.5" style={{ background: '#f9f8ff', borderBottom: '1px solid #e5e7eb' }}>
              <span className="text-xs font-semibold" style={{ color: '#6b5fd4' }}>
                Предложения по улучшению УТП — {strengthSuggestions.filter(s => s.status === 'pending').length} активных
              </span>
            </div>
            {strengthSuggestions.map((sug, i) => (
              <div key={i} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                {sug.status !== 'pending' ? (
                  <p className={`text-xs ${sug.status === 'applied' ? '' : 'line-through'}`}
                    style={{ color: sug.status === 'applied' ? '#10b981' : '#9ca3af' }}>
                    {sug.status === 'applied' ? '✓ ' : ''}{sug.text}
                  </p>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      {sug.original && (
                        <p className="text-xs line-through mb-0.5" style={{ color: '#d1d5db' }}>{sug.original}</p>
                      )}
                      <p className="text-sm" style={{ color: '#374151' }}>{sug.text}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (sug.original) setUtps(prev => prev.map(u => u === sug.original ? sug.text : u));
                          else setUtps(prev => [...prev, sug.text]);
                          setStrengthSuggestions(prev => prev.map((s, j) => j === i ? { ...s, status: 'applied' as const } : s));
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium text-white" style={{ background: '#10b981' }}>
                        Применить
                      </button>
                      <button
                        onClick={() => setStrengthSuggestions(prev => prev.map((s, j) => j === i ? { ...s, status: 'rejected' as const } : s))}
                        className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: '#fca5a5', color: '#ef4444' }}>
                        Отклонить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regen dialog */}
      {regenDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setRegenDialog(false); setRegenStep(0); }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            {regenStep === 0 && (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#fff7ed' }}>
                  <AlertCircle style={{ width: 22, height: 22, color: '#f97316' }} />
                </div>
                <h3 className="text-base font-semibold text-center mb-2" style={{ color: '#111827' }}>
                  Обновить ДНК-анализ?
                </h3>
                <p className="text-sm text-center mb-1" style={{ color: '#6b7280' }}>
                  Вы проверили все блоки УТП, болей и закрытий?
                </p>
                <p className="text-xs text-center mb-5" style={{ color: '#9ca3af' }}>
                  Осталось обновлений: {REGEN_LIMIT - regenUsed} из {REGEN_LIMIT} в мае
                </p>
                <div className="flex gap-3">
                  <button onClick={() => { setRegenDialog(false); setRegenStep(0); }}
                    className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>
                    Отмена
                  </button>
                  <button onClick={() => setRegenStep(1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: '#f97316' }}>
                    Да, обновить
                  </button>
                </div>
              </>
            )}
            {regenStep === 1 && (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#d1fae5' }}>
                  <Check style={{ width: 22, height: 22, color: '#10b981' }} />
                </div>
                <h3 className="text-base font-semibold text-center mb-2" style={{ color: '#111827' }}>
                  ДНК-анализ запущен
                </h3>
                <p className="text-sm text-center mb-5" style={{ color: '#6b7280' }}>
                  AI перегенерирует сегменты и рекомендации. Обычно занимает 2–4 минуты.
                </p>
                <button onClick={() => { setRegenDialog(false); setRegenStep(0); }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#6b5fd4' }}>
                  Понял, жду
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* KB update dialog */}
      {kbUpdateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setKbUpdateDialog(false)}>
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
              Вы внесли значительные изменения в УТП. Обновить базу знаний AI-ассистента, чтобы он использовал новые аргументы в диалогах с клиентами?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setKbUpdateDialog(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>
                Не сейчас
              </button>
              <button onClick={() => setKbUpdateDialog(false)}
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

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab({ locked }: { locked?: boolean }) {
  if (locked) return <LockedTab featureName="Кампании" />;
  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#6b7280' }}>Промо-кампании доступны на платном тарифе Маркетолога</p>
        <button className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: '#6b5fd4' }}>
          <Plus style={{ width: 14, height: 14 }} />
          Новая кампания
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Кампания', 'Каналы', 'Сегмент', 'Статус', 'Период', 'Отправлено', 'Open rate', 'Лиды'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#9ca3af' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO_CAMPAIGNS.map((c, i) => (
              <tr key={c.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-4 py-3.5 text-sm font-medium" style={{ color: '#111827' }}>{c.name}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {c.channels.map(ch => <ChannelBadge key={ch} ch={ch} />)}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm" style={{ color: '#374151' }}>{c.segment}</td>
                <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3.5 text-sm" style={{ color: '#6b7280' }}>{c.period}</td>
                <td className="px-4 py-3.5 text-sm font-medium" style={{ color: '#111827' }}>{c.sent}</td>
                <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: '#6b5fd4' }}>{c.open_rate}</td>
                <td className="px-4 py-3.5 text-sm font-bold" style={{ color: '#10b981' }}>{c.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Broadcasts Tab ───────────────────────────────────────────────────────────

function BroadcastsTab({ locked }: { locked?: boolean }) {
  const [broadcasts, setBroadcasts] = useState(DEMO_BROADCASTS);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(0);

  if (locked) return <LockedTab featureName="Рассылки" />;

  const toggle = (id: string) => setBroadcasts(prev =>
    prev.map(b => b.id === id ? { ...b, active: !b.active } : b)
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Cascade explanation */}
      <div className="rounded-xl p-4" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#0369a1' }}>КАК РАБОТАЕТ КАСКАДНАЯ РАССЫЛКА</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { ch: 'email', label: 'Email' },
            { ch: 'tg',    label: 'Telegram' },
            { ch: 'wa',    label: 'WhatsApp' },
            { ch: 'vk',    label: 'VK' },
          ].map((item, i, arr) => (
            <div key={item.ch} className="flex items-center gap-2">
              <ChannelBadge ch={item.ch} />
              {i < arr.length - 1 && (
                <div className="flex flex-col items-center">
                  <ArrowRight style={{ width: 12, height: 12, color: '#9ca3af' }} />
                  <span className="text-[9px]" style={{ color: '#9ca3af' }}>если не прочитал</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: '#0369a1' }}>
          Следующий канал включается только если пользователь не прочитал сообщение в предыдущем.
          Никаких дублей — только умная доставка.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Автосеквенции</h3>
        <button onClick={() => { setShowCreate(true); setStep(0); }}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: '#6b5fd4' }}>
          <Plus style={{ width: 14, height: 14 }} />
          Новая рассылка
        </button>
      </div>

      {/* Sequences list */}
      <div className="space-y-2">
        {broadcasts.map(b => (
          <div key={b.id} className="flex items-center gap-4 rounded-xl px-4 py-3.5"
            style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
            <button onClick={() => toggle(b.id)}>
              {b.active
                ? <ToggleRight style={{ width: 24, height: 24, color: '#6b5fd4' }} />
                : <ToggleLeft  style={{ width: 24, height: 24, color: '#d1d5db' }} />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{b.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs" style={{ color: '#9ca3af' }}>{b.segment}</span>
                <span style={{ color: '#e5e7eb' }}>·</span>
                <span className="text-xs" style={{ color: '#9ca3af' }}>{b.delay}</span>
                {b.sent > 0 && (
                  <>
                    <span style={{ color: '#e5e7eb' }}>·</span>
                    <span className="text-xs" style={{ color: '#6b5fd4' }}>отправлено: {b.sent}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {b.channels.map(ch => <ChannelBadge key={ch} ch={ch} />)}
            </div>
            <button className="opacity-50 hover:opacity-100">
              <Edit2 style={{ width: 13, height: 13, color: '#9ca3af' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: '#111827' }}>
                {['Выберите сегмент', 'Настройте каналы', 'Добавьте текст'][step]}
              </h3>
              <button onClick={() => setShowCreate(false)}>
                <X style={{ width: 16, height: 16, color: '#9ca3af' }} />
              </button>
            </div>
            <div className="flex gap-1 mb-5">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-1 rounded-full"
                  style={{ background: i <= step ? '#6b5fd4' : '#e5e7eb' }} />
              ))}
            </div>
            {step === 0 && (
              <div className="space-y-2">
                {DEMO_SEGMENTS.map(seg => (
                  <button key={seg.name} onClick={() => setStep(1)}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left"
                    style={{ border: '1px solid #f0f0f5' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#f0f0f5')}>
                    <span className="text-sm font-medium" style={{ color: '#374151' }}>{seg.name}</span>
                    <span className="text-xs font-semibold" style={{ color: seg.color }}>{seg.size} чел.</span>
                  </button>
                ))}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  Выберите каналы (каскад — следующий включается если предыдущий не прочитан)
                </p>
                {Object.entries(CHANNEL_ICONS).map(([ch, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <label key={ch} className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer"
                      style={{ border: '1px solid #f0f0f5' }}>
                      <input type="checkbox" defaultChecked={ch === 'email'} className="w-4 h-4 rounded" />
                      <Icon style={{ width: 16, height: 16, color: cfg.color }} />
                      <span className="text-sm" style={{ color: '#374151' }}>{cfg.label}</span>
                    </label>
                  );
                })}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>Назад</button>
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#6b5fd4' }}>Далее</button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <textarea rows={4} placeholder="Текст сообщения... (AI поможет сгенерировать во вкладке AI-генерация)"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none"
                  style={{ borderColor: '#e5e7eb' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>Назад</button>
                  <button onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#6b5fd4' }}>
                    Создать рассылку
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Segments Tab ─────────────────────────────────────────────────────────────

function SegmentsTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm" style={{ color: '#6b7280' }}>
        Сегменты обновляются автоматически на основе поведения пользователей в диалогах и CRM.
      </p>
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        {DEMO_SEGMENTS.map((seg, i) => (
          <div key={seg.name} className="flex items-center gap-4 px-5 py-4"
            style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{seg.name}</span>
                <span className="text-sm font-bold" style={{ color: seg.color }}>{seg.size} чел.</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                <div className="h-full rounded-full" style={{ width: `${seg.pct}%`, background: seg.color, opacity: 0.6 }} />
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ background: '#ede9ff', color: '#6b5fd4' }}>
              <Send style={{ width: 11, height: 11 }} />
              Рассылка
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Generation Tab ────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  'Напиши пост для TG-канала про наш виджет',
  'Сделай email для реактивации молчащих лидов',
  'Придумай 3 заголовка для лендинга',
  'Напиши скрипт холодного звонка',
];

type Message = { role: 'user' | 'ai'; text: string };

const DEMO_AI_RESPONSES: Record<string, string> = {
  'Напиши пост для TG-канала про наш виджет': `📲 *Ваш сайт отвечает клиентам — даже ночью*\n\nПока ваши менеджеры спят, AI-виджет Atlas:\n✅ Отвечает на вопросы 24/7\n✅ Собирает контакты и заявки\n✅ Квалифицирует лидов\n\nПервый результат — за 14 дней бесплатно.\n👉 Демо-чат уже сегодня: [ссылка]`,
  'Сделай email для реактивации молчащих лидов': `Тема: Мы вас не забыли — и у нас есть для вас кое-что новое\n\nПривет, [Имя]!\n\nМы заметили, что вы давно не заходили в Atlas. Понимаем — задач много.\n\nПока вас не было, мы добавили:\n• Автоматическую сегментацию лидов\n• Каскадные рассылки\n• Новые сценарии для AI-ассистента\n\nЗапустите виджет и получите первый лид за неделю.\n\nС уважением,\nКоманда Atlas`,
};

function AiGenerationTab({ locked }: { locked?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const resp = DEMO_AI_RESPONSES[text] ?? 'Генерирую контент на основе вашего ДНК-анализа и сегментов... Вот вариант:\n\n**Заголовок:** Автоматизируйте общение с клиентами за 24 часа\n\n**Описание:** AI-виджет Atlas знает всё о вашем бизнесе, отвечает клиентам и собирает заявки — без программистов и лишних затрат.\n\n**CTA:** Запустить бесплатно';
      setMessages(prev => [...prev, { role: 'ai', text: resp }]);
      setLoading(false);
    }, 1800);
  };

  if (locked) return <LockedTab featureName="AI-генерация" planRequired="Маркетолог Pro" />;

  return (
    <div className="max-w-3xl flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: 400 }}>
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-xl p-4 space-y-3 mb-3"
        style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: '#ede9ff' }}>
              <Sparkles style={{ width: 22, height: 22, color: '#6b5fd4' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>AI-генерация контента</p>
            <p className="text-xs mb-5 text-center max-w-xs" style={{ color: '#9ca3af' }}>
              Попросите AI создать пост, email, скрипт или рекламный текст — на основе вашего ДНК-анализа
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-xl border transition-colors"
                  style={{ borderColor: '#e5e7eb', color: '#6b5fd4' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} flex-col ${msg.role === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2"
                  style={{ background: '#ede9ff' }}>
                  <Bot style={{ width: 14, height: 14, color: '#6b5fd4' }} />
                </div>
              )}
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? '#6b5fd4' : '#f3f4f6',
                  color: msg.role === 'user' ? '#fff' : '#374151',
                }}>
                {msg.text}
              </div>
            </div>
            {msg.role === 'ai' && i > 0 && (
              <div className="flex gap-2 ml-9 mt-1.5">
                <button
                  onClick={() => navigator.clipboard.writeText(msg.text)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: '#f3f4f6', color: '#6b7280' }}>
                  <Check style={{ width: 10, height: 10 }} /> Скопировать
                </button>
                <button
                  onClick={() => setScheduleDialog(msg.text)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                  style={{ background: '#ede9ff', color: '#6b5fd4' }}>
                  <Calendar style={{ width: 10, height: 10 }} />
                  {IS_PAID_MARKETER ? 'Запланировать' : '🔒 Запланировать'}
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#ede9ff' }}>
              <Bot style={{ width: 14, height: 14, color: '#6b5fd4' }} />
            </div>
            <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: '#f3f4f6' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#9ca3af', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Попросите AI создать контент..."
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border outline-none"
          style={{ borderColor: '#e5e7eb' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50"
          style={{ background: '#6b5fd4' }}>
          <Send style={{ width: 14, height: 14 }} />
          Создать
        </button>
      </div>

      {/* Schedule modal */}
      {scheduleDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setScheduleDialog(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            {!IS_PAID_MARKETER ? (
              <>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#f3f4f6' }}>
                  <Lock style={{ width: 20, height: 20, color: '#d1d5db' }} />
                </div>
                <h3 className="text-base font-semibold text-center mb-2" style={{ color: '#111827' }}>Планирование — платная функция</h3>
                <p className="text-sm text-center mb-5" style={{ color: '#6b7280' }}>
                  Доступно на тарифе Маркетолог Pro. Генерация бесплатна, а публикация по расписанию — нет.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setScheduleDialog(null)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>Закрыть</button>
                  <button onClick={() => { alert('Для подключения обратитесь к поддержке'); setScheduleDialog(null); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#6b5fd4' }}>
                    Подключить Pro
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold mb-4" style={{ color: '#111827' }}>Запланировать публикацию</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Канал</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['tg','vk','ig','wa'].map(ch => <ChannelBadge key={ch} ch={ch} />)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Дата и время</label>
                    <input type="datetime-local" className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                      style={{ borderColor: '#e5e7eb' }} />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setScheduleDialog(null)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>Отмена</button>
                  <button onClick={() => { alert('Публикация запланирована!'); setScheduleDialog(null); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#6b5fd4' }}>
                    Запланировать
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────

function LogTab() {
  return (
    <div className="max-w-3xl space-y-2">
      {DEMO_LOG.map(entry => (
        <div key={entry.id} className="flex items-start gap-4 rounded-xl px-4 py-3.5"
          style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: entry.actor === 'AI' ? '#ede9ff' : '#f3f4f6' }}>
            {entry.actor === 'AI'
              ? <Bot style={{ width: 14, height: 14, color: '#6b5fd4' }} />
              : <span className="text-xs font-bold" style={{ color: '#374151' }}>{entry.actor[0]}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: '#374151' }}>{entry.text}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{entry.ts} · {entry.actor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Locked Tab ───────────────────────────────────────────────────────────────

function LockedTab({ featureName, planRequired = 'Маркетолог Pro' }: { featureName: string; planRequired?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#f3f4f6' }}>
        <Lock style={{ width: 22, height: 22, color: '#d1d5db' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#111827' }}>{featureName} — платная функция</h3>
      <p className="text-sm mb-5" style={{ color: '#9ca3af' }}>
        Функция доступна на тарифе <strong>{planRequired}</strong>. Подключите или запросите trial у поддержки.
      </p>
      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#6b5fd4' }}>
        <Zap style={{ width: 14, height: 14 }} />
        Подключить за ₽ 2 990/мес
      </button>
    </div>
  );
}

// ─── Content Tab ─────────────────────────────────────────────────────────────

const CONTENT_POSTS = [
  { id: 'cp1', type: 'tg',  text: 'Ваш сайт теперь отвечает клиентам 24/7 — без менеджера', status: 'published', date: '27.05', likes: 47, views: 892 },
  { id: 'cp2', type: 'vk',  text: 'Кейс: как агентство получило 18 лидов за 2 недели с AI', status: 'scheduled', date: '28.05', likes: 0, views: 0 },
  { id: 'cp3', type: 'ig',  text: '3 ошибки при выборе AI-виджета для бизнеса', status: 'draft', date: '—', likes: 0, views: 0 },
  { id: 'cp4', type: 'yt',  text: 'Обзор Atlas AI — автоматизация лидов для агентств', status: 'draft', date: '—', likes: 0, views: 0 },
];

const CHANNEL_CONTENT: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  tg:  { icon: MessageSquare, color: '#0ea5e9', label: 'Telegram' },
  vk:  { icon: Globe,         color: '#4c6ef5', label: 'VK' },
  ig:  { icon: Camera,        color: '#e1306c', label: 'Instagram' },
  yt:  { icon: Video,         color: '#ef4444', label: 'YouTube' },
};

function ContentTab({ locked }: { locked?: boolean }) {
  if (locked) return <LockedTab featureName="Контент" />;
  const [showGen, setShowGen] = useState(false);
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    published: { label: 'Опубликован', color: '#10b981', bg: '#d1fae5' },
    scheduled:  { label: 'Запланирован', color: '#6b5fd4', bg: '#ede9ff' },
    draft:      { label: 'Черновик',    color: '#9ca3af', bg: '#f3f4f6' },
  };
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#6b7280' }}>
          Контент-план на основе ДНК-анализа и сегментов аудитории
        </p>
        <button onClick={() => setShowGen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
          style={{ background: '#fb923c' }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          Сгенерировать пост
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f5' }}>
        {CONTENT_POSTS.map((post, i) => {
          const ch = CHANNEL_CONTENT[post.type];
          const st = statusMap[post.status];
          const Icon = ch.icon;
          return (
            <div key={post.id} className="flex items-center gap-4 px-5 py-4"
              style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: ch.color + '18' }}>
                <Icon style={{ width: 15, height: 15, color: ch.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1" style={{ color: '#374151' }}>{post.text}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{ch.label}</span>
                  {post.views > 0 && <span className="text-xs" style={{ color: '#9ca3af' }}>{post.views.toLocaleString()} просмотров</span>}
                </div>
              </div>
              <span className="text-xs" style={{ color: '#9ca3af' }}>{post.date}</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: st.bg, color: st.color }}>{st.label}</span>
              <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                style={{ background: '#f3f4f6', color: '#6b7280' }}>
                <Edit2 style={{ width: 11, height: 11 }} /> Изменить
              </button>
            </div>
          );
        })}
      </div>

      {/* Generate modal */}
      {showGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowGen(false)}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4" style={{ color: '#111827' }}>Создать публикацию</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Канал</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CHANNEL_CONTENT).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key}
                        className="flex flex-col items-center gap-1 py-2 rounded-xl border transition-colors"
                        style={{ borderColor: '#e5e7eb' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                        <Icon style={{ width: 18, height: 18, color: cfg.color }} />
                        <span className="text-[10px]" style={{ color: '#6b7280' }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Тема</label>
                <input placeholder="О чём написать?" className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: '#e5e7eb' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#fb923c')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowGen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm border" style={{ color: '#6b7280' }}>Отмена</button>
                <button onClick={() => { alert('Пост сгенерирован! Перейдите в AI-генерацию для редактирования.'); setShowGen(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#fb923c' }}>
                  Сгенерировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// paid tier check (demo: always free)
const IS_PAID_MARKETER = false;

const PATH_TO_TAB: Record<string, string> = {
  '/marketing':            'dna',
  '/marketing/campaigns':  'campaigns',
  '/marketing/content':    'content',
  '/marketing/broadcasts': 'broadcasts',
  '/marketing/segments':   'segments',
  '/marketing/ai':         'ai',
  '/marketing/log':        'log',
};

const TABS = [
  { id: 'dna',         label: 'ДНК-анализ',   icon: Dna,         locked: false },
  { id: 'campaigns',   label: 'Кампании',      icon: Megaphone,   locked: !IS_PAID_MARKETER },
  { id: 'content',     label: 'Контент',       icon: FileText,    locked: !IS_PAID_MARKETER },
  { id: 'broadcasts',  label: 'Рассылки',      icon: Radio,       locked: !IS_PAID_MARKETER },
  { id: 'segments',    label: 'Сегменты',      icon: Users,       locked: false },
  { id: 'ai',          label: 'AI-генерация',  icon: Sparkles,    locked: false },
  { id: 'log',         label: 'Лог действий',  icon: ScrollText,  locked: false },
] as const;

type TabId = typeof TABS[number]['id'];

export default function MarketingPageFull() {
  const pathname = usePathname();
  const tabFromUrl = (PATH_TO_TAB[pathname] ?? 'dna') as TabId;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl);

  useEffect(() => {
    setActiveTab((PATH_TO_TAB[pathname] ?? 'dna') as TabId);
  }, [pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-4 border-b"
        style={{ background: '#fff', borderColor: '#f0f0f5' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
            <Dna style={{ width: 18, height: 18, color: '#fb923c' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>AI Маркетолог</h1>
            <p className="text-xs" style={{ color: '#9ca3af' }}>ДНК-анализ · Сегменты · Рассылки · AI-генерация</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mx-px">
          {TABS.map(({ id, label, icon: Icon, locked }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 relative"
              style={{
                borderBottomColor: activeTab === id ? '#fb923c' : 'transparent',
                color: activeTab === id ? '#fb923c' : '#9ca3af',
              }}
              onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.color = '#9ca3af'; }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {label}
              {locked && <Lock style={{ width: 9, height: 9, marginLeft: 2, opacity: 0.5 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6" style={{ background: '#fafafa' }}>
        {activeTab === 'dna'        && <DnaTab />}
        {activeTab === 'campaigns'  && <CampaignsTab locked={!IS_PAID_MARKETER} />}
        {activeTab === 'content'    && <ContentTab  locked={!IS_PAID_MARKETER} />}
        {activeTab === 'broadcasts' && <BroadcastsTab locked={!IS_PAID_MARKETER} />}
        {activeTab === 'segments'   && <SegmentsTab />}
        {activeTab === 'ai'         && <AiGenerationTab />}
        {activeTab === 'log'        && <LogTab />}
      </div>
    </div>
  );
}
