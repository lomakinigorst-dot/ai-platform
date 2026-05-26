'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare, UserCheck, TrendingUp, Globe, Brain,
  Phone, Mail, CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, Lightbulb, Users, User, Search,
  LayoutGrid, Bot,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8000';

interface PortalData {
  client: {
    id: string;
    name: string;
    domain: string;
    assistant_name: string;
    assistant_mode: string;
    assistant_avatar_url: string | null;
    status: string;
    marketing_status: string;
  };
  stats: {
    conversations_today: number;
    conversations_week: number;
    conversations_total: number;
    leads_total: number;
    leads_new: number;
  };
  leads: Array<{
    id: string;
    created_at: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    request_text: string | null;
    status: string;
  }>;
  conversations: Array<{
    id: string;
    created_at: string;
    visitor_id: string;
    is_lead: boolean;
    message_count: number;
  }>;
  dna: Record<string, unknown> | null;
}

const DNA_LABELS: Record<string, string> = {
  niche_analysis:   'Анализ ниши',
  target_audience:  'Целевая аудитория',
  avatars:          'Аватары клиентов',
  search_scenarios: 'Сценарии поиска',
  segments:         'Сегментация',
  utps_headlines:   'Заголовки и УТП',
  agent_settings:   'Настройки AI-агента',
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: PortalData['leads'][0] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              lead.status === 'new' ? 'bg-green-100 text-green-700' :
              lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {lead.status === 'new' ? 'Новый' : lead.status === 'contacted' ? 'Связались' : 'Закрыт'}
            </span>
            <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
            {lead.name && <span className="font-medium">{lead.name}</span>}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {lead.email}
              </span>
            )}
          </div>
          {lead.request_text && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{lead.request_text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DNASection({ dna }: { dna: Record<string, unknown> }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {Object.entries(DNA_LABELS).map(([key, label]) => {
        const content = dna[key];
        if (!content) return null;
        const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        return (
          <div key={key} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpen(o => o === key ? null : key)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
              {open === key ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {open === key && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ClientPortalPage({ token }: { token: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'leads' | 'dna'>('overview');

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/portal/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Портал не найден');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f3f8' }}>
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Портал не найден</h1>
          <p className="text-sm text-gray-500">Ссылка недействительна или устарела</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f3f8' }}>
        <div className="w-6 h-6 rounded-full border-2 border-[#6b5fd4] border-t-transparent animate-spin" />
      </div>
    );
  }

  const { client, stats, leads, conversations, dna } = data;

  return (
    <div className="min-h-screen" style={{ background: '#f4f3f8' }}>
      {/* Header */}
      <div className="bg-[#1a1535] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
              {client.assistant_name[0]}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{client.name}</p>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <Globe className="w-3 h-3" />
                {client.domain}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.15)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
            <span className="text-xs text-[#34d399] font-medium">Активен</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 border border-gray-100 shadow-sm w-fit">
          {([['overview', 'Обзор'], ['leads', `Лиды (${stats.leads_total})`], ['dna', 'ДНК-анализ']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id ? 'bg-[#6b5fd4] text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={MessageSquare} label="Диалогов сегодня"  value={stats.conversations_today}  color="#6b5fd4" />
              <StatCard icon={TrendingUp}    label="За неделю"         value={stats.conversations_week}   color="#60a5fa" />
              <StatCard icon={UserCheck}     label="Всего лидов"       value={stats.leads_total}          color="#34d399" />
            </div>

            {/* Ассистент */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Ваш AI-ассистент</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: '#ede9ff', color: '#6b5fd4' }}>
                  {client.assistant_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{client.assistant_name}</p>
                  <p className="text-xs text-gray-500">{client.assistant_mode === 'sales' ? 'Менеджер по продажам' : 'Консультант поддержки'}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {client.status === 'active' ? 'Работает' : client.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Последние диалоги */}
            {conversations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Последние диалоги</h3>
                <div className="space-y-2">
                  {conversations.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-xs text-gray-600 font-mono">{c.visitor_id.slice(0, 10)}…</span>
                        {c.is_lead && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">Лид</span>}
                      </div>
                      <span className="text-[11px] text-gray-400">{c.message_count} сообщ. · {new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads */}
        {tab === 'leads' && (
          <div className="space-y-3">
            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <UserCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Лидов пока нет</p>
              </div>
            ) : (
              leads.map(l => <LeadCard key={l.id} lead={l} />)
            )}
          </div>
        )}

        {/* DNA */}
        {tab === 'dna' && (
          <div>
            {!dna || Object.keys(dna).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Brain className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium mb-1">ДНК-анализ ещё не готов</p>
                <p className="text-xs text-gray-400">Анализ запускается автоматически после сканирования сайта</p>
              </div>
            ) : (
              <DNASection dna={dna as Record<string, unknown>} />
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-gray-300 mt-8">
          Портал предоставлен AI-платформой · Данные обновляются в реальном времени
        </p>
      </div>
    </div>
  );
}
