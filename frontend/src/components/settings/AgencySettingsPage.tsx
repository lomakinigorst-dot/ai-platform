'use client';

import { useState } from 'react';
import {
  User, Mail, Building2, Bell, Shield, CreditCard,
  Check, ChevronRight, Zap,
} from 'lucide-react';

const TABS = [
  { id: 'profile',  label: 'Профиль',       icon: User },
  { id: 'plan',     label: 'Тариф',          icon: CreditCard },
  { id: 'notifs',   label: 'Уведомления',    icon: Bell },
  { id: 'security', label: 'Безопасность',   icon: Shield },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AgencySettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Настройки агентства</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Управление профилем, тарифом и уведомлениями
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div
          className="flex-shrink-0 w-48 rounded-xl p-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', alignSelf: 'start' }}
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left mb-0.5"
              style={{
                background: activeTab === id ? 'var(--primary-light)' : 'transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--text)',
                fontWeight: activeTab === id ? 600 : 400,
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <ProfileTab onSave={handleSave} saved={saved} />
          )}
          {activeTab === 'plan' && <PlanTab />}
          {activeTab === 'notifs' && <NotificationsTab onSave={handleSave} saved={saved} />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-200 transition-shadow";
const inputStyle = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' };

function ProfileTab({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Building2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Данные агентства</h3>
        </div>
        <Field label="Название агентства">
          <input type="text" defaultValue="Моё агентство" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" defaultValue="admin@localhost" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Сайт агентства">
          <input type="url" placeholder="https://agency.ru" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Телефон">
          <input type="tel" placeholder="+7 (___) ___-__-__" className={inputCls} style={inputStyle} />
        </Field>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <User className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Контактное лицо</h3>
        </div>
        <Field label="Имя">
          <input type="text" placeholder="Имя и фамилия" className={inputCls} style={inputStyle} />
        </Field>
        <Field label="Должность">
          <input type="text" placeholder="Руководитель" className={inputCls} style={inputStyle} />
        </Field>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: saved ? '#10b981' : 'var(--primary)' }}
        >
          {saved ? <><Check className="w-4 h-4" /> Сохранено</> : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: '0 ₽', period: 'бесплатно',
    features: ['1 клиент', '100 диалогов/мес', 'AI Консультант', 'База знаний'],
    active: false,
  },
  {
    id: 'pro', name: 'Pro', price: '4 990 ₽', period: '/мес',
    features: ['10 клиентов', '1 000 диалогов/мес', 'AI Консультант + Маркетолог', 'ДНК-анализ', 'Email уведомления', 'Портал клиента'],
    active: true,
  },
  {
    id: 'agency', name: 'Agency', price: '14 990 ₽', period: '/мес',
    features: ['Неограниченно клиентов', '10 000 диалогов/мес', 'Все AI-блоки', 'Telegram интеграция', 'Белая метка', 'Приоритетная поддержка'],
    active: false,
  },
];

function PlanTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className="rounded-xl p-5"
            style={{
              background: 'var(--surface)',
              border: `2px solid ${plan.active ? 'var(--primary)' : 'var(--border)'}`,
              boxShadow: plan.active ? '0 0 0 4px rgba(107,95,212,0.08)' : 'var(--shadow)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>{plan.name}</span>
                  {plan.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#ede9ff', color: '#6b5fd4' }}>
                      Текущий
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>
              </div>
              {!plan.active && (
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary)' }}
                  onClick={() => alert('Переход на тариф — скоро!')}
                >
                  Выбрать
                </button>
              )}
            </div>
            <ul className="space-y-1.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.active ? '#6b5fd4' : '#10b981' }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Billing stub */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <CreditCard className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Способ оплаты</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Привязка карты и управление оплатой — в разработке
        </p>
      </div>
    </div>
  );
}

function NotificationsTab({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  const [settings, setSettings] = useState({
    email_leads: true,
    email_digest: true,
    email_system: true,
    telegram: false,
  });

  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Mail className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Email уведомления</h3>
        </div>
        {[
          { key: 'email_leads' as const,   label: 'Новый лид',         desc: 'Сразу когда приходит новый лид' },
          { key: 'email_digest' as const,  label: 'Ежедневный дайджест', desc: 'Сводка активности за день' },
          { key: 'email_system' as const,  label: 'Системные',          desc: 'Обновления платформы, важные уведомления' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className="w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0"
              style={{
                background: settings[key] ? 'var(--primary)' : 'var(--border)',
                width: 40, height: 22,
              }}
            >
              <div
                className="absolute top-0.5 rounded-full bg-white transition-all"
                style={{
                  width: 18, height: 18,
                  left: settings[key] ? 20 : 2,
                }}
              />
            </button>
          </div>
        ))}
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5" style={{ color: '#f97316' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Telegram</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#f97316' }}>Скоро</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Уведомления о лидах прямо в Telegram — в разработке
        </p>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: saved ? '#10b981' : 'var(--primary)' }}
        >
          {saved ? <><Check className="w-4 h-4" /> Сохранено</> : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Смена пароля</h3>
        </div>
        <Field label="Текущий пароль">
          <input type="password" className={inputCls} style={inputStyle} placeholder="••••••••" />
        </Field>
        <Field label="Новый пароль">
          <input type="password" className={inputCls} style={inputStyle} placeholder="••••••••" />
        </Field>
        <Field label="Повторите пароль">
          <input type="password" className={inputCls} style={inputStyle} placeholder="••••••••" />
        </Field>
        <button
          onClick={() => alert('Смена пароля — скоро!')}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--primary)' }}
        >
          Изменить пароль
        </button>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text)' }}>
          Активные сессии
        </h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Текущая сессия</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Браузер · Сейчас</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#f0fdf4', color: '#10b981' }}>Активна</span>
        </div>
      </Card>
    </div>
  );
}
