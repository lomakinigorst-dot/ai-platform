'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { formatDate, statusColor, statusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Phone, Mail, UserCheck } from 'lucide-react';

export default function LeadsTab({ clientId }: { clientId: string }) {
  const [filter, setFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: leads } = useQuery({
    queryKey: ['leads', clientId, filter],
    queryFn: () => dashboardApi.leads(clientId, { status: filter || undefined }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
      dashboardApi.updateLeadStatus(clientId, leadId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads', clientId] }),
  });

  return (
    <div className="max-w-5xl">
      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'new', 'contacted', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {s === '' ? 'Все' : statusLabel(s)}
          </button>
        ))}
      </div>

      {/* Leads */}
      {!leads || leads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Лидов пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(lead.status))}>
                      {statusLabel(lead.status)}
                    </span>
                    {lead.priority === 'urgent' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Срочно</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(lead.created_at)}</span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {lead.phone}
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {lead.email}
                      </div>
                    )}
                    {lead.name && <span className="text-sm text-gray-700">{lead.name}</span>}
                  </div>

                  {lead.request_text && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{lead.request_text}</p>
                  )}

                  {(lead.utm_source || lead.utm_campaign) && (
                    <div className="flex gap-2 mt-2">
                      {lead.utm_source && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{lead.utm_source}</span>}
                      {lead.utm_campaign && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{lead.utm_campaign}</span>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {lead.status === 'new' && (
                    <button
                      onClick={() => updateStatus.mutate({ leadId: lead.id, status: 'contacted' })}
                      className="text-xs text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50"
                    >
                      Связались
                    </button>
                  )}
                  {lead.status === 'contacted' && (
                    <button
                      onClick={() => updateStatus.mutate({ leadId: lead.id, status: 'closed' })}
                      className="text-xs text-green-600 border border-green-200 rounded-lg px-2.5 py-1.5 hover:bg-green-50"
                    >
                      Закрыть
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
