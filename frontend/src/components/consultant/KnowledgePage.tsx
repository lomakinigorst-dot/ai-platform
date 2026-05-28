'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, knowledgeApi } from '@/lib/api';
import {
  Database, Search, Plus, Upload, Trash2, Edit2, Check, X,
  Globe, FileText, Brain, MessageSquare, ChevronDown, RefreshCw,
  Zap, BookOpen, TestTube2,
} from 'lucide-react';

const SOURCE_TABS = [
  { id: 'all',    label: 'Все' },
  { id: 'site',   label: 'Сайт' },
  { id: 'manual', label: 'Вручную' },
  { id: 'atlas',  label: 'Atlas KB' },
  { id: 'qa',     label: 'Q&A' },
];

const SOURCE_ICON: Record<string, React.ElementType> = {
  site:   Globe,
  manual: FileText,
  atlas:  Brain,
  qa:     MessageSquare,
};

const SOURCE_COLOR: Record<string, string> = {
  site:   '#3b82f6',
  manual: '#10b981',
  atlas:  '#8b5cf6',
  qa:     '#f97316',
};

const SOURCE_LABEL: Record<string, string> = {
  site:   'Сайт',
  manual: 'Вручную',
  atlas:  'Atlas KB',
  qa:     'Q&A',
};

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="rounded-xl px-5 py-4 flex flex-col gap-1"
      style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
    </div>
  );
}

export default function KnowledgePage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', content: '', folder: '' });
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState<string | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.list(),
  });

  const clientId = selectedClientId ?? clients?.[0]?.id ?? null;
  const client = clients?.find(c => c.id === clientId);

  const { data: items, isLoading } = useQuery({
    queryKey: ['knowledge', clientId, search],
    queryFn: () => clientId ? knowledgeApi.list(clientId, { search: search || undefined }) : Promise.resolve([]),
    enabled: !!clientId,
  });

  const filteredItems = (items ?? []).filter(item => {
    if (sourceFilter === 'all') return true;
    const t = item.source_type;
    if (sourceFilter === 'site') return t === 'site' || t === 'crawl';
    if (sourceFilter === 'atlas') return t === 'atlas';
    if (sourceFilter === 'qa') return t === 'qa';
    return t === sourceFilter;
  });

  const counts = {
    all:    items?.length ?? 0,
    site:   items?.filter(i => i.source_type === 'site' || i.source_type === 'crawl').length ?? 0,
    manual: items?.filter(i => i.source_type === 'manual').length ?? 0,
    atlas:  items?.filter(i => i.source_type === 'atlas').length ?? 0,
    qa:     items?.filter(i => i.source_type === 'qa').length ?? 0,
  };

  const withEmbedding = items?.length ?? 0;
  const totalTokens = items?.reduce((s, i) => s + (i.token_count ?? 0), 0) ?? 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      clientId ? knowledgeApi.update(clientId, id, content) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', clientId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientId ? knowledgeApi.delete(clientId, id) : Promise.reject(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge', clientId] }),
  });

  const createMutation = useMutation({
    mutationFn: () => clientId ? knowledgeApi.create(clientId, newItem) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', clientId] });
      setShowAdd(false);
      setNewItem({ title: '', content: '', folder: '' });
    },
  });

  const testRag = async () => {
    if (!ragQuery.trim() || !clientId) return;
    setRagLoading(true);
    setRagResult(null);
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') ?? '' : '';
      const resp = await fetch(`/api/v1/atlas/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `[RAG TEST for client ${clientId}] ${ragQuery}` }],
        }),
      });
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) text += data.text;
          } catch { /* */ }
        }
      }
      setRagResult(text || 'Ответ не получен');
    } catch {
      setRagResult('Ошибка соединения');
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" style={{ background: '#f9f8ff' }}>
      <div className="max-w-4xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>База знаний</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Управление данными для AI-ответов</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Client selector */}
            {clients && clients.length > 0 && (
              <div className="relative">
                <select
                  value={clientId ?? ''}
                  onChange={e => setSelectedClientId(e.target.value || null)}
                  className="appearance-none text-xs pl-3 pr-7 py-2 rounded-lg border outline-none cursor-pointer"
                  style={{ borderColor: '#e5e7eb', background: '#fff', color: '#374151' }}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown style={{ width: 12, height: 12, color: '#9ca3af', position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            )}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-lg"
              style={{ background: '#6b5fd4' }}>
              <Plus style={{ width: 13, height: 13 }} />
              Добавить вручную
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard value={counts.all} label="Всего чанков" color="#6b5fd4" />
          <StatCard value={withEmbedding} label="Проиндексировано" color="#10b981" />
          <StatCard value={`${Math.round(totalTokens / 1000)}K`} label="Токенов" color="#3b82f6" />
          <StatCard value={counts.atlas} label="Atlas KB записей" color="#8b5cf6" />
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            {SOURCE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sourceFilter === tab.id ? '#6b5fd4' : 'transparent',
                  color: sourceFilter === tab.id ? '#fff' : '#6b7280',
                }}>
                {tab.label}
                {counts[tab.id as keyof typeof counts] > 0 && (
                  <span className="text-[10px] px-1 rounded-full"
                    style={{
                      background: sourceFilter === tab.id ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                      color: sourceFilter === tab.id ? '#fff' : '#9ca3af',
                    }}>
                    {counts[tab.id as keyof typeof counts]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 h-9 rounded-xl" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <Search style={{ width: 14, height: 14, color: '#9ca3af', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по содержимому..."
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: '#374151' }}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X style={{ width: 13, height: 13, color: '#9ca3af' }} />
              </button>
            )}
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #ede9ff', boxShadow: '0 2px 8px rgba(107,95,212,0.08)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>Новая запись</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Папка (FAQ, Услуги...)"
                value={newItem.folder}
                onChange={e => setNewItem(n => ({ ...n, folder: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border outline-none"
                style={{ width: 160, borderColor: '#e5e7eb', color: '#374151' }}
              />
              <input
                type="text"
                placeholder="Заголовок"
                value={newItem.title}
                onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
                className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
                style={{ borderColor: '#e5e7eb', color: '#374151' }}
              />
            </div>
            <textarea
              placeholder="Текст записи..."
              value={newItem.content}
              onChange={e => setNewItem(n => ({ ...n, content: e.target.value }))}
              rows={4}
              className="w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none"
              style={{ borderColor: '#e5e7eb', color: '#374151' }}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newItem.title || !newItem.content || createMutation.isPending}
                className="text-xs font-semibold text-white px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ background: '#6b5fd4' }}>
                {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewItem({ title: '', content: '', folder: '' }); }}
                className="text-xs px-4 py-2 rounded-lg border"
                style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Knowledge list */}
        {!clientId ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <Database style={{ width: 36, height: 36, color: '#d1d5db', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: '#9ca3af' }}>Нет клиентов — создайте клиента и добавьте сайт</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <RefreshCw style={{ width: 16, height: 16, color: '#9ca3af', animation: 'spin 1s linear infinite' }} />
            <span className="text-sm" style={{ color: '#9ca3af' }}>Загрузка...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <BookOpen style={{ width: 36, height: 36, color: '#d1d5db', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              {search ? 'Ничего не найдено' : sourceFilter !== 'all' ? 'Нет записей этого типа' : 'База знаний пуста'}
            </p>
            {!search && sourceFilter === 'all' && (
              <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>Запустите сканирование сайта на странице клиента</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredItems.map(item => {
              const srcType = item.source_type === 'crawl' ? 'site' : (item.source_type ?? 'manual');
              const Icon = SOURCE_ICON[srcType] ?? FileText;
              const color = SOURCE_COLOR[srcType] ?? '#6b7280';
              const srcLabel = SOURCE_LABEL[srcType] ?? item.source_type;
              return (
                <div key={item.id} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: color + '18' }}>
                      <Icon style={{ width: 13, height: 13, color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {item.title && (
                          <span className="text-xs font-semibold" style={{ color: '#374151' }}>{item.title}</span>
                        )}
                        {item.folder && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                            {item.folder}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: color + '18', color }}>
                          {srcLabel}
                        </span>
                        <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: '#9ca3af' }}>
                          {item.token_count} токенов
                        </span>
                      </div>
                      {item.source_url && (
                        <p className="text-[11px] mb-1 truncate" style={{ color: '#93c5fd' }}>{item.source_url}</p>
                      )}
                      {editingId === item.id ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={4}
                            className="w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none"
                            style={{ borderColor: '#6b5fd4', color: '#374151' }}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, content: editText })}
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                              style={{ background: '#6b5fd4' }}>
                              <Check style={{ width: 11, height: 11 }} /> Сохранить
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border"
                              style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
                              <X style={{ width: 11, height: 11 }} /> Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#6b7280' }}>
                          {item.content_edited || item.content}
                        </p>
                      )}
                      {item.content_edited && editingId !== item.id && (
                        <span className="text-[10px]" style={{ color: '#6b5fd4' }}>✎ отредактировано</span>
                      )}
                    </div>
                    {editingId !== item.id && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setEditingId(item.id); setEditText(item.content_edited || item.content); }}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
                          title="Редактировать">
                          <Edit2 style={{ width: 12, height: 12, color: '#9ca3af' }} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                          title="Удалить">
                          <Trash2 style={{ width: 12, height: 12, color: '#9ca3af' }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RAG test section */}
        <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2 mb-3">
            <TestTube2 style={{ width: 15, height: 15, color: '#6b5fd4' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Тест RAG-поиска</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#ede9ff', color: '#6b5fd4' }}>
              Проверить качество ответов
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={ragQuery}
              onChange={e => setRagQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testRag()}
              placeholder="Введите вопрос для проверки..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
              style={{ borderColor: '#e5e7eb', color: '#374151' }}
            />
            <button
              onClick={testRag}
              disabled={!ragQuery.trim() || ragLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg disabled:opacity-50"
              style={{ background: '#6b5fd4' }}>
              {ragLoading ? (
                <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap style={{ width: 12, height: 12 }} />
              )}
              Тест
            </button>
          </div>
          {ragResult && (
            <div className="mt-3 p-3 rounded-lg text-sm leading-relaxed"
              style={{ background: '#f9f8ff', border: '1px solid #ede9ff', color: '#374151' }}>
              {ragResult}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
