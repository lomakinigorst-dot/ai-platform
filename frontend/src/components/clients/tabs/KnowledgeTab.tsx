'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi } from '@/lib/api';
import { Database, Edit2, Trash2, Plus, Search, Check, X } from 'lucide-react';

export default function KnowledgeTab({ clientId }: { clientId: string }) {
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', content: '' });
  const queryClient = useQueryClient();

  const { data: sources } = useQuery({
    queryKey: ['knowledge-sources', clientId],
    queryFn: () => knowledgeApi.sources(clientId),
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['knowledge', clientId, search, selectedSource],
    queryFn: () => knowledgeApi.list(clientId, {
      search: search || undefined,
      source_url: selectedSource || undefined,
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      knowledgeApi.update(clientId, id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', clientId] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => knowledgeApi.delete(clientId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge', clientId] }),
  });

  const createMutation = useMutation({
    mutationFn: () => knowledgeApi.create(clientId, newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', clientId] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources', clientId] });
      setShowAdd(false);
      setNewItem({ title: '', content: '' });
    },
  });

  return (
    <div className="max-w-5xl">
      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по тексту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        <select
          value={selectedSource}
          onChange={e => setSelectedSource(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-blue-400 bg-white max-w-xs"
        >
          <option value="">Все источники ({sources?.reduce((a, s) => a + s.chunks, 0) ?? 0} чанков)</option>
          {sources?.map(s => (
            <option key={s.source_url} value={s.source_url}>
              {s.source_url?.split('/').slice(-2).join('/') ?? 'manual'} ({s.chunks})
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-white bg-blue-600 rounded-lg px-3 py-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Добавить вручную
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Новая запись</h3>
          <input
            type="text"
            placeholder="Заголовок (например: FAQ или прайс)"
            value={newItem.title}
            onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-400"
          />
          <textarea
            placeholder="Текст записи..."
            value={newItem.content}
            onChange={e => setNewItem(n => ({ ...n, content: e.target.value }))}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newItem.title || !newItem.content || createMutation.isPending}
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewItem({ title: '', content: '' }); }}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <p className="text-gray-400 text-sm py-4">Загрузка...</p>
      ) : !items || items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Элементов базы знаний нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {item.title && (
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{item.title}</div>
                  )}
                  {item.source_url && (
                    <div className="text-xs text-blue-500 mb-1 truncate">{item.source_url}</div>
                  )}

                  {editingId === item.id ? (
                    <div>
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={5}
                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: item.id, content: editText })}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 text-xs text-white bg-blue-600 rounded px-3 py-1.5 hover:bg-blue-700"
                        >
                          <Check className="w-3 h-3" />
                          Сохранить
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50"
                        >
                          <X className="w-3 h-3" />
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                      {item.content_edited || item.content}
                    </p>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {item.token_count} токенов · чанк #{item.chunk_index}
                    {item.content_edited && <span className="ml-2 text-blue-500">✎ отредактировано</span>}
                  </div>
                </div>

                {editingId !== item.id && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingId(item.id); setEditText(item.content_edited || item.content); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
