'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, Lead } from '@/lib/api';
import { formatDate, statusColor, statusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Phone, Mail, UserCheck, LayoutGrid, List, Check } from 'lucide-react';

const KANBAN_COLS = [
  { id: 'new',       label: 'Новые',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'contacted', label: 'В работе', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'closed',    label: 'Закрыты',  color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0' },
];

export default function LeadsTab({ clientId }: { clientId: string }) {
  const [filter, setFilter] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
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
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        {view === 'list' && (
          <div className="flex gap-1.5">
            {['', 'new', 'contacted', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  filter === s ? 'text-white' : 'border text-gray-600 hover:bg-gray-50'
                )}
                style={filter === s ? { background: 'var(--primary)', border: 'none' } : { borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                {s === '' ? 'Все' : statusLabel(s)}
              </button>
            ))}
          </div>
        )}
        {view === 'kanban' && <div />}

        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-lg ml-auto" style={{ background: 'var(--border-light)' }}>
          <button
            onClick={() => setView('kanban')}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: view === 'kanban' ? 'var(--surface)' : 'transparent' }}
            title="Канбан"
          >
            <LayoutGrid className="w-4 h-4" style={{ color: view === 'kanban' ? 'var(--primary)' : 'var(--text-muted)' }} />
          </button>
          <button
            onClick={() => setView('list')}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: view === 'list' ? 'var(--surface)' : 'transparent' }}
            title="Список"
          >
            <List className="w-4 h-4" style={{ color: view === 'list' ? 'var(--primary)' : 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {!leads || leads.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <UserCheck className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Лидов пока нет</p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          leads={leads}
          onMove={(leadId, status) => updateStatus.mutate({ leadId, status })}
        />
      ) : (
        <ListView
          leads={leads}
          onMove={(leadId, status) => updateStatus.mutate({ leadId, status })}
        />
      )}
    </div>
  );
}

// ─── Kanban board ────────────────────────────────────────────────────────────
function KanbanBoard({
  leads,
  onMove,
}: {
  leads: Lead[];
  onMove: (leadId: string, status: string) => void;
}) {
  return (
    <div className="flex gap-4 min-h-64">
      {KANBAN_COLS.map(col => {
        const colLeads = leads.filter(l => l.status === col.id);
        const nextStatus = col.id === 'new' ? 'contacted' : col.id === 'contacted' ? 'closed' : null;
        const nextLabel  = col.id === 'new' ? 'В работу →' : 'Закрыть ✓';

        return (
          <div key={col.id} className="flex-1 flex flex-col min-w-48">
            {/* Column header */}
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2"
              style={{ background: col.bg, border: `1px solid ${col.border}` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
              </div>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: col.color + '22', color: col.color }}
              >
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2">
              {colLeads.map(lead => (
                <div
                  key={lead.id}
                  className="rounded-xl p-3.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
                >
                  {lead.priority === 'urgent' && (
                    <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 mb-2">Срочно</span>
                  )}
                  {lead.name && (
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{lead.name}</p>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-1.5 text-xs mb-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      <Mail className="w-3 h-3" /> {lead.email}
                    </div>
                  )}
                  {lead.request_text && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-subtle)' }}>
                      {lead.request_text}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                      {formatDate(lead.created_at)}
                    </span>
                    {nextStatus && (
                      <button
                        onClick={() => onMove(lead.id, nextStatus)}
                        className="text-xs px-2 py-1 rounded-lg border font-medium transition-opacity hover:opacity-80"
                        style={{
                          color: nextStatus === 'contacted' ? '#f97316' : '#10b981',
                          borderColor: nextStatus === 'contacted' ? '#fed7aa' : '#a7f3d0',
                          background: nextStatus === 'contacted' ? '#fff7ed' : '#f0fdf4',
                        }}
                      >
                        {nextLabel}
                      </button>
                    )}
                    {col.id === 'closed' && (
                      <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                    )}
                  </div>
                </div>
              ))}
              {colLeads.length === 0 && (
                <div
                  className="rounded-xl p-5 text-center border-2 border-dashed"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Нет лидов</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
function ListView({
  leads,
  onMove,
}: {
  leads: Lead[];
  onMove: (leadId: string, status: string) => void;
}) {
  return (
    <div className="space-y-3 max-w-4xl">
      {leads.map(lead => (
        <div
          key={lead.id}
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusColor(lead.status))}>
                  {statusLabel(lead.status)}
                </span>
                {lead.priority === 'urgent' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Срочно</span>
                )}
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{formatDate(lead.created_at)}</span>
              </div>

              <div className="flex flex-wrap gap-4">
                {lead.name && <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lead.name}</span>}
                {lead.phone && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text)' }}>
                    <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />{lead.phone}
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text)' }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />{lead.email}
                  </div>
                )}
              </div>

              {lead.request_text && (
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {lead.request_text}
                </p>
              )}
              {(lead.utm_source || lead.utm_campaign) && (
                <div className="flex gap-2 mt-2">
                  {lead.utm_source && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}>
                      {lead.utm_source}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-1 flex-shrink-0">
              {lead.status === 'new' && (
                <button
                  onClick={() => onMove(lead.id, 'contacted')}
                  className="text-xs rounded-lg px-3 py-1.5 border"
                  style={{ color: '#3b82f6', borderColor: '#bfdbfe', background: '#eff6ff' }}
                >
                  В работу
                </button>
              )}
              {lead.status === 'contacted' && (
                <button
                  onClick={() => onMove(lead.id, 'closed')}
                  className="text-xs rounded-lg px-3 py-1.5 border"
                  style={{ color: '#10b981', borderColor: '#a7f3d0', background: '#f0fdf4' }}
                >
                  Закрыть
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
