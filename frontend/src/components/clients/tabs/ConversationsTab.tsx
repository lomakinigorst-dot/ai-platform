'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function ConversationsTab({ clientId }: { clientId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: conversations } = useQuery({
    queryKey: ['conversations', clientId],
    queryFn: () => dashboardApi.conversations(clientId, { limit: 50 }),
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', clientId, expanded],
    queryFn: () => dashboardApi.messages(clientId, expanded!),
    enabled: !!expanded,
  });

  return (
    <div className="max-w-4xl space-y-2">
      {!conversations || conversations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Диалогов пока нет</p>
        </div>
      ) : (
        conversations.map(conv => (
          <div key={conv.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900 font-mono text-xs">
                    {conv.visitor_id.slice(0, 12)}...
                  </span>
                  {conv.is_lead && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Лид</span>
                  )}
                  <span className="text-xs text-gray-400">{conv.message_count} сообщ.</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(conv.created_at)}</div>
              </div>
              {expanded === conv.id ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {expanded === conv.id && (
              <div className="border-t border-gray-100 p-5 space-y-3 bg-gray-50">
                {messages?.map((msg: { id: string; role: string; content: string }) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {!messages && <p className="text-center text-gray-400 text-sm py-4">Загрузка...</p>}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
