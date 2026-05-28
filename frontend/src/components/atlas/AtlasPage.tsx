'use client';

import { useState, useRef, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  Brain, Send, Plus, FolderPlus, ChevronRight, Paperclip, Mic, MicOff,
  Bot, UserCheck, TrendingUp, Users, DollarSign, Scale, BarChart3,
  Check, X, AlertCircle, ChevronDown, ChevronUp, Search,
  MoreHorizontal, Pencil, FolderOpen, Trash2, Image, FileText,
  Camera, MessageSquare, Copy, BookOpen,
} from 'lucide-react';

// ─── Scenarios per block ─────────────────────────────────────────────────────

export const BLOCKS = [
  {
    id: 'consultant',
    label: 'AI Консультант',
    icon: Bot,
    color: '#6b5fd4',
    scenarios: [
      'Создать базу знаний из сайта клиента',
      'Настроить режим: Продажник / Поддержка',
      'Обучить ассистента обработке возражений',
      'Показать 5 последних диалогов клиента',
      'Найти пробелы в базе знаний',
      'Сгенерировать приветственный скрипт',
      'Подобрать тональность общения (tone of voice)',
      'Проанализировать конверсию диалог→лид',
      'Добавить FAQ из частых вопросов клиентов',
      'Настроить handoff на живого оператора',
      'Составить отчёт по базе знаний клиента',
    ],
  },
  {
    id: 'marketer',
    label: 'AI Маркетолог',
    icon: TrendingUp,
    color: '#fb923c',
    scenarios: [
      'Запустить ДНК-анализ аудитории',
      'Написать пост для TG-канала',
      'Создать email-рассылку для сегмента',
      'Сгенерировать 5 вариантов заголовков',
      'Запланировать каскадную рассылку',
      'Проанализировать конкурентов',
      'Составить контент-план на 2 недели',
      'Написать скрипт холодного звонка',
      'Создать промо-кампанию для TG',
    ],
  },
  {
    id: 'hr',
    label: 'AI HR',
    icon: Users,
    color: '#10b981',
    scenarios: [
      'Написать вакансию по должности',
      'Составить вопросы для интервью',
      'Проверить резюме на соответствие роли',
      'Создать onboarding-план для сотрудника',
      'Написать KPI для менеджера по продажам',
      'Составить план адаптации на 30/60/90 дней',
      'Найти кандидата через AI-подбор',
      'Оценить компетенции команды',
      'Провести exit-интервью (шаблон вопросов)',
    ],
  },
  {
    id: 'finance',
    label: 'AI Финансы',
    icon: DollarSign,
    color: '#3b82f6',
    scenarios: [
      'Сделать P&L отчёт за месяц',
      'Показать движение денег (ДДС)',
      'Рассчитать юнит-экономику',
      'Прогноз выручки на 3 месяца',
      'Найти неэффективные расходы',
      'Подготовить отчёт для инвестора',
      'Рассчитать точку безубыточности',
      'Составить платёжный календарь',
    ],
  },
  {
    id: 'legal',
    label: 'AI Юрист',
    icon: Scale,
    color: '#8b5cf6',
    scenarios: [
      'Проверить договор на риски',
      'Составить договор оферты',
      'Написать NDA для партнёра',
      'Подготовить претензию контрагенту',
      'Ответить на юридический вопрос',
      'Проверить соответствие 152-ФЗ',
      'Написать политику конфиденциальности',
    ],
  },
  {
    id: 'sales',
    label: 'AI Продажи',
    icon: BarChart3,
    color: '#ef4444',
    scenarios: [
      'Написать коммерческое предложение',
      'Проанализировать сделки в воронке',
      'Сгенерировать скрипт холодного звонка',
      'Подготовить презентацию для клиента',
      'Найти причины потери сделок',
      'Составить follow-up email после встречи',
      'Квалифицировать лида по BANT',
      'Написать письмо реактивации клиента',
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionStep = { label: string; status: 'pending' | 'confirm' | 'done' | 'skip' };
type AtlasMessage = {
  role: 'user' | 'atlas';
  text: string;
  ts: string;
  attachment?: { name: string; type: string };
  actionSteps?: ActionStep[];
  confirmRequired?: boolean;
  confirmText?: string;
};

interface Chat {
  id: string;
  title: string;
  ts: string;
  folderId: string | null;
  messages: AtlasMessage[];
}

interface Folder {
  id: string;
  name: string;
  collapsed: boolean;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_CHATS   = 'atlas_chats_v2';
const LS_FOLDERS = 'atlas_folders_v1';

function loadChats(): Chat[]    { try { return JSON.parse(localStorage.getItem(LS_CHATS)   ?? '[]'); } catch { return []; } }
function loadFolders(): Folder[] { try { return JSON.parse(localStorage.getItem(LS_FOLDERS) ?? '[]'); } catch { return []; } }
function saveChats(c: Chat[])    { localStorage.setItem(LS_CHATS,   JSON.stringify(c)); }
function saveFolders(f: Folder[]) { localStorage.setItem(LS_FOLDERS, JSON.stringify(f)); }

// ─── Scenario responses ───────────────────────────────────────────────────────

const SCENARIO_RESPONSES: Record<string, { text: string; actionSteps?: ActionStep[]; confirmRequired?: boolean; confirmText?: string }> = {
  'Запустить ДНК-анализ аудитории': {
    text: 'Запускаю ДНК-анализ аудитории для вашего проекта. Определю сегменты, боли, УТП и сценарии поиска по 7 шагам.',
    actionSteps: [
      { label: 'Сканирование сайта и базы знаний', status: 'done' },
      { label: 'Анализ диалогов (87 разговоров)', status: 'done' },
      { label: 'Формирование сегментов аудитории', status: 'confirm' },
      { label: 'Генерация УТП и заголовков', status: 'pending' },
      { label: 'Обновление базы знаний ассистента', status: 'pending' },
    ],
    confirmRequired: true,
    confirmText: 'Обнаружено 5 сегментов аудитории. Продолжить генерацию УТП на их основе?',
  },
  'Создать базу знаний из сайта клиента': {
    text: 'Начинаю сканирование сайта клиента для создания базы знаний. Соберу все страницы, разделы и FAQ.',
    actionSteps: [
      { label: 'Сканирование структуры сайта', status: 'done' },
      { label: 'Извлечение текстового контента', status: 'done' },
      { label: 'Векторизация и индексация', status: 'confirm' },
      { label: 'Тест качества ответов', status: 'pending' },
    ],
    confirmRequired: true,
    confirmText: 'Найдено 47 страниц. Начать индексацию и загрузку в базу знаний?',
  },
  'Создать промо-кампанию для TG': {
    text: '📲 Подготовил промо-пост для TG-канала на основе вашего ДНК-анализа:\n\n**Текст поста:**\nАвтоматизируйте работу с клиентами за 24 часа! AI-виджет Atlas отвечает на вопросы, собирает заявки и квалифицирует лидов — даже ночью 🌙\n\n✅ Первые 14 дней — бесплатно\n✅ Настройка без программиста за 30 мин\n✅ Лиды в Telegram сразу\n\n👉 Запустить демо: [ссылка]',
    actionSteps: [
      { label: 'Генерация текста поста на основе ДНК', status: 'done' },
      { label: 'Подбор хэштегов и CTA', status: 'done' },
      { label: 'Публикация в TG-канале 29.05 в 14:00', status: 'confirm' },
      { label: 'Создание записи в Маркетолог → Кампании', status: 'pending' },
    ],
    confirmRequired: true,
    confirmText: 'Запланировать публикацию в TG на 29 мая в 14:00?',
  },
  'Написать коммерческое предложение': {
    text: 'Подготовлю персонализированное КП. Уточните: для какого клиента и какой продукт/услугу предлагаете?\n\nЕсли хотите — могу взять данные из последних диалогов и сформировать КП автоматически.',
    actionSteps: [
      { label: 'Анализ профиля клиента', status: 'done' },
      { label: 'Подбор аргументов из ДНК-анализа', status: 'done' },
      { label: 'Генерация текста КП', status: 'confirm' },
      { label: 'Создание PDF-файла', status: 'pending' },
    ],
    confirmRequired: true,
    confirmText: 'Структура КП готова (3 раздела). Сгенерировать финальный текст?',
  },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 86400000 * 2) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function autoTitle(text: string) {
  return text.trim().split(/\s+/).slice(0, 6).join(' ').slice(0, 50) + (text.length > 50 ? '...' : '');
}

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ─── Markdown message component ───────────────────────────────────────────────

function MarkdownMessage({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) return <span className="text-sm leading-relaxed whitespace-pre-wrap">{text}</span>;
  return (
    <div className="text-sm leading-relaxed prose prose-sm max-w-none"
      style={{
        '--tw-prose-body': '#374151',
        '--tw-prose-headings': '#111827',
        '--tw-prose-bold': '#111827',
        '--tw-prose-code': '#6b5fd4',
        '--tw-prose-links': '#6b5fd4',
      } as React.CSSProperties}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 pl-4 list-disc space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold" style={{ color: '#111827' }}>{children}</strong>,
          h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1">{children}</h3>,
          code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: '#f3f4f6', color: '#6b5fd4' }}>{children}</code>,
          blockquote: ({ children }) => <blockquote className="border-l-2 pl-3 my-1 italic" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>{children}</blockquote>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
      style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', animation: 'fadeIn 0.2s ease' }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#d1fae5' }}>
        <Check style={{ width: 11, height: 11, color: '#10b981' }} />
      </div>
      <span className="text-sm font-medium" style={{ color: '#111827' }}>{message}</span>
    </div>
  );
}

// ─── Action chain component ───────────────────────────────────────────────────

function ActionChain({ steps, onConfirm, onSkip }: {
  steps: ActionStep[];
  onConfirm: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
      <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
        style={{ background: '#f9f8ff', color: '#6b5fd4', borderBottom: '1px solid #e5e7eb' }}>
        Цепочка действий
      </div>
      <div className="divide-y divide-gray-100">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
              style={{
                background: step.status === 'done' ? '#d1fae5' : step.status === 'confirm' ? '#fff7ed' : '#f3f4f6',
                color: step.status === 'done' ? '#10b981' : step.status === 'confirm' ? '#f97316' : '#9ca3af',
              }}>
              {step.status === 'done' ? '✓' : step.status === 'confirm' ? '!' : i + 1}
            </div>
            <span className="text-sm flex-1" style={{
              color: step.status === 'done' ? '#6b7280' : step.status === 'confirm' ? '#374151' : '#9ca3af',
              textDecoration: step.status === 'done' ? 'line-through' : 'none',
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 flex gap-2" style={{ background: '#fffbf5', borderTop: '1px solid #f3f4f6' }}>
        <div className="flex items-center gap-2 flex-1">
          <AlertCircle style={{ width: 14, height: 14, color: '#f97316', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: '#92400e' }}>Требуется подтверждение</span>
        </div>
        <button onClick={onSkip} className="text-xs px-3 py-1.5 rounded-lg border"
          style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
          Пропустить
        </button>
        <button onClick={onConfirm}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
          style={{ background: '#6b5fd4' }}>
          <Check style={{ width: 12, height: 12 }} />
          Подтвердить
        </button>
      </div>
    </div>
  );
}

// ─── 3-dot context menu ───────────────────────────────────────────────────────

function ContextMenu({ items, onClose }: {
  items: { label: string; icon: React.ElementType; danger?: boolean; sub?: { label: string; onClick: () => void }[]; onClick?: () => void }[];
  onClose: () => void;
}) {
  const [subOpen, setSubOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute z-50 right-0 top-full mt-0.5 rounded-xl shadow-lg border py-1"
      style={{ background: '#fff', borderColor: '#e5e7eb', minWidth: 160 }}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="relative">
            <button
              onClick={() => { if (item.sub) setSubOpen(subOpen === i ? null : i); else { item.onClick?.(); onClose(); } }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-sm text-left"
              style={{ color: item.danger ? '#ef4444' : '#374151' }}
            >
              <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span className="flex-1">{item.label}</span>
              {item.sub && <ChevronRight style={{ width: 11, height: 11, color: '#9ca3af' }} />}
            </button>
            {item.sub && subOpen === i && (
              <div className="absolute left-full top-0 ml-0.5 rounded-xl shadow-lg border py-1"
                style={{ background: '#fff', borderColor: '#e5e7eb', minWidth: 140 }}>
                {item.sub.map((s, j) => (
                  <button key={j} onClick={() => { s.onClick(); onClose(); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm truncate"
                    style={{ color: '#374151' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Rename inline input ──────────────────────────────────────────────────────

function RenameInput({ value, onDone }: { value: string; onDone: (v: string) => void }) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input ref={ref} value={v} onChange={e => setV(e.target.value)}
      onBlur={() => onDone(v.trim() || value)}
      onKeyDown={e => { if (e.key === 'Enter') onDone(v.trim() || value); if (e.key === 'Escape') onDone(value); }}
      className="flex-1 text-[11px] px-1 rounded outline-none border"
      style={{ color: '#374151', borderColor: '#6b5fd4', background: '#fff', minWidth: 0 }}
    />
  );
}

// ─── File attachment popup ────────────────────────────────────────────────────

function FileMenu({ onFile, onClose }: {
  onFile: (file: File) => void;
  onClose: () => void;
}) {
  const imgRef  = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef  = useRef<HTMLInputElement>(null);
  const ref     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const pick = (inputRef: React.RefObject<HTMLInputElement | null>) => { inputRef.current?.click(); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { onFile(f); onClose(); }
  };

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-1 rounded-xl shadow-lg border py-1 z-50"
      style={{ background: '#fff', borderColor: '#e5e7eb', minWidth: 160 }}>
      {[
        { label: 'Фото или видео', icon: Image, ref: imgRef,  accept: 'image/*,video/*' },
        { label: 'Файл',           icon: FileText, ref: fileRef, accept: '*/*' },
        { label: 'Камера',         icon: Camera,   ref: camRef,  accept: 'image/*', capture: 'environment' as const },
      ].map(item => {
        const Icon = item.icon;
        return (
          <button key={item.label} onClick={() => pick(item.ref)}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-sm"
            style={{ color: '#374151' }}>
            <Icon style={{ width: 14, height: 14, color: '#6b5fd4' }} />
            {item.label}
          </button>
        );
      })}
      <input ref={imgRef}  type="file" accept="image/*,video/*"        className="hidden" onChange={handleChange} />
      <input ref={fileRef} type="file" accept="*/*"                    className="hidden" onChange={handleChange} />
      <input ref={camRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Input bar ────────────────────────────────────────────────────────────────

function InputBar({ onSend, disabled, placeholder = 'Напишите сообщение... (Enter — отправить)' }: {
  onSend: (text: string, attachment?: { name: string; type: string }) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [input,    setInput]    = useState('');
  const [attach,   setAttach]   = useState<{ name: string; type: string } | null>(null);
  const [fileMenu, setFileMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const recogRef   = useRef<any>(null);

  const submit = () => {
    if (!input.trim() && !attach) return;
    onSend(input.trim(), attach ?? undefined);
    setInput('');
    setAttach(null);
  };

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || location.protocol !== 'https:') {
      alert('Микрофон требует HTTPS-соединения. После получения SSL-сертификата функция заработает автоматически.');
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SpeechRecognition();
    r.lang = 'ru-RU';
    r.interimResults = false;
    r.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? '';
      setInput(prev => (prev ? prev + ' ' : '') + transcript);
      setListening(false);
    };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col rounded-xl"
      style={{ background: '#f9f8ff', border: '1.5px solid #e9e8f0' }}>
      {attach && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: '#ede9ff', color: '#6b5fd4' }}>
            <FileText style={{ width: 11, height: 11 }} />
            <span className="truncate max-w-[200px]">{attach.name}</span>
            <button onClick={() => setAttach(null)} className="ml-1 hover:opacity-70">
              <X style={{ width: 11, height: 11 }} />
            </button>
          </div>
        </div>
      )}
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent text-sm outline-none px-4 pt-3 pb-1"
        style={{ color: '#374151', minHeight: 42, maxHeight: 100, lineHeight: 1.5 }}
        rows={1}
      />
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setFileMenu(f => !f)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 relative">
            <Paperclip style={{ width: 14, height: 14, color: '#9ca3af' }} />
          </button>
          {fileMenu && (
            <FileMenu
              onFile={f => setAttach({ name: f.name, type: f.type })}
              onClose={() => setFileMenu(false)}
            />
          )}
          <button
            onClick={toggleMic}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: listening ? '#fee2e2' : 'transparent' }}>
            {listening
              ? <MicOff style={{ width: 14, height: 14, color: '#ef4444' }} />
              : <Mic     style={{ width: 14, height: 14, color: '#9ca3af' }} />
            }
          </button>
          {listening && (
            <span className="text-[10px] animate-pulse" style={{ color: '#ef4444' }}>Слушаю...</span>
          )}
        </div>
        <button onClick={submit} disabled={(!input.trim() && !attach) || disabled}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: (input.trim() || attach) && !disabled ? '#6b5fd4' : '#e5e7eb',
            color:      (input.trim() || attach) && !disabled ? '#fff'     : '#9ca3af',
          }}>
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Folder view (GPT-style list of chats in folder) ─────────────────────────

function FolderView({ folder, chats, onOpenChat, onNewChat, onDeleteChat, onRenameChat, folders, onMoveChat }: {
  folder: Folder;
  chats: Chat[];
  onOpenChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  folders: Folder[];
  onMoveChat: (chatId: string, folderId: string | null) => void;
}) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const folderChats = chats.filter(c => c.folderId === folder.id);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#f9f8ff' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 h-11 flex-shrink-0"
        style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <FolderOpen style={{ width: 15, height: 15, color: '#6b5fd4' }} />
        <span className="text-sm font-semibold" style={{ color: '#111827' }}>{folder.name}</span>
        <span className="text-xs ml-1" style={{ color: '#9ca3af' }}>{folderChats.length} чатов</span>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
        {folderChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare style={{ width: 32, height: 32, color: '#d1d5db', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: '#9ca3af' }}>Папка пуста</p>
            <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>Начните чат ниже или перенесите существующий</p>
          </div>
        ) : folderChats.map(chat => {
          const lastMsg = chat.messages.at(-1);
          return (
            <div key={chat.id}
              className="group relative flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all hover:shadow-md"
              style={{ background: '#fff', border: '1px solid #f0f0f5' }}
              onClick={() => onOpenChat(chat.id)}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(167,139,250,0.15)' }}>
                <Brain style={{ width: 14, height: 14, color: '#a78bfa' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: '#111827' }}>{chat.title}</span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: '#9ca3af' }}>{formatTime(chat.ts)}</span>
                </div>
                {lastMsg && (
                  <p className="text-xs truncate mt-0.5" style={{ color: '#9ca3af' }}>
                    {lastMsg.role === 'user' ? 'Вы: ' : ''}{lastMsg.text.replace(/[#*`]/g, '').slice(0, 70)}
                  </p>
                )}
              </div>
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <MoreHorizontal style={{ width: 13, height: 13, color: '#9ca3af' }} />
                </button>
                {menuId === chat.id && (
                  <ContextMenu
                    onClose={() => setMenuId(null)}
                    items={[
                      { label: 'Переименовать', icon: Pencil, onClick: () => { const t = prompt('Новое название', chat.title); if (t) onRenameChat(chat.id, t); } },
                      {
                        label: 'В папку', icon: FolderOpen,
                        sub: [
                          { label: 'Без папки', onClick: () => onMoveChat(chat.id, null) },
                          ...folders.filter(f => f.id !== folder.id).map(f => ({ label: f.name, onClick: () => onMoveChat(chat.id, f.id) })),
                        ],
                      },
                      { label: 'Удалить', icon: Trash2, danger: true, onClick: () => onDeleteChat(chat.id) },
                    ]}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input to start new chat in folder */}
      <div className="flex-shrink-0 px-5 py-3" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <InputBar
          onSend={(text, att) => { onNewChat(); }}
          placeholder="Начать новый чат в папке..."
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function AtlasPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [chats,          setChatsState]     = useState<Chat[]>([]);
  const [folders,        setFoldersState]   = useState<Folder[]>([]);
  const [activeChatId,   setActiveChatId]   = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [search,         setSearch]         = useState('');
  const [menuId,         setMenuId]         = useState<string | null>(null);
  const [renamingId,     setRenamingId]     = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [toast,          setToast]          = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const processedQ  = useRef<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const copyText = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast('Скопировано');
  }, [showToast]);

  const addToKB = useCallback(async (text: string) => {
    try {
      const title = text.replace(/[#*`]/g, '').split('\n')[0].slice(0, 100) || 'Atlas KB';
      await fetch('/api/v1/atlas/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify({ title, content: text }),
      });
      showToast('Добавлено в базу знаний ✓');
    } catch {
      showToast('Ошибка сохранения');
    }
  }, [showToast]);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  const setChats = useCallback((fn: Chat[] | ((p: Chat[]) => Chat[])) => {
    setChatsState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveChats(next);
      return next;
    });
  }, []);

  const setFolders = useCallback((fn: Folder[] | ((p: Folder[]) => Folder[])) => {
    setFoldersState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveFolders(next);
      return next;
    });
  }, []);

  // ── Load from localStorage ────────────────────────────────────────────────────
  useEffect(() => {
    setChatsState(loadChats());
    setFoldersState(loadFolders());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId]);

  // Handle ?q= param (fires on every navigation to /atlas?q=...)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== processedQ.current) {
      processedQ.current = q;
      createChat(q);
      router.replace('/atlas');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  // ── Chat CRUD ─────────────────────────────────────────────────────────────────
  const createChat = (initialText?: string, folderId?: string | null) => {
    const id = newId();
    const title = initialText ? autoTitle(initialText) : 'Новый чат';
    const newChat: Chat = {
      id,
      title,
      ts: new Date().toISOString(),
      folderId: folderId ?? null,
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(id);
    setActiveFolderId(null);
    if (initialText) {
      setTimeout(() => sendMessage(initialText, id), 50);
    }
    return id;
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  const renameChat = (id: string, title: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  const moveChat = (chatId: string, folderId: string | null) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, folderId } : c));
  };

  // ── Folder CRUD ───────────────────────────────────────────────────────────────
  const createFolder = () => {
    const name = prompt('Название папки');
    if (!name) return;
    const folder: Folder = { id: newId(), name, collapsed: false };
    setFolders(prev => [folder, ...prev]);
  };

  const renameFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    setRenamingFolder(null);
  };

  const deleteFolder = (id: string) => {
    if (!confirm('Удалить папку со всеми чатами?')) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    setChats(prev => prev.filter(c => c.folderId !== id));
    if (activeFolderId === id) setActiveFolderId(null);
  };

  const toggleFolder = (id: string) => {
    setFolders(prev => {
      const target = prev.find(f => f.id === id);
      const willOpen = target?.collapsed !== false;
      return prev.map(f => ({
        ...f,
        collapsed: f.id === id ? !f.collapsed : (willOpen ? true : f.collapsed),
      }));
    });
    // Don't open folder view here — folder view opens only via "Смотреть все"
  };

  // ── Messaging ─────────────────────────────────────────────────────────────────
  const addMsg = (chatId: string, msg: Omit<AtlasMessage, 'ts'>) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...c.messages, { ...msg, ts: new Date().toISOString() }] } : c
    ));
  };

  const sendMessage = async (text: string, chatId?: string, attachment?: { name: string; type: string }) => {
    const cid = chatId ?? activeChatId;
    if ((!text && !attachment) || loading || !cid) return;

    // Auto-title on first user message
    setChats(prev => prev.map(c => {
      if (c.id !== cid) return c;
      if (c.messages.filter(m => m.role === 'user').length === 0 && c.title === 'Новый чат' && text) {
        return { ...c, title: autoTitle(text), ts: new Date().toISOString() };
      }
      return c;
    }));

    addMsg(cid, { role: 'user', text, attachment });
    setLoading(true);

    const preset = SCENARIO_RESPONSES[text];
    if (preset) {
      setTimeout(() => {
        setLoading(false);
        addMsg(cid, { role: 'atlas', ...preset });
      }, 800);
      return;
    }

    // SSE stream
    try {
      const chat = chats.find(c => c.id === cid);
      const apiMessages = (chat?.messages ?? [])
        .map(m => ({ role: m.role === 'atlas' ? 'assistant' : 'user', content: m.text }));
      if (text) apiMessages.push({ role: 'user', content: text });

      const apiBase = typeof window !== 'undefined' ? '' : 'http://localhost:8000';
      const resp = await fetch(`${apiBase}/api/v1/atlas/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let replyText = '';

      setChats(prev => prev.map(c => c.id === cid ? {
        ...c, messages: [...c.messages, { role: 'atlas' as const, text: '', ts: new Date().toISOString() }],
      } : c));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              replyText += data.text;
              const snapshot = replyText;
              setChats(prev => prev.map(c => c.id === cid ? {
                ...c, messages: c.messages.map((m, i) =>
                  i === c.messages.length - 1 ? { ...m, text: snapshot } : m
                ),
              } : c));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      addMsg(cid, { role: 'atlas', text: 'Ошибка соединения с сервером. Попробуйте позже.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (chatId: string, msgIdx: number) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const msgs = [...c.messages];
      const msg = { ...msgs[msgIdx] };
      if (msg.actionSteps) {
        const steps = msg.actionSteps.map(s => s.status === 'confirm' ? { ...s, status: 'done' as const } : s);
        const nextPending = steps.findIndex(s => s.status === 'pending');
        if (nextPending >= 0) steps[nextPending] = { ...steps[nextPending], status: 'confirm' as const };
        msg.actionSteps = steps;
        msg.confirmRequired = nextPending >= 0;
        msg.confirmText = nextPending >= 0 ? `Шаг ${nextPending + 1} готов. Продолжить?` : undefined;
        if (nextPending < 0) msgs.push({ role: 'atlas', text: '✅ Все шаги выполнены!', ts: new Date().toISOString() });
      }
      msgs[msgIdx] = msg;
      return { ...c, messages: msgs };
    }));
  };

  const handleSkip = (chatId: string, msgIdx: number) => {
    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const msgs = [...c.messages];
      const msg = { ...msgs[msgIdx] };
      if (msg.actionSteps) {
        msg.actionSteps = msg.actionSteps.map(s => s.status === 'confirm' ? { ...s, status: 'skip' as const } : s);
        msg.confirmRequired = false;
      }
      msgs[msgIdx] = msg;
      return { ...c, messages: msgs };
    }));
  };

  // ── Filtered chats for search ─────────────────────────────────────────────────
  const searchLower = search.toLowerCase();
  const rootChats   = chats.filter(c => c.folderId === null && (!search || c.title.toLowerCase().includes(searchLower)));
  const allSearched = search ? chats.filter(c => c.title.toLowerCase().includes(searchLower)) : [];

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  const sidebar = (
    <div className="flex flex-col flex-shrink-0 border-r"
      style={{ width: 260, background: '#fff', borderColor: '#e5e7eb' }}>

      {/* Search */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-2.5 h-8 rounded-lg" style={{ background: '#f3f4f6' }}>
          <Search style={{ width: 13, height: 13, color: '#9ca3af', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по чатам..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: '#374151' }} />
          {search && (
            <button onClick={() => setSearch('')}>
              <X style={{ width: 12, height: 12, color: '#9ca3af' }} />
            </button>
          )}
        </div>
      </div>

      {/* New chat + New folder */}
      <div className="px-3 pb-2 pt-1 flex gap-1.5">
        <button onClick={() => createChat()}
          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold text-white"
          style={{ background: '#6b5fd4' }}>
          <Plus style={{ width: 13, height: 13 }} /> Новый чат
        </button>
        <button onClick={createFolder}
          title="Новая папка"
          className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#e5e7eb' }}>
          <FolderPlus style={{ width: 14, height: 14, color: '#9ca3af' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {search ? (
          <div className="px-2 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1" style={{ color: '#9ca3af' }}>
              Результаты ({allSearched.length})
            </p>
            {allSearched.map(chat => (
              <button key={chat.id} onClick={() => { setActiveChatId(chat.id); setActiveFolderId(null); setSearch(''); }}
                className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-gray-50">
                <div className="text-[11px] truncate" style={{ color: '#374151' }}>{chat.title}</div>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <div className="px-2 py-1">
                {folders.map(folder => {
                  const folderChats = chats.filter(c => c.folderId === folder.id);
                  const displayed   = folderChats.slice(0, 7);
                  const hasMore     = folderChats.length > 7;
                  return (
                    <div key={folder.id}>
                      <div className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                        <button onClick={() => toggleFolder(folder.id)}
                          className="flex items-center gap-1.5 flex-1 min-w-0">
                          {folder.collapsed
                            ? <ChevronRight style={{ width: 11, height: 11, color: '#9ca3af', flexShrink: 0 }} />
                            : <ChevronDown  style={{ width: 11, height: 11, color: '#9ca3af', flexShrink: 0 }} />
                          }
                          <FolderOpen style={{ width: 13, height: 13, color: '#9ca3af', flexShrink: 0 }} />
                          {renamingFolder === folder.id
                            ? <RenameInput value={folder.name} onDone={v => renameFolder(folder.id, v)} />
                            : <span className="text-[12px] font-medium truncate" style={{ color: '#374151' }}>{folder.name}</span>
                          }
                          <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: '#9ca3af' }}>{folderChats.length}</span>
                        </button>
                        <div className="relative opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <button onClick={() => setMenuId(menuId === `f-${folder.id}` ? null : `f-${folder.id}`)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200">
                            <MoreHorizontal style={{ width: 12, height: 12, color: '#9ca3af' }} />
                          </button>
                          {menuId === `f-${folder.id}` && (
                            <ContextMenu onClose={() => setMenuId(null)} items={[
                              { label: 'Переименовать', icon: Pencil, onClick: () => setRenamingFolder(folder.id) },
                              { label: 'Удалить', icon: Trash2, danger: true, onClick: () => deleteFolder(folder.id) },
                            ]} />
                          )}
                        </div>
                      </div>

                      {/* Chats inside folder */}
                      {!folder.collapsed && (
                        <>
                          {folderChats.length === 0 && (
                            <button
                              onClick={() => createChat(undefined, folder.id)}
                              className="w-full text-left pl-8 pr-2 py-2 text-[11px] hover:bg-gray-50 rounded-lg"
                              style={{ color: '#9ca3af' }}>
                              + Начать новый чат в этой папке
                            </button>
                          )}
                          {displayed.map(chat => (
                            <div key={chat.id} className="group relative flex items-center pl-7 pr-1 py-0.5">
                              {renamingId === chat.id
                                ? <RenameInput value={chat.title} onDone={v => { renameChat(chat.id, v); setRenamingId(null); }} />
                                : (
                                  <>
                                    <button
                                      onClick={() => { setActiveChatId(chat.id); setActiveFolderId(null); }}
                                      className="flex-1 min-w-0 text-left px-2 py-1.5 rounded-lg hover:bg-gray-50"
                                      style={{ background: activeChatId === chat.id ? '#ede9ff' : 'transparent' }}>
                                      <div className="text-[11px] truncate"
                                        style={{ color: activeChatId === chat.id ? '#6b5fd4' : '#6b7280' }}>
                                        {chat.title}
                                      </div>
                                      <div className="text-[10px]" style={{ color: '#d1d5db' }}>{formatTime(chat.ts)}</div>
                                    </button>
                                    <div className="relative opacity-0 group-hover:opacity-100 flex-shrink-0">
                                      <button onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}
                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200">
                                        <MoreHorizontal style={{ width: 11, height: 11, color: '#9ca3af' }} />
                                      </button>
                                      {menuId === chat.id && (
                                        <ContextMenu onClose={() => setMenuId(null)} items={[
                                          { label: 'Переименовать', icon: Pencil, onClick: () => setRenamingId(chat.id) },
                                          {
                                            label: 'В папку', icon: FolderOpen,
                                            sub: [
                                              { label: 'Без папки', onClick: () => moveChat(chat.id, null) },
                                              ...folders.filter(f => f.id !== folder.id).map(f => ({ label: f.name, onClick: () => moveChat(chat.id, f.id) })),
                                            ],
                                          },
                                          { label: 'Удалить', icon: Trash2, danger: true, onClick: () => deleteChat(chat.id) },
                                        ]} />
                                      )}
                                    </div>
                                  </>
                                )
                              }
                            </div>
                          ))}
                          {hasMore && (
                            <button
                              onClick={() => { setActiveFolderId(folder.id); setActiveChatId(null); }}
                              className="w-full text-left pl-8 pr-2 py-1.5 text-[11px] hover:bg-gray-50 rounded-lg"
                              style={{ color: '#6b5fd4' }}>
                              Смотреть все ({folderChats.length}) →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Root chats (no folder) */}
            {rootChats.length > 0 && (
              <div className="px-2 py-1">
                {folders.length > 0 && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1" style={{ color: '#9ca3af' }}>История</p>
                )}
                {rootChats.map(chat => (
                  <div key={chat.id} className="group relative flex items-center px-1 py-0.5">
                    {renamingId === chat.id
                      ? <div className="flex-1 px-2"><RenameInput value={chat.title} onDone={v => { renameChat(chat.id, v); setRenamingId(null); }} /></div>
                      : (
                        <>
                          <button
                            onClick={() => { setActiveChatId(chat.id); setActiveFolderId(null); }}
                            className="flex-1 min-w-0 flex items-start gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-gray-50"
                            style={{ background: activeChatId === chat.id ? '#ede9ff' : 'transparent' }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium truncate"
                                style={{ color: activeChatId === chat.id ? '#6b5fd4' : '#374151' }}>
                                {chat.title}
                              </div>
                              <div className="text-[10px]" style={{ color: '#9ca3af' }}>{formatTime(chat.ts)}</div>
                            </div>
                          </button>
                          <div className="relative opacity-0 group-hover:opacity-100 flex-shrink-0 pr-1">
                            <button onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200">
                              <MoreHorizontal style={{ width: 11, height: 11, color: '#9ca3af' }} />
                            </button>
                            {menuId === chat.id && (
                              <ContextMenu onClose={() => setMenuId(null)} items={[
                                { label: 'Переименовать', icon: Pencil, onClick: () => setRenamingId(chat.id) },
                                {
                                  label: 'В папку', icon: FolderOpen,
                                  sub: folders.length > 0
                                    ? folders.map(f => ({ label: f.name, onClick: () => moveChat(chat.id, f.id) }))
                                    : [{ label: 'Сначала создайте папку', onClick: () => {} }],
                                },
                                { label: 'Удалить', icon: Trash2, danger: true, onClick: () => deleteChat(chat.id) },
                              ]} />
                            )}
                          </div>
                        </>
                      )
                    }
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );

  // ── Start page ────────────────────────────────────────────────────────────────
  const startPage = (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto py-8"
      style={{ background: '#f9f8ff' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'rgba(167,139,250,0.15)' }}>
          <Brain style={{ width: 32, height: 32, color: '#a78bfa' }} />
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>AI Atlas</h1>
        <p className="text-sm max-w-sm" style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Оркестратор всех AI-блоков. Выберите сценарий слева или напишите свободный запрос.
          Перед каждым действием — запрошу подтверждение.
        </p>
      </div>

      <div className="w-full max-w-xl">
        <InputBar
          onSend={(text, att) => createChat(text)}
          placeholder="Спросите что угодно или опишите задачу..."
        />
      </div>

      <div className="w-full max-w-xl flex flex-wrap gap-2 justify-center">
        {[
          'Написать КП для клиента',
          'Проанализировать целевую аудиторию',
          'Найти кандидата на вакансию',
          'Проверить договор на риски',
          'Сделать P&L за месяц',
          'Запустить ДНК-анализ',
          'Провести аудит бизнеса',
          'Персонализированная рассылка лидам',
          'Создать базу знаний из сайта',
          'Анализ конкурентов',
        ].map(chip => (
          <button key={chip} onClick={() => createChat(chip)}
            className="px-3 py-1.5 rounded-full text-xs border transition-all"
            style={{ borderColor: '#e5e7eb', color: '#6b7280', background: '#fff' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.color = '#6b5fd4'; e.currentTarget.style.background = '#ede9ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = '#fff'; }}>
            {chip}
          </button>
        ))}
      </div>
    </div>
  );

  const activeChatFolder = activeChat?.folderId
    ? folders.find(f => f.id === activeChat.folderId) ?? null
    : null;

  // ── Chat view ──────────────────────────────────────────────────────────────────
  const chatView = activeChat && (
    <>
      <div className="flex-shrink-0 flex items-center justify-between px-5 h-11"
        style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => { setActiveChatId(null); setActiveFolderId(null); }}
            className="text-xs flex-shrink-0 hover:underline"
            style={{ color: '#6b5fd4' }}>
            AI Atlas
          </button>
          {activeChatFolder && (
            <>
              <ChevronRight style={{ width: 11, height: 11, color: '#d1d5db', flexShrink: 0 }} />
              <button
                onClick={() => { setActiveFolderId(activeChatFolder.id); setActiveChatId(null); }}
                className="text-xs flex-shrink-0 hover:underline"
                style={{ color: '#6b5fd4' }}>
                {activeChatFolder.name}
              </button>
            </>
          )}
          <ChevronRight style={{ width: 11, height: 11, color: '#d1d5db', flexShrink: 0 }} />
          <span className="text-xs font-medium truncate" style={{ color: '#374151' }}>{activeChat.title}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4" style={{ background: '#f9f8ff' }}>
        {activeChat.messages.map((msg, i) => (
          <div key={i} className={`group flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'atlas' ? (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(167,139,250,0.15)' }}>
                <Brain style={{ width: 14, height: 14, color: '#a78bfa' }} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                style={{ background: '#ede9ff', color: '#6b5fd4' }}>Вы</div>
            )}
            <div className="max-w-[72%]">
              <div className="px-4 py-2.5"
                style={{
                  background: msg.role === 'atlas' ? '#fff' : '#6b5fd4',
                  color: msg.role === 'atlas' ? '#374151' : '#fff',
                  boxShadow: msg.role === 'atlas' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  borderRadius: msg.role === 'atlas' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                }}>
                {msg.attachment && (
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded text-xs"
                    style={{ background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : '#f3f4f6' }}>
                    <FileText style={{ width: 11, height: 11 }} />
                    {msg.attachment.name}
                  </div>
                )}
                <MarkdownMessage text={msg.text} isUser={msg.role === 'user'} />
                {msg.confirmText && (
                  <div className="mt-2 pt-2 text-xs font-medium" style={{ borderTop: '1px solid #f3f4f6', color: '#f97316' }}>
                    ⚠ {msg.confirmText}
                  </div>
                )}
              </div>
              {msg.actionSteps && msg.confirmRequired && (
                <ActionChain
                  steps={msg.actionSteps}
                  onConfirm={() => handleConfirm(activeChatId!, i)}
                  onSkip={() => handleSkip(activeChatId!, i)}
                />
              )}
              {msg.actionSteps && !msg.confirmRequired && (
                <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                  {msg.actionSteps.map((step, j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0" style={{ borderColor: '#f3f4f6' }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                        style={{ background: '#d1fae5', color: '#10b981' }}>✓</div>
                      <span className="text-xs" style={{ color: '#9ca3af', textDecoration: 'line-through' }}>{step.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Message actions */}
              <div className={`flex items-center gap-1.5 mt-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                <span className="text-[10px] select-none"
                  style={{ color: '#9ca3af' }}>
                  {formatTime(msg.ts)}
                </span>
                <button
                  onClick={() => copyText(msg.text)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100"
                  title="Копировать">
                  <Copy style={{ width: 11, height: 11, color: '#9ca3af' }} />
                </button>
                {msg.role === 'atlas' && (
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100"
                    title="Добавить в базу знаний"
                    onClick={() => addToKB(msg.text)}>
                    <BookOpen style={{ width: 11, height: 11, color: '#9ca3af' }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(167,139,250,0.15)' }}>
              <Brain style={{ width: 14, height: 14, color: '#a78bfa' }} />
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(n => (
                  <div key={n} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#a78bfa', animationDelay: `${n * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-5 pt-3 pb-2" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <InputBar
          onSend={(text, att) => sendMessage(text, activeChatId!, att)}
          disabled={loading}
        />
        <p className="text-center text-[10px] mt-2" style={{ color: '#d1d5db' }}>
          LLM-модели могут допускать ошибки. Проверяйте важную информацию.
        </p>
      </div>
    </>
  );

  const activeFolder = folders.find(f => f.id === activeFolderId);

  return (
    <>
    {toast && <Toast message={toast} />}
    <div className="flex h-full">
      {sidebar}

      <div className="flex-1 flex flex-col min-w-0">
        {activeChatId && chatView}
        {!activeChatId && activeFolderId && activeFolder && (
          <FolderView
            folder={activeFolder}
            chats={chats}
            onOpenChat={id => { setActiveChatId(id); setActiveFolderId(null); }}
            onNewChat={() => { const id = createChat(undefined, activeFolderId); }}
            onDeleteChat={deleteChat}
            onRenameChat={renameChat}
            folders={folders}
            onMoveChat={moveChat}
          />
        )}
        {!activeChatId && !activeFolderId && startPage}
      </div>
    </div>
    </>
  );
}

export default function AtlasPage() {
  return (
    <Suspense fallback={null}>
      <AtlasPageInner />
    </Suspense>
  );
}
