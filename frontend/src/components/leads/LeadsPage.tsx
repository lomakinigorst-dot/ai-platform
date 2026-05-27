'use client';

import { useState } from 'react';
import {
  UserCheck, Phone, Mail, MessageSquare, ExternalLink,
  Clock, LayoutGrid, List, X,
} from 'lucide-react';
import { PARTNER_WIDGET } from '@/lib/demo-data';

const PARTNER_HAS_WIDGET = true;

type LeadStatus = 'new' | 'contacted' | 'closed';

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new:       { label: 'Новый',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  contacted: { label: 'В работе', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  closed:    { label: 'Закрыт',   color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0' },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#ede9ff' }}>
        <UserCheck className="w-8 h-8" style={{ color: '#6b5fd4' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#111827' }}>Виджет не подключён</h3>
      <p className="text-sm max-w-sm mb-5" style={{ color: '#9ca3af' }}>
        Установите виджет Atlas на свой сайт, чтобы начать получать лиды.
      </p>
      <a href="/settings"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#6b5fd4' }}>
        <ExternalLink className="w-4 h-4" />
        Установить виджет
      </a>
    </div>
  );
}

export default function LeadsPage() {
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [selectedLead, setSelectedLead] = useState<typeof PARTNER_WIDGET.leads[0] | null>(null);

  if (!PARTNER_HAS_WIDGET) return <div className="p-6"><EmptyState /></div>;

  const leads = PARTNER_WIDGET.leads;
  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  const counts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    closed: leads.filter(l => l.status === 'closed').length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Мои лиды</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            Заявки с вашего виджета на{' '}
            <span className="font-medium" style={{ color: '#6b5fd4' }}>atlasai.ru</span>
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#f3f4f6' }}>
          {[['list', List], ['kanban', LayoutGrid]] .map(([v, Icon]: any) => (
            <button key={v} onClick={() => setView(v)} className="p-1.5 rounded-md transition-colors"
              style={{ background: view === v ? '#fff' : 'transparent' }}>
              <Icon className="w-4 h-4" style={{ color: view === v ? '#6b5fd4' : '#9ca3af' }} />
            </button>
          ))}
        </div>
      </div>

      {/* KPI filters */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {([
          ['all', 'Все', '#6b5fd4', '#ede9ff'],
          ['new', 'Новые', '#3b82f6', '#dbeafe'],
          ['contacted', 'В работе', '#f97316', '#ffedd5'],
          ['closed', 'Закрыты', '#10b981', '#d1fae5'],
        ] as const).map(([s, label, color, bg]) => (
          <button key={s} onClick={() => setFilter(s as any)}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: filter === s ? bg : '#fff',
              border: `1px solid ${filter === s ? color + '44' : '#f0f0f5'}`,
              boxShadow: filter === s ? `0 0 0 2px ${color}22` : '0 1px 3px rgba(0,0,0,0.04)',
            }}>
            <div className="text-xl font-bold" style={{ color }}>{counts[s]}</div>
            <div className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: '#9ca3af' }}>Лидов нет</div>
          ) : filtered.map((lead, i) => (
            <div key={lead.id}
              className="px-5 py-4 cursor-pointer hover:bg-[#fafaf9] transition-colors"
              style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}
              onClick={() => setSelectedLead(lead)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge status={lead.status} />
                    {lead.priority === 'urgent' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Срочно</span>
                    )}
                    <span className="text-xs flex items-center gap-1" style={{ color: '#9ca3af' }}>
                      <Clock style={{ width: 10, height: 10 }} />
                      {new Date(lead.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-1">
                    {lead.name && <span className="text-sm font-medium" style={{ color: '#111827' }}>{lead.name}</span>}
                    {lead.phone && (
                      <span className="flex items-center gap-1 text-sm" style={{ color: '#374151' }}>
                        <Phone className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />{lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1 text-sm" style={{ color: '#374151' }}>
                        <Mail className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />{lead.email}
                      </span>
                    )}
                  </div>
                  {lead.request_text && (
                    <p className="text-sm line-clamp-2" style={{ color: '#6b7280' }}>{lead.request_text}</p>
                  )}
                  {lead.utm_source && (
                    <span className="inline-flex mt-1.5 text-xs px-2 py-0.5 rounded"
                      style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                      {lead.utm_source}{lead.utm_medium ? ` / ${lead.utm_medium}` : ''}
                    </span>
                  )}
                </div>
                <button className="p-1.5 rounded-lg hover:bg-[#ede9ff] transition-colors flex-shrink-0"
                  onClick={e => { e.stopPropagation(); alert('Открыть диалог'); }}>
                  <MessageSquare style={{ width: 14, height: 14, color: '#6b5fd4' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex gap-4">
          {(['new', 'contacted', 'closed'] as LeadStatus[]).map(col => {
            const cfg = STATUS_CONFIG[col];
            const colLeads = leads.filter(l => l.status === col);
            return (
              <div key={col} className="flex-1 min-w-0">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: cfg.color + '22', color: cfg.color }}>{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map(lead => (
                    <div key={lead.id}
                      className="rounded-xl p-3.5 cursor-pointer hover:shadow-md transition-shadow"
                      style={{ background: '#fff', border: '1px solid #f0f0f5' }}
                      onClick={() => setSelectedLead(lead)}>
                      {lead.priority === 'urgent' && (
                        <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 mb-2">Срочно</span>
                      )}
                      {lead.name && <p className="text-sm font-medium mb-1" style={{ color: '#111827' }}>{lead.name}</p>}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: '#9ca3af' }}>
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </div>
                      )}
                      {lead.request_text && (
                        <p className="text-xs mt-2 line-clamp-2" style={{ color: '#6b7280' }}>{lead.request_text}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs" style={{ color: '#9ca3af' }}>
                          {new Date(lead.created_at).toLocaleDateString('ru-RU')}
                        </span>
                        <button className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: '#ede9ff', color: '#6b5fd4' }}>
                          Открыть →
                        </button>
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="rounded-xl p-5 text-center border-2 border-dashed" style={{ borderColor: '#e5e7eb' }}>
                      <p className="text-xs" style={{ color: '#d1d5db' }}>Нет лидов</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-md h-full overflow-y-auto"
            style={{ background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f3f4f6' }}>
              <div>
                <h3 className="text-base font-semibold mb-1" style={{ color: '#111827' }}>
                  {selectedLead.name ?? 'Лид'}
                </h3>
                <StatusBadge status={selectedLead.status} />
              </div>
              <button onClick={() => setSelectedLead(null)}>
                <X style={{ width: 18, height: 18, color: '#9ca3af' }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl p-4 space-y-2" style={{ background: '#fafaf9', border: '1px solid #f0f0f5' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9ca3af' }}>Контакты</p>
                {selectedLead.name && (
                  <div className="flex gap-2 text-sm">
                    <span style={{ color: '#9ca3af' }}>Имя:</span>
                    <span style={{ color: '#111827' }}>{selectedLead.name}</span>
                  </div>
                )}
                {selectedLead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    <span style={{ color: '#111827' }}>{selectedLead.phone}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', color: '#92400e' }}>
                      Только для вас
                    </span>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail style={{ width: 14, height: 14, color: '#9ca3af' }} />
                    <span style={{ color: '#111827' }}>{selectedLead.email}</span>
                  </div>
                )}
              </div>
              {selectedLead.request_text && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9ca3af' }}>Запрос</p>
                  <p className="text-sm" style={{ color: '#374151' }}>{selectedLead.request_text}</p>
                </div>
              )}
              {selectedLead.utm_source && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9ca3af' }}>UTM-метки</p>
                  <div className="flex flex-wrap gap-2">
                    {[['utm_source', selectedLead.utm_source], ['utm_medium', selectedLead.utm_medium], ['utm_campaign', selectedLead.utm_campaign]]
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <span key={k as string} className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: '#f3f4f6', color: '#374151' }}>
                          {k}: {v}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: '#6b5fd4' }}
                  onClick={() => alert('Диалог')}>
                  <MessageSquare style={{ width: 14, height: 14 }} />
                  Открыть диалог
                </button>
                {selectedLead.status === 'new' && (
                  <button className="w-full py-2.5 rounded-xl text-sm font-medium border"
                    style={{ borderColor: '#fed7aa', color: '#f97316', background: '#fff7ed' }}>
                    В работу →
                  </button>
                )}
                {selectedLead.status === 'contacted' && (
                  <button className="w-full py-2.5 rounded-xl text-sm font-medium border"
                    style={{ borderColor: '#a7f3d0', color: '#10b981', background: '#f0fdf4' }}>
                    Закрыть ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
