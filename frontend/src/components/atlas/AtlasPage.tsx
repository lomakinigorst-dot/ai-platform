'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Brain, Send, Plus, FolderPlus, ChevronRight, Paperclip, Mic,
  Bot, UserCheck, TrendingUp, Users, DollarSign, Scale, BarChart3,
  Check, X, AlertCircle, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';

// ─── Scenarios per block ─────────────────────────────────────────────────────

const BLOCKS = [
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
      'Сгенерировать UTM-ссылку для кампании',
      'Написать скрипт холодного звонка',
      'Подготовить кейс для презентации',
      'Создать рекламный текст для VK Target',
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
      'Создать onboarding-план для нового сотрудника',
      'Написать KPI для менеджера по продажам',
      'Сгенерировать NDA / согласие на обработку',
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
      'Проанализировать дебиторку',
      'Выставить счёт клиенту',
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
      'Проверить условия использования сайта',
      'Подготовить претензию контрагенту',
      'Ответить на юридический вопрос',
      'Проверить соответствие 152-ФЗ',
      'Составить доп. соглашение',
      'Написать политику конфиденциальности',
      'Проверить регистрационные документы',
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
      'Сгенерировать скрипт для холодного звонка',
      'Подготовить презентацию для клиента',
      'Найти причины потери сделок',
      'Составить follow-up email после встречи',
      'Квалифицировать лида по BANT',
      'Написать письмо для реактивации клиента',
      'Подготовить кейс-стади',
      'Рассчитать LTV клиента',
      'Составить план развития аккаунта',
    ],
  },
];

// ─── Action chain mock responses ──────────────────────────────────────────────

type ActionStep = { label: string; status: 'pending' | 'confirm' | 'done' | 'skip' };
type AtlasMessage = {
  role: 'user' | 'atlas';
  text: string;
  ts: Date;
  actionSteps?: ActionStep[];
  confirmRequired?: boolean;
  confirmText?: string;
};

interface Chat {
  id: string;
  title: string;
  ts: Date;
  messages: AtlasMessage[];
}

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
    text: '📲 Подготовил промо-пост для TG-канала на основе вашего ДНК-анализа:\n\n**Текст поста:**\nАвтоматизируйте работу с клиентами за 24 часа! AI-виджет Atlas отвечает на вопросы, собирает заявки и квалифицирует лидов — даже ночью 🌙\n\n✅ Первые 14 дней — бесплатно\n✅ Настройка без программиста за 30 мин\n✅ Лиды в Telegram сразу\n\n👉 Запустить демо: [ссылка]\n\n**Канал:** @atlas_updates  \n**Дата и время:** 29 мая, 14:00',
    actionSteps: [
      { label: 'Генерация текста поста на основе ДНК', status: 'done' },
      { label: 'Подбор хэштегов и CTA', status: 'done' },
      { label: 'Публикация в TG-канале 29.05 в 14:00', status: 'confirm' },
      { label: 'Создание записи в Маркетолог → Кампании', status: 'pending' },
    ],
    confirmRequired: true,
    confirmText: 'Запланировать публикацию в TG на 29 мая в 14:00 и создать запись в разделе Кампании?',
  },
  'Написать коммерческое предложение': {
    text: 'Подготовлю персонализированное КП. Уточните: для какого клиента и какой продукт/услугу предлагаете?\n\nЕсли хотите — могу взять данные из последних диалогов и сформировать КП автоматически.',
    actionSteps: [
      { label: 'Анализ профиля клиента', status: 'done' },
      { label: 'Подбор аргументов из ДНК-анализа', status: 'done' },
      { label: 'Генерация текста КП', status: 'confirm' },
      { label: 'Создание PDF-файла', status: 'pending' },
      { label: 'Отправка клиенту на email', status: 'pending' },
    ],
    confirmRequired: true,
    confirmText: 'Структура КП готова (3 раздела, 1.2 стр.). Сгенерировать финальный текст и PDF?',
  },
};

const DEFAULT_RESPONSE: AtlasMessage = {
  role: 'atlas',
  text: 'Анализирую запрос и определяю нужные AI-блоки...\n\nДля выполнения этой задачи подключу AI Консультанта и AI Маркетолога. Начинаю работу — сообщу о результате.',
  ts: new Date(),
};

const ATLAS_GREETING = `Привет! Я AI Atlas — оркестратор вашей платформы.

Координирую все AI-блоки: Консультант, Маркетолог, HR, Финансы, Юрист, Продажи.

Выберите блок слева и задачу — или напишите свой запрос. Перед каждым важным действием буду спрашивать подтверждение.`;

function formatTime(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ─── Action steps UI ──────────────────────────────────────────────────────────

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
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs`}
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
            {step.status === 'confirm' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#fff7ed', color: '#f97316' }}>
                Ожидает
              </span>
            )}
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

// ─── Inner page ───────────────────────────────────────────────────────────────

function AtlasPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [chats,        setChats]        = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<string | null>('consultant');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { createChat(q); router.replace('/atlas'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAtlasReply = (chatId: string, reply: Omit<AtlasMessage, 'ts'>) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...c.messages, { ...reply, ts: new Date() }] } : c
    ));
  };

  const sendMessage = (text: string, chatId?: string) => {
    const cid = chatId ?? activeChatId;
    if (!text.trim() || loading || !cid) return;
    setInput('');
    setChats(prev => prev.map(c =>
      c.id === cid ? { ...c, messages: [...c.messages, { role: 'user' as const, text, ts: new Date() }] } : c
    ));
    setLoading(true);

    const preset = SCENARIO_RESPONSES[text];
    setTimeout(() => {
      setLoading(false);
      if (preset) {
        addAtlasReply(cid, { role: 'atlas', text: preset.text, actionSteps: preset.actionSteps, confirmRequired: preset.confirmRequired, confirmText: preset.confirmText });
      } else {
        const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';
        fetchStream(cid, text, apiBase);
      }
    }, preset ? 1200 : 0);
  };

  const fetchStream = async (chatId: string, userText: string, apiBase: string) => {
    setLoading(true);
    try {
      const chat = chats.find(c => c.id === chatId);
      const apiMessages = (chat?.messages ?? [])
        .filter(m => !(m.role === 'atlas' && m.text === ATLAS_GREETING))
        .map(m => ({ role: m.role === 'atlas' ? 'assistant' : 'user', content: m.text }));
      apiMessages.push({ role: 'user', content: userText });

      const resp = await fetch(`${apiBase}/api/v1/atlas/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}` },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let replyText = '';

      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c, messages: [...c.messages, { role: 'atlas' as const, text: '', ts: new Date() }],
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
              setChats(prev => prev.map(c => c.id === chatId ? {
                ...c, messages: c.messages.map((m, i) =>
                  i === c.messages.length - 1 ? { ...m, text: snapshot } : m
                ),
              } : c));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      addAtlasReply(chatId, {
        role: 'atlas',
        text: 'Ошибка соединения с сервером. Проверьте, что backend запущен.',
      });
    } finally {
      setLoading(false);
    }
  };

  const createChat = (initialText?: string) => {
    const id = Date.now().toString();
    const msgs: AtlasMessage[] = [{ role: 'atlas', text: ATLAS_GREETING, ts: new Date() }];
    const newChat: Chat = {
      id,
      title: initialText ? initialText.slice(0, 42) : 'Новый чат',
      ts: new Date(),
      messages: msgs,
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(id);
    setInput('');
    if (initialText) {
      setTimeout(() => sendMessage(initialText, id), 100);
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
        msg.confirmText = nextPending >= 0 ? `Шаг ${nextPending + 1} готов к выполнению. Продолжить?` : undefined;
        if (nextPending < 0) {
          msgs.push({ role: 'atlas', text: '✅ Все шаги выполнены! Задача завершена.', ts: new Date() });
        }
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

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Blocks + History Sidebar ── */}
      <div className="flex flex-col flex-shrink-0 border-r overflow-hidden"
        style={{ width: 240, background: '#fff', borderColor: '#e5e7eb' }}>

        {/* New chat button */}
        <div className="p-3 flex gap-2 flex-shrink-0">
          <button onClick={() => createChat()}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#6b5fd4' }}>
            <Plus style={{ width: 13, height: 13 }} /> Новый чат
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <FolderPlus style={{ width: 15, height: 15, color: '#9ca3af' }} />
          </button>
        </div>

        {/* Blocks with scenarios */}
        <div className="flex-1 overflow-y-auto">
          {/* Chat history */}
          {chats.length > 0 && (
            <div className="px-2 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1.5" style={{ color: '#9ca3af' }}>История</p>
              {chats.map(chat => (
                <button key={chat.id} onClick={() => setActiveChatId(chat.id)}
                  className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left"
                  style={{ background: chat.id === activeChatId ? '#ede9ff' : 'transparent' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate"
                      style={{ color: chat.id === activeChatId ? '#6b5fd4' : '#374151' }}>
                      {chat.title}
                    </div>
                    <div className="text-[10px]" style={{ color: '#9ca3af' }}>{formatTime(chat.ts)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Blocks */}
          <div className="px-2 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1.5" style={{ color: '#9ca3af' }}>AI-блоки</p>
            {BLOCKS.map(block => {
              const Icon = block.icon;
              const isOpen = expandedBlock === block.id;
              return (
                <div key={block.id}>
                  <button
                    onClick={() => setExpandedBlock(isOpen ? null : block.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: block.color + '18' }}>
                      <Icon style={{ width: 11, height: 11, color: block.color }} />
                    </div>
                    <span className="flex-1 text-[12px] font-medium text-left truncate" style={{ color: '#374151' }}>
                      {block.label}
                    </span>
                    {isOpen
                      ? <ChevronUp style={{ width: 12, height: 12, color: '#9ca3af' }} />
                      : <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af' }} />
                    }
                  </button>
                  {isOpen && (
                    <div className="pl-2 pb-1">
                      {block.scenarios.map(sc => (
                        <button key={sc}
                          onClick={() => createChat(sc)}
                          className="w-full text-left text-[11px] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ color: '#6b7280' }}
                          onMouseEnter={e => { e.currentTarget.style.color = block.color; }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                          {sc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t p-2 flex-shrink-0" style={{ borderColor: '#f3f4f6' }}>
          {['Артефакты', 'Память'].map(label => (
            <button key={label} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
              <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#f9f8ff' }}>
        {activeChatId === null ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto py-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(167,139,250,0.15)' }}>
                <Brain style={{ width: 28, height: 28, color: '#a78bfa' }} />
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>AI Atlas</h1>
              <p className="text-sm max-w-sm" style={{ color: '#6b7280', lineHeight: 1.6 }}>
                Оркестратор всех AI-блоков. Выберите сценарий слева или напишите свободный запрос.
                Перед каждым действием — запрошу подтверждение.
              </p>
            </div>

            {/* Input */}
            <div className="w-full max-w-xl">
              <div className="flex flex-col rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: '1.5px solid #e5e7eb', boxShadow: '0 2px 16px rgba(107,95,212,0.07)' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) createChat(input.trim()); } }}
                  placeholder="Спросите что угодно или опишите задачу..."
                  className="flex-1 resize-none bg-transparent text-sm outline-none px-4 pt-3.5 pb-2"
                  style={{ color: '#374151', minHeight: 52, maxHeight: 140, lineHeight: 1.6 }}
                  rows={2}
                />
                <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid #f3f4f6' }}>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <Paperclip style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <Mic style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                  </div>
                  <button onClick={() => input.trim() && createChat(input.trim())} disabled={!input.trim()}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                    style={{ background: input.trim() ? '#6b5fd4' : '#e5e7eb', color: input.trim() ? '#fff' : '#9ca3af' }}>
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick chips */}
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

        ) : (
          /* Active chat */
          <>
            <div className="flex-shrink-0 flex items-center px-5 h-11 gap-2"
              style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
              <span className="text-xs" style={{ color: '#9ca3af' }}>AI Atlas</span>
              <ChevronRight style={{ width: 12, height: 12, color: '#9ca3af' }} />
              <span className="text-xs font-medium truncate" style={{ color: '#374151' }}>
                {activeChat?.title ?? 'Чат'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              {(activeChat?.messages ?? []).map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'atlas' ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(167,139,250,0.15)' }}>
                      <Brain style={{ width: 14, height: 14, color: '#a78bfa' }} />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                      style={{ background: '#ede9ff', color: '#6b5fd4' }}>Вы</div>
                  )}
                  <div className="max-w-[70%]">
                    <div className="px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: msg.role === 'atlas' ? '#fff' : '#6b5fd4',
                        color: msg.role === 'atlas' ? '#374151' : '#fff',
                        boxShadow: msg.role === 'atlas' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                        borderRadius: msg.role === 'atlas' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                        whiteSpace: 'pre-wrap',
                      }}>
                      {msg.text}
                      {msg.confirmText && (
                        <div className="mt-2 pt-2 text-xs font-medium" style={{ borderTop: '1px solid #f3f4f6', color: '#f97316' }}>
                          ⚠ {msg.confirmText}
                        </div>
                      )}
                    </div>
                    {msg.actionSteps && (
                      <ActionChain
                        steps={msg.actionSteps}
                        onConfirm={() => handleConfirm(activeChatId, i)}
                        onSkip={() => handleSkip(activeChatId, i)}
                      />
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(167,139,250,0.15)' }}>
                    <Brain style={{ width: 14, height: 14, color: '#a78bfa' }} />
                  </div>
                  <div className="px-4 py-2.5"
                    style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: '4px 12px 12px 12px' }}>
                    <div className="flex gap-1 items-center h-4">
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

            {/* Input */}
            <div className="flex-shrink-0 px-5 py-3" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
              <div className="flex flex-col rounded-xl overflow-hidden"
                style={{ background: '#f9f8ff', border: '1.5px solid #e9e8f0' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Напишите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                  className="flex-1 resize-none bg-transparent text-sm outline-none px-4 pt-3 pb-1"
                  style={{ color: '#374151', minHeight: 42, maxHeight: 100, lineHeight: 1.5 }}
                  rows={1}
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <Paperclip style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
                      <Mic style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                  </div>
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                    style={{
                      background: input.trim() && !loading ? '#6b5fd4' : '#e5e7eb',
                      color: input.trim() && !loading ? '#fff' : '#9ca3af',
                    }}>
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AtlasPage() {
  return (
    <Suspense fallback={null}>
      <AtlasPageInner />
    </Suspense>
  );
}
