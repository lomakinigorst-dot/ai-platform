'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Brain, Send, Plus, FolderPlus, ChevronRight, Paperclip, Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'atlas';
  text: string;
  ts: Date;
}

interface Chat {
  id: string;
  title: string;
  ts: Date;
  messages: Message[];
}

const QUICK_CHIPS = [
  'Написать пост и запустить рассылку',
  'Проанализировать целевую аудиторию',
  'Найти кандидатов на вакансию',
  'Проверить договор на риски',
  'Сделать P&L отчёт за месяц',
  'Написать скрипт продаж',
  'Провести аудит бизнеса',
  'Персонализированная рассылка лидам',
  'Создать базу знаний для консультанта',
  'Анализ конкурентов',
];

const ATLAS_GREETING = `Привет! Я AI Atlas — оркестратор вашей платформы. Я координирую все AI-блоки: маркетолога, консультанта, HR, финансы, юриста и отдел продаж.

Напишите задачу — определю, какие блоки подключить, и запущу работу.`;

function formatTime(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Внутренний компонент — использует useSearchParams
function AtlasPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [chats,        setChats]        = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length]);

  // Автозапуск чата при переходе с ?q= из быстрых действий
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      createChat(q);
      router.replace('/atlas');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streamReply = async (chatId: string, history: Message[]) => {
    setLoading(true);

    // Собираем историю для API (без начального приветствия Atlas)
    const apiMessages = history
      .filter(m => !(m.role === 'atlas' && m.text === ATLAS_GREETING))
      .map(m => ({ role: m.role === 'atlas' ? 'assistant' : 'user', content: m.text }));

    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';

    try {
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

      // Добавляем пустое сообщение Atlas — будем дополнять по мере стриминга
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
                ...c,
                messages: c.messages.map((m, i) =>
                  i === c.messages.length - 1 ? { ...m, text: snapshot } : m
                ),
              } : c));
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setChats(prev => prev.map(c => c.id === chatId ? {
        ...c,
        messages: [...c.messages, {
          role: 'atlas' as const,
          text: 'Ошибка соединения с сервером. Проверьте, что backend запущен.',
          ts: new Date(),
        }],
      } : c));
    } finally {
      setLoading(false);
    }
  };

  const createChat = (initialText?: string) => {
    const id   = Date.now().toString();
    const msgs: Message[] = [{ role: 'atlas', text: ATLAS_GREETING, ts: new Date() }];
    if (initialText) msgs.push({ role: 'user', text: initialText, ts: new Date() });

    const newChat: Chat = {
      id,
      title: initialText ? initialText.slice(0, 42) : 'Новый чат',
      ts: new Date(),
      messages: msgs,
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(id);
    setInput('');
    if (initialText) streamReply(id, msgs);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading || !activeChatId) return;
    setInput('');
    let updatedMsgs: Message[] = [];
    setChats(prev => prev.map(c => {
      if (c.id !== activeChatId) return c;
      updatedMsgs = [...c.messages, { role: 'user' as const, text, ts: new Date() }];
      return { ...c, messages: updatedMsgs };
    }));
    setTimeout(() => streamReply(activeChatId, updatedMsgs), 0);
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Chat History Sidebar ── */}
      <div
        className="flex flex-col flex-shrink-0 border-r"
        style={{ width: 220, background: '#fff', borderColor: '#e5e7eb' }}
      >
        <div className="p-3 flex gap-2 flex-shrink-0">
          <button
            onClick={() => createChat()}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[8px] text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#6b5fd4' }}
          >
            <Plus style={{ width: 13, height: 13 }} /> Новый чат
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#f4f3f8] transition-colors" title="Новая папка">
            <FolderPlus style={{ width: 15, height: 15, color: '#9ca3af' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {chats.length === 0 ? (
            <p className="text-center text-[11px] py-8" style={{ color: '#c4b5fd' }}>
              История чатов пуста
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className="w-full flex items-start gap-2 px-2.5 py-2 rounded-[8px] text-left transition-colors"
                  style={{ background: chat.id === activeChatId ? '#ede9ff' : 'transparent' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate leading-tight"
                      style={{ color: chat.id === activeChatId ? '#6b5fd4' : '#374151' }}>
                      {chat.title}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>
                      {formatTime(chat.ts)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2 flex-shrink-0" style={{ borderColor: '#f3f4f6' }}>
          {['Артефакты', 'Память'].map(label => (
            <button key={label} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] hover:bg-[#f4f3f8] transition-colors">
              <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: '#f9f8ff' }}>

        {activeChatId === null ? (
          /* ── Пустое состояние ── */
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 overflow-y-auto py-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(167,139,250,0.15)' }}>
                <Brain style={{ width: 28, height: 28, color: '#a78bfa' }} />
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>AI Atlas</h1>
              <p className="text-sm max-w-[360px]" style={{ color: '#6b7280', lineHeight: 1.6 }}>
                Ваш умный бизнес-оркестратор. Задайте вопрос, управляйте AI-блоками или анализируйте данные.
              </p>
            </div>

            {/* Поле ввода (пустое состояние) */}
            <div className="w-full max-w-[580px]">
              <div
                className="flex flex-col rounded-[14px] overflow-hidden"
                style={{ background: '#fff', border: '1.5px solid #e5e7eb', boxShadow: '0 2px 16px rgba(107,95,212,0.07)' }}
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) createChat(input.trim()); } }}
                  placeholder="Спросите что угодно..."
                  className="flex-1 resize-none bg-transparent text-sm outline-none px-4 pt-3.5 pb-2"
                  style={{ color: '#374151', minHeight: 52, maxHeight: 140, lineHeight: 1.6 }}
                  rows={2}
                />
                {/* Нижняя панель инструментов */}
                <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid #f3f4f6' }}>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f4f3f8] transition-colors" title="Прикрепить файл">
                      <Paperclip style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f4f3f8] transition-colors" title="Голосовое сообщение">
                      <Mic style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                  </div>
                  <button
                    onClick={() => input.trim() && createChat(input.trim())}
                    disabled={!input.trim()}
                    className="flex items-center justify-center w-8 h-8 rounded-[8px] transition-all"
                    style={{ background: input.trim() ? '#6b5fd4' : '#e5e7eb', color: input.trim() ? '#fff' : '#9ca3af' }}
                  >
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Быстрые чипсы */}
            <div className="w-full max-w-[580px] flex flex-wrap gap-2 justify-center">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => createChat(chip)}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all hover:bg-[#ede9ff] hover:border-[#c4b5fd] hover:text-[#6b5fd4]"
                  style={{ borderColor: '#e5e7eb', color: '#6b7280', background: '#fff' }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* ── Активный чат ── */
          <>
            {/* Breadcrumb */}
            <div className="flex-shrink-0 flex items-center px-5 h-11 gap-2"
              style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
              <span className="text-[11px]" style={{ color: '#9ca3af' }}>AI Atlas</span>
              <ChevronRight style={{ width: 12, height: 12, color: '#9ca3af' }} />
              <span className="text-[11px] font-medium truncate" style={{ color: '#374151' }}>
                {activeChat?.title ?? 'Чат'}
              </span>
            </div>

            {/* Сообщения */}
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
                      style={{ background: '#ede9ff', color: '#6b5fd4' }}>
                      Вы
                    </div>
                  )}
                  <div
                    className="max-w-[68%] px-4 py-2.5 text-sm leading-relaxed"
                    style={{
                      background:   msg.role === 'atlas' ? '#fff' : '#6b5fd4',
                      color:        msg.role === 'atlas' ? '#374151' : '#fff',
                      boxShadow:    msg.role === 'atlas' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                      borderRadius: msg.role === 'atlas' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(167,139,250,0.15)' }}>
                    <Brain style={{ width: 14, height: 14, color: '#a78bfa' }} />
                  </div>
                  <div className="px-4 py-2.5" style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: '4px 12px 12px 12px' }}>
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(n => (
                        <div key={n} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#a78bfa', animation: `bounce 1.2s ${n * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Поле ввода активного чата */}
            <div className="flex-shrink-0 px-5 py-3" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
              <div
                className="flex flex-col rounded-[12px] overflow-hidden"
                style={{ background: '#f9f8ff', border: '1.5px solid #e9e8f0' }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Напишите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                  className="flex-1 resize-none bg-transparent text-sm outline-none px-4 pt-3 pb-1"
                  style={{ color: '#374151', minHeight: 42, maxHeight: 100, lineHeight: 1.5 }}
                  rows={1}
                />
                {/* Кнопки под инпутом */}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#eee] transition-colors" title="Прикрепить файл">
                      <Paperclip style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#eee] transition-colors" title="Голосовое сообщение">
                      <Mic style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="flex items-center justify-center w-8 h-8 rounded-[8px] transition-all"
                    style={{
                      background: input.trim() && !loading ? '#6b5fd4' : '#e5e7eb',
                      color:      input.trim() && !loading ? '#fff'    : '#9ca3af',
                    }}
                  >
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

// Оборачиваем в Suspense из-за useSearchParams
export default function AtlasPage() {
  return (
    <Suspense fallback={null}>
      <AtlasPageInner />
    </Suspense>
  );
}
