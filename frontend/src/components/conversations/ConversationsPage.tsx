'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, clientsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  MessageSquare, ChevronDown, ChevronUp, Search, ChevronRight,
} from 'lucide-react';

export default function ConversationsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
  });

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['all-conversations', clientFilter],
    queryFn: () => dashboardApi.allConversations({
      client_id: clientFilter || undefined,
      limit: 200,
    }),
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', expandedClientId, expanded],
    queryFn: () => dashboardApi.messages(expandedClientId!, expanded!),
    enabled: !!expanded && !!expandedClientId,
  });

  const filtered = (conversations ?? []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.visitor_id.includes(q) || c.client_name?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Диалоги</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} диалог{filtered.length === 1 ? '' : filtered.length < 5 ? 'а' : 'ов'} по всем клиентам
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)', width: 200 }}
            />
          </div>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border focus:outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            <option value="">Все клиенты</option>
            {clients?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl p-16 text-center max-w-lg mx-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Диалогов нет</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              Диалоги появятся когда посетители начнут общаться с виджетом
            </p>
          </div>
        ) : (
          <div className="max-w-4xl space-y-2">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
              >
                <button
                  onClick={() => {
                    if (expanded === conv.id) {
                      setExpanded(null);
                      setExpandedClientId(null);
                    } else {
                      setExpanded(conv.id);
                      setExpandedClientId(conv.client_id);
                    }
                  }}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:opacity-90 transition-opacity"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {conv.visitor_id.slice(0, 12)}...
                      </span>
                      {conv.is_lead && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Лид
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                        {conv.message_count} сообщ.
                      </span>
                      {/* Client badge */}
                      <Link
                        href={`/clients/${conv.client_id}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#ede9ff', color: '#6b5fd4' }}
                      >
                        {conv.client_name || conv.client_domain}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                      {formatDate(conv.created_at)}
                      {conv.utm_source && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--border-light)' }}>
                          {conv.utm_source}
                        </span>
                      )}
                    </div>
                  </div>
                  {expanded === conv.id ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>

                {expanded === conv.id && (
                  <div
                    className="border-t p-5 space-y-3"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    {!messages ? (
                      <p className="text-center text-sm py-4" style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-sm py-4" style={{ color: 'var(--text-muted)' }}>Нет сообщений</p>
                    ) : (
                      messages.map((msg: { id: string; role: string; content: string }) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={msg.role === 'user' ? {
                              background: 'var(--primary)',
                              color: '#fff',
                              borderBottomRightRadius: 4,
                            } : {
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              border: '1px solid var(--border)',
                              borderBottomLeftRadius: 4,
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
