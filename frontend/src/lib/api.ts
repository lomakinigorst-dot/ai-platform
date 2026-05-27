import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Автоматически добавляем JWT из localStorage
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ── Types ──────────────────────────────────────────────────────────

export type ClientStatus = 'pending' | 'indexing' | 'active' | 'error';
export type AssistantMode = 'sales' | 'support';

export interface Client {
  id: string;
  name: string;
  domain: string;
  website_url: string;
  status: ClientStatus;
  index_progress: number;
  pages_indexed: number;
  pages_total: number;
  scan_phase: string | null;
  scan_quality: number;
  needs_deep_scan: boolean;
  niche: string | null;
  assistant_name: string;
  assistant_mode: AssistantMode;
  assistant_avatar_url: string | null;
  leads_used: number;
  leads_limit: number;
  dialogs_used: number;
  dialogs_limit: number;
  created_at: string;
  updated_at: string | null;
}

export interface DashboardStats {
  total_clients: number;
  active_clients: number;
  total_conversations_today: number;
  total_conversations_week: number;
  total_leads_today: number;
  total_leads_week: number;
  total_messages_today: number;
}

export interface ClientStats {
  client_id: string;
  conversations_today: number;
  conversations_week: number;
  conversations_total: number;
  leads_total: number;
  leads_new: number;
  messages_total: number;
  knowledge_chunks: number;
  avg_messages_per_dialog: number;
}

export interface Lead {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  request_text: string | null;
  status: 'new' | 'contacted' | 'closed';
  priority: 'urgent' | 'normal';
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  visitor_id: string;
  is_lead: boolean;
  utm_source: string | null;
  message_count: number;
}

export interface AggregatedLead extends Lead {
  client_id: string;
  client_name: string;
  client_domain: string;
}

export interface AggregatedConversation extends Conversation {
  client_id: string;
  client_name: string;
  client_domain: string;
}

export interface AnalyticsData {
  totals: { leads: number; conversations: number; clients: number; active_clients: number };
  top_by_leads: { id: string; name: string; domain: string; count: number }[];
  top_by_conversations: { id: string; name: string; domain: string; count: number }[];
  daily_leads: Record<string, number>;
  daily_conversations: Record<string, number>;
}

export interface KnowledgeItem {
  id: string;
  source_url: string | null;
  source_type: string;
  folder: string | null;
  title: string | null;
  content: string;
  content_edited: string | null;
  chunk_index: number;
  token_count: number;
}

// ── API functions ──────────────────────────────────────────────────

export const clientsApi = {
  list: (params?: { search?: string; status?: string }) =>
    api.get<{ items: Client[]; total: number }>('/clients', { params }).then(r => r.data.items),

  get: (id: string) =>
    api.get<Client>(`/clients/${id}`).then(r => r.data),

  create: (data: { name: string; domain: string; website_url: string; assistant_mode: string }) =>
    api.post<Client>('/clients', data).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/clients/${id}`).then(r => r.data),

  reindex: (id: string) =>
    api.post(`/clients/${id}/reindex`).then(r => r.data),

  deepScan: (id: string) =>
    api.post(`/clients/${id}/deep-scan`).then(r => r.data),
};

export const dashboardApi = {
  stats: () =>
    api.get<DashboardStats>('/dashboard/stats').then(r => r.data),

  clientStats: (clientId: string) =>
    api.get<ClientStats>(`/dashboard/clients/${clientId}/stats`).then(r => r.data),

  leads: (clientId: string, params?: { status?: string; limit?: number }) =>
    api.get<Lead[]>(`/dashboard/clients/${clientId}/leads`, { params }).then(r => r.data),

  updateLeadStatus: (clientId: string, leadId: string, status: string) =>
    api.patch(`/dashboard/clients/${clientId}/leads/${leadId}/status`, { status }).then(r => r.data),

  conversations: (clientId: string, params?: { limit?: number }) =>
    api.get<Conversation[]>(`/dashboard/clients/${clientId}/conversations`, { params }).then(r => r.data),

  messages: (clientId: string, convId: string) =>
    api.get(`/dashboard/clients/${clientId}/conversations/${convId}/messages`).then(r => r.data),

  allLeads: (params?: { status?: string; client_id?: string; limit?: number }) =>
    api.get<AggregatedLead[]>('/dashboard/leads', { params }).then(r => r.data),

  allConversations: (params?: { client_id?: string; limit?: number }) =>
    api.get<AggregatedConversation[]>('/dashboard/conversations', { params }).then(r => r.data),

  analytics: () =>
    api.get<AnalyticsData>('/dashboard/analytics').then(r => r.data),
};

export const knowledgeApi = {
  list: (clientId: string, params?: { search?: string; source_url?: string }) =>
    api.get<KnowledgeItem[]>(`/knowledge/clients/${clientId}/items`, { params }).then(r => r.data),

  sources: (clientId: string) =>
    api.get<{ source_url: string; chunks: number }[]>(`/knowledge/clients/${clientId}/sources`).then(r => r.data),

  update: (clientId: string, itemId: string, content_edited: string) =>
    api.patch(`/knowledge/clients/${clientId}/items/${itemId}`, { content_edited }).then(r => r.data),

  delete: (clientId: string, itemId: string) =>
    api.delete(`/knowledge/clients/${clientId}/items/${itemId}`).then(r => r.data),

  create: (clientId: string, data: { title: string; content: string }) =>
    api.post(`/knowledge/clients/${clientId}/items`, data).then(r => r.data),
};

export const portalApi = {
  generateToken: (clientId: string) =>
    api.post<{ portal_token: string }>(`/portal/generate/${clientId}`).then(r => r.data),
};

export const settingsApi = {
  getAssistant: (clientId: string) =>
    api.get(`/settings/clients/${clientId}/assistant`).then(r => r.data),

  updateAssistant: (clientId: string, data: Record<string, unknown>) =>
    api.patch(`/settings/clients/${clientId}/assistant`, data).then(r => r.data),

  getWidget: (clientId: string) =>
    api.get(`/settings/clients/${clientId}/widget`).then(r => r.data),

  getIntegrations: (clientId: string) =>
    api.get(`/settings/clients/${clientId}/integrations`).then(r => r.data),

  updateIntegrations: (clientId: string, data: Record<string, unknown>) =>
    api.patch(`/settings/clients/${clientId}/integrations`, data).then(r => r.data),
};
