'use client';

import { useState } from 'react';
import {
  Plus, Mail, Shield, Edit2, Trash2, Send, ChevronDown, Check, X,
} from 'lucide-react';
import { DEMO_TEAM } from '@/lib/demo-data';
import { timeAgo } from '@/lib/utils';

type Role = 'owner' | 'manager' | 'integrator' | 'sales_manager' | 'readonly';
type Status = 'active' | 'pending';

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  owner:        { label: 'Владелец',        color: '#6b5fd4', bg: '#ede9ff' },
  manager:      { label: 'Manager',         color: '#3b82f6', bg: '#dbeafe' },
  integrator:   { label: 'Integrator',      color: '#8b5cf6', bg: '#ede9fe' },
  sales_manager:{ label: 'Sales Manager',   color: '#10b981', bg: '#d1fae5' },
  readonly:     { label: 'Только чтение',   color: '#9ca3af', bg: '#f3f4f6' },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  active:  { label: 'Активный',    color: '#10b981' },
  pending: { label: 'В ожидании',  color: '#f97316' },
};

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.readonly;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function TeamPage() {
  const [members] = useState(DEMO_TEAM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('manager');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    alert(`Приглашение отправлено на ${inviteEmail}`);
    setInviteEmail('');
    setInviteOpen(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Команда</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>
            {members.length} участников · управление доступом
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: '#6b5fd4' }}
        >
          <Plus className="w-4 h-4" />
          Пригласить сотрудника
        </button>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Пригласить сотрудника</h2>
              <button onClick={() => setInviteOpen(false)}>
                <X style={{ width: 16, height: 16, color: '#9ca3af' }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>Email</label>
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e5e7eb' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6b5fd4')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: '#374151' }}>Роль</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <option value="manager">Manager — полный доступ к данным</option>
                  <option value="integrator">Integrator — настройка виджетов</option>
                  <option value="sales_manager">Sales Manager — только лиды и диалоги</option>
                  <option value="readonly">Только чтение</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleInvite}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: '#6b5fd4' }}
              >
                <Send style={{ width: 14, height: 14 }} />
                Отправить приглашение
              </button>
              <button
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2 rounded-xl text-sm border"
                style={{ borderColor: '#e5e7eb', color: '#374151' }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #f0f0f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafaf9' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Имя</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Электронная почта</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Роли</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Статус</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: '#9ca3af' }}>Последний вход</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr
                key={m.id}
                className="transition-colors hover:bg-[#fafaf9]"
                style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: '#ede9ff', color: '#6b5fd4' }}
                    >
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#111827' }}>{m.name}</div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>{m.job_title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm" style={{ color: '#374151' }}>{m.email}</td>
                <td className="px-4 py-3.5">
                  <RoleBadge role={m.role} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-medium" style={{ color: STATUS_CONFIG[m.status].color }}>
                    {STATUS_CONFIG[m.status].label}
                  </span>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell text-xs" style={{ color: '#9ca3af' }}>
                  {m.last_login ? timeAgo(m.last_login) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    {/* Повторно отправить приглашение */}
                    <button
                      title={m.status === 'pending' ? 'Повторно отправить' : 'Войти как'}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#ede9ff]"
                      onClick={() => alert(`${m.status === 'pending' ? 'Приглашение отправлено повторно' : 'Войти как'}: ${m.email}`)}
                    >
                      {m.status === 'pending'
                        ? <Send style={{ width: 13, height: 13, color: '#6b5fd4' }} />
                        : <Check style={{ width: 13, height: 13, color: '#6b5fd4' }} />
                      }
                    </button>
                    {/* Права доступа */}
                    <button
                      title="Права доступа"
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#d1fae5]"
                      onClick={() => alert(`Настройка прав: ${m.name}`)}
                    >
                      <Shield style={{ width: 13, height: 13, color: '#10b981' }} />
                    </button>
                    {/* Редактировать */}
                    <button
                      title="Редактировать"
                      disabled={m.role === 'owner'}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#dbeafe] disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => alert(`Редактировать: ${m.name}`)}
                    >
                      <Edit2 style={{ width: 13, height: 13, color: '#3b82f6' }} />
                    </button>
                    {/* Удалить */}
                    <button
                      title="Удалить"
                      disabled={m.role === 'owner'}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#fee2e2] disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => confirm(`Удалить ${m.name}?`) && alert('Удалено')}
                    >
                      <Trash2 style={{ width: 13, height: 13, color: '#ef4444' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roles legend */}
      <div
        className="mt-5 rounded-xl p-4"
        style={{ background: '#fafaf9', border: '1px solid #f0f0f5' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: '#9ca3af' }}>ОПИСАНИЕ РОЛЕЙ</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(ROLE_CONFIG).filter(([k]) => k !== 'owner').map(([key, cfg]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              <span style={{ color: '#6b7280' }}>
                {key === 'manager' && '— полный доступ к клиентам и отчётам'}
                {key === 'integrator' && '— настройка виджетов и базы знаний'}
                {key === 'sales_manager' && '— только лиды, диалоги, клиенты'}
                {key === 'readonly' && '— только просмотр, без изменений'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
