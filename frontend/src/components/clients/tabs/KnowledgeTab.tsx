'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi, clientsApi, KnowledgeItem } from '@/lib/api';
import {
  Database, Edit2, Trash2, Plus, Search, Check, X,
  FolderOpen, Folder, ChevronDown, ChevronRight,
  Zap, AlertTriangle, RefreshCw,
} from 'lucide-react';

interface Props {
  clientId: string;
  scanQuality?: number;
  needsDeepScan?: boolean;
  isIndexing?: boolean;
  scanPhase?: string | null;
}

export default function KnowledgeTab({
  clientId,
  scanQuality = 0,
  needsDeepScan = false,
  isIndexing = false,
  scanPhase,
}: Props) {
  const [search, setSearch] = useState('');
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['Сайт', 'О компании', 'Контакты', 'Каталог']));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', content: '', folder: '' });
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['knowledge', clientId, search],
    queryFn: () => knowledgeApi.list(clientId, { search: search || undefined }),
    refetchInterval: isIndexing ? 3000 : false,
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
      setShowAdd(false);
      setNewItem({ title: '', content: '', folder: '' });
    },
  });

  const deepScanMutation = useMutation({
    mutationFn: () => clientsApi.deepScan(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', clientId] }),
  });

  // Group items by folder
  const grouped = (items ?? []).reduce<Record<string, KnowledgeItem[]>>((acc, item) => {
    const folder = item.folder || 'Сайт';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(item);
    return acc;
  }, {});

  const folderOrder = ['Главная', 'О компании', 'Контакты', 'Доставка', 'Оплата', 'Гарантия', 'Каталог', 'Услуги', 'Новости', 'Сайт'];
  const sortedFolders = [
    ...folderOrder.filter(f => grouped[f]),
    ...Object.keys(grouped).filter(f => !folderOrder.includes(f)).sort(),
  ];

  const toggleFolder = (folder: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const qualityColor = scanQuality >= 70 ? 'text-green-600' : scanQuality >= 40 ? 'text-yellow-600' : 'text-red-600';
  const qualityBg = scanQuality >= 70 ? 'bg-green-50 border-green-200' : scanQuality >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="max-w-5xl">

      {/* Scan quality banner */}
      {!isIndexing && scanQuality > 0 && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-4 ${qualityBg}`}>
          <div className={`text-2xl font-bold ${qualityColor}`}>{scanQuality}</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              Качество базы знаний: {scanQuality >= 70 ? 'Хорошее' : scanQuality >= 40 ? 'Среднее' : 'Низкое'}
            </div>
            <div className="text-xs text-gray-500">
              {items?.length ?? 0} чанков · {sortedFolders.length} папок
            </div>
          </div>
          {needsDeepScan && (
            <button
              onClick={() => deepScanMutation.mutate()}
              disabled={deepScanMutation.isPending}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg px-3 py-2 font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              {deepScanMutation.isPending ? 'Запуск...' : 'Глубокое сканирование'}
            </button>
          )}
        </div>
      )}

      {/* Indexing progress */}
      {isIndexing && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-blue-800">Сканирование сайта...</div>
            {scanPhase && <div className="text-xs text-blue-600">{scanPhase}</div>}
          </div>
        </div>
      )}

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
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-white bg-blue-600 rounded-lg px-3 py-2 hover:bg-blue-700 ml-auto"
        >
          <Plus className="w-4 h-4" />
          Добавить вручную
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Новая запись</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Папка (например: FAQ)"
              value={newItem.folder}
              onChange={e => setNewItem(n => ({ ...n, folder: e.target.value }))}
              className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="text"
              placeholder="Заголовок"
              value={newItem.title}
              onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
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
              onClick={() => { setShowAdd(false); setNewItem({ title: '', content: '', folder: '' }); }}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Items grouped by folder */}
      {isLoading ? (
        <p className="text-gray-400 text-sm py-4">Загрузка...</p>
      ) : !items || items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">База знаний пуста — запустите сканирование сайта</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFolders.map(folder => {
            const folderItems = grouped[folder];
            const isOpen = openFolders.has(folder);
            const isMicrodata = folder.includes('Микроразметка');
            return (
              <div key={folder} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Folder header */}
                <button
                  onClick={() => toggleFolder(folder)}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {isOpen
                    ? <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    : <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  }
                  <span className="font-medium text-sm text-gray-800 flex-1">{folder}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {folderItems.length} {folderItems.length === 1 ? 'чанк' : 'чанков'}
                  </span>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </button>

                {/* Folder items */}
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {folderItems.map(item => (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {item.title && (
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 truncate">
                                {item.title}
                              </div>
                            )}
                            {item.source_url && !isMicrodata && (
                              <div className="text-xs text-blue-400 mb-1 truncate">{item.source_url}</div>
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
                                    <Check className="w-3 h-3" /> Сохранить
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50"
                                  >
                                    <X className="w-3 h-3" /> Отмена
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                {item.content_edited || item.content}
                              </p>
                            )}

                            <div className="text-xs text-gray-400 mt-1">
                              {item.token_count} токенов
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
          })}
        </div>
      )}
    </div>
  );
}
