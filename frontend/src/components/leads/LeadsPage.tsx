'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, clientsApi, AggregatedLead } from '@/lib/api';
import { formatDate, statusColor, statusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  UserCheck, Phone, Mail, Search, Filter,
  LayoutGrid, List, ChevronRight,
} from 'lucide-react';

const STATUSES = ['', 'new', 'contacted', 'closed'] as const;

const COLUMNS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'new',       label: 'Новые',      color: '#3b82f6', bg: '#eff6ff' },
  { id: 'contacted', label: 'В работе',   color: '#f97316', bg: '#fff7ed' },
  { id: 'closed',    label: 'Закрыты',    color: '#10b981', bg: '#f0fdf4' },
];

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ['all-leads', statusFilter, clientFilter],
    queryFn: () => dashboardApi.allLeads({
      status: statusFilter || undefined,
      client_id: clientFilter || undefined,
      limit: 200,
    }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ leadId, clientId, status }: { leadId: string; clientId: string; status: string }) =>
      dashboardApi.updateLeadStatus(clientId, leadId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-leads'] }),
  });

  const filtered = (leads ?? []).filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.client_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Лиды</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} лид{filtered.length === 1 ? '' : filtered.length < 5 ? 'а' : 'ов'} по всем клиентам
            </p>
          </div>
          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--border-light)' }}>
            <button
              onClick={() => setView('list')}
              className="p-1.5 rounded-md transition-colors"
              style={{ background: view === 'list' ? 'var(--surface)' : 'transparent' }}
              title="Список"
            >
              <List className="w-4 h-4" style={{ color: view === 'list' ? 'var(--primary)' : 'var(--text-muted)' }} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className="p-1.5 rounded-md transition-colors"
              style={{ background: view === 'kanban' ? 'var(--surface)' : 'transparent' }}
              title="Канбан"
            >
              <LayoutGrid className="w-4 h-4" style={{ color: view === 'kanban' ? 'var(--primary)' : 'var(--text-muted)' }} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Поиск по имени, телефону..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)', width: 220 }}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: statusFilter === s ? 'var(--primary)' : 'var(--surface)',
                  color: statusFilter === s ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${statusFilter === s ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {s === '' ? 'Все' : statusLabel(s)}
              </button>
            ))}
          </div>

          {/* Client filter */}
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
            className="rounded-xl p-16 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <UserCheck className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Лидов не найдено</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
              Лиды появятся после первых диалогов в виджете
            </p>
          </div>
        ) : view === 'list' ? (
          <ListView leads={filtered} onStatusChange={(leadId, clientId, status) =>
            updateStatus.mutate({ leadId, clientId, status })
          } />
        ) : (
          <KanbanView leads={filtered} onStatusChange={(leadId, clientId, status) =>
            updateStatus.mutate({ leadId, clientId, status })
          } />
        )}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────
function ListView({
  leads,
  onStatusChange,
}: {
  leads: AggregatedLead[];
  onStatusChange: (leadId: string, clientId: string, status: string) => void;
}) {
  return (
    <div className="space-y-2 max-w-5xl">
      {leads.map(lead => (
        <div
          key={lead.id}
          className="rounded-xl p-5 transition-shadow hover:shadow-md"
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
                {/* Client badge */}
                <Link
                  href={`/clients/${lead.client_id}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{ background: '#ede9ff', color: '#6b5fd4' }}
                >
                  {lead.client_name || lead.client_domain}
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                  {formatDate(lead.created_at)}
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                {lead.name && <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lead.name}</span>}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text)' }}>
                    <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text)' }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    {lead.email}
                  </a>
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
                  {lead.utm_campaign && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}>
                      {lead.utm_campaign}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              {lead.status === 'new' && (
                <button
                  onClick={() => onStatusChange(lead.id, lead.client_id, 'contacted')}
                  className="text-xs rounded-lg px-3 py-1.5 border transition-colors hover:opacity-90"
                  style={{ color: '#3b82f6', borderColor: '#bfdbfe', background: '#eff6ff' }}
                >
                  В работу
                </button>
              )}
              {lead.status === 'contacted' && (
                <button
                  onClick={() => onStatusChange(lead.id, lead.client_id, 'closed')}
                  className="text-xs rounded-lg px-3 py-1.5 border transition-colors hover:opacity-90"
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

// ─── Kanban view ──────────────────────────────────────────────────────────────
function KanbanView({
  leads,
  onStatusChange,
}: {
  leads: AggregatedLead[];
  onStatusChange: (leadId: string, clientId: string, status: string) => void;
}) {
  return (
    <div className="flex gap-4 h-full min-h-96">
      {COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.status === col.id);
        return (
          <div key={col.id} className="flex-1 min-w-64 flex flex-col">
            {/* Column header */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-3"
              style={{ background: col.bg, border: `1px solid ${col.color}22` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-sm font-semibold" style={{ color: col.color }}>{col.label}</span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: col.color + '22', color: col.color }}
              >
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {colLeads.map(lead => (
                <div
                  key={lead.id}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/clients/${lead.client_id}`}
                      className="text-xs font-medium"
                      style={{ color: 'var(--primary)' }}
                    >
                      {lead.client_name || lead.client_domain}
                    </Link>
                    {lead.priority === 'urgent' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">!</span>
                    )}
                  </div>

                  {lead.name && (
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{lead.name}</p>
                  )}
                  {lead.phone && (
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{lead.phone}</p>
                  )}
                  {lead.email && (
                    <p className="text-xs mb-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{lead.email}</p>
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
                    <div className="flex gap-1">
                      {lead.status === 'new' && (
                        <button
                          onClick={() => onStatusChange(lead.id, lead.client_id, 'contacted')}
                          className="text-xs px-2 py-1 rounded-lg border transition-colors"
                          style={{ color: '#f97316', borderColor: '#fed7aa', background: '#fff7ed' }}
                        >
                          В работу →
                        </button>
                      )}
                      {lead.status === 'contacted' && (
                        <button
                          onClick={() => onStatusChange(lead.id, lead.client_id, 'closed')}
                          className="text-xs px-2 py-1 rounded-lg border transition-colors"
                          style={{ color: '#10b981', borderColor: '#a7f3d0', background: '#f0fdf4' }}
                        >
                          Закрыть ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {colLeads.length === 0 && (
                <div
                  className="rounded-xl p-6 text-center border-2 border-dashed"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-subtle)' }}
                >
                  <p className="text-xs">Нет лидов</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
