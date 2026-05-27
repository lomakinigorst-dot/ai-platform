'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Bell, LogOut, Settings, ChevronDown,
  HelpCircle, MessageCircle, BookOpen, LifeBuoy,
  Zap, Lightbulb, Bug, Gift, Newspaper, Wallet,
} from 'lucide-react';

const BALANCE   = 2_450;
const DAYS_LEFT = 32;

const BLOCK_BUDGETS = [
  { label: 'AI Консультант', color: '#60a5fa', days: 45 },
  { label: 'AI Маркетолог',  color: '#fb923c', days: 28 },
  { label: 'AI Atlas',       color: '#a78bfa', days: 60 },
];

export default function TopNav() {
  const router = useRouter();
  const [userMenuOpen,    setUserMenuOpen]    = useState(false);
  const [supportMenuOpen, setSupportMenuOpen] = useState(false);
  const [balanceOpen,     setBalanceOpen]     = useState(false);
  const [notifCount]                          = useState(3);

  const userRef    = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);

  const email    = typeof window !== 'undefined'
    ? (localStorage.getItem('agent_email') ?? 'admin@example.com')
    : 'admin@example.com';
  const initials = email.slice(0, 2).toUpperCase();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('agent_email');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current    && !userRef.current.contains(e.target as Node))    setUserMenuOpen(false);
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) setSupportMenuOpen(false);
      if (balanceRef.current && !balanceRef.current.contains(e.target as Node)) setBalanceOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dropdownStyle: React.CSSProperties = {
    background: '#ffffff',
    borderColor: '#e5e7eb',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  };

  return (
    <header
      className="flex-shrink-0 flex items-center h-12 px-4 gap-2"
      style={{ background: '#ffffff', borderBottom: '1px solid #f0f0f5', zIndex: 10 }}
    >
      <div className="flex-1" />

      {/* Баланс */}
      <div className="relative" ref={balanceRef}>
        <button
          onClick={() => { setBalanceOpen(o => !o); setUserMenuOpen(false); setSupportMenuOpen(false); }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-[8px] transition-colors"
          style={{
            background: DAYS_LEFT < 10 ? '#fef2f2' : '#f5f3ff',
            border: `1px solid ${DAYS_LEFT < 10 ? '#fecaca' : '#ddd6fe'}`,
          }}
        >
          <Wallet style={{ width: 13, height: 13, color: DAYS_LEFT < 10 ? '#ef4444' : '#7c3aed' }} />
          <span className="text-xs font-semibold" style={{ color: DAYS_LEFT < 10 ? '#ef4444' : '#6b5fd4' }}>
            ₽ {BALANCE.toLocaleString('ru-RU')}
          </span>
          <span className="text-[10px]" style={{ color: DAYS_LEFT < 10 ? '#ef4444' : '#9d8fea' }}>
            · ~{DAYS_LEFT} дн.
          </span>
        </button>

        {balanceOpen && (
          <div
            className="absolute right-0 top-full mt-1 rounded-[10px] border p-3 z-50"
            style={{ ...dropdownStyle, minWidth: 240 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: '#111827' }}>Баланс платформы</span>
              <span className="text-xs font-bold" style={{ color: '#6b5fd4' }}>₽ {BALANCE.toLocaleString('ru-RU')}</span>
            </div>
            <p className="text-[10px] mb-3" style={{ color: '#9ca3af' }}>
              Прогноз расхода — на ~{DAYS_LEFT} дней при текущей нагрузке
            </p>
            <div className="space-y-2">
              {BLOCK_BUDGETS.map(b => (
                <div key={b.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                    <span className="text-xs" style={{ color: '#374151' }}>{b.label}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#6b7280' }}>~{b.days} дн.</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: '#f3f4f6', margin: '10px 0' }} />
            <button
              className="w-full py-1.5 rounded-[7px] text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#6b5fd4' }}
              onClick={() => alert('Пополнение баланса — скоро!')}
            >
              Пополнить баланс
            </button>
          </div>
        )}
      </div>

      {/* Уведомления */}
      <button
        className="relative flex items-center justify-center w-8 h-8 rounded-[8px] transition-colors hover:bg-gray-100"
        style={{ color: '#6b7280' }}
        title="Уведомления"
      >
        <Bell style={{ width: 16, height: 16 }} />
        {notifCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center rounded-full text-white"
            style={{ width: 14, height: 14, fontSize: 8, fontWeight: 700, background: '#f97316', border: '1.5px solid #ffffff' }}
          >
            {notifCount}
          </span>
        )}
      </button>

      {/* Помощь */}
      <div className="relative" ref={supportRef}>
        <button
          onClick={() => { setSupportMenuOpen(o => !o); setUserMenuOpen(false); setBalanceOpen(false); }}
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-[8px] transition-colors hover:bg-gray-100"
          style={{ color: '#374151' }}
        >
          <HelpCircle style={{ width: 15, height: 15, color: '#9ca3af' }} />
          <span className="text-xs">Помощь</span>
          <ChevronDown
            style={{
              width: 12, height: 12, color: '#9ca3af',
              transform: supportMenuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {supportMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1 rounded-[10px] border py-1 z-50"
            style={{ ...dropdownStyle, minWidth: 200 }}
          >
            <p className="px-3 pt-1.5 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Поддержка</p>
            {[
              { icon: BookOpen,      label: 'Документация',      desc: 'Гайды и API',         href: '/docs' },
              { icon: MessageCircle, label: 'Написать в чат',     desc: 'Ответим за 5 мин',    href: '/support/chat' },
              { icon: LifeBuoy,      label: 'Тикет в поддержку',  desc: 'support@atlasai.ru',  href: '/support/ticket' },
            ].map(({ icon: Icon, label, desc, href }) => (
              <button key={label} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-[#f4f3f8] transition-colors text-left"
                onClick={() => { router.push(href); setSupportMenuOpen(false); }}>
                <Icon style={{ width: 14, height: 14, color: '#6b5fd4', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: '#111827' }}>{label}</div>
                  <div className="text-[10px]" style={{ color: '#9ca3af' }}>{desc}</div>
                </div>
              </button>
            ))}
            <div style={{ height: 1, background: '#f3f4f6', margin: '4px 8px' }} />
            <p className="px-3 pt-1 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Сообщество</p>
            {[
              { icon: Lightbulb, label: 'Предложить идею',       desc: 'Голосование',            href: '/ideas' },
              { icon: Bug,       label: 'Сообщить о баге',       desc: 'Помоги нам стать лучше', href: '/bugs' },
              { icon: Newspaper, label: 'Новости и обновления',  desc: 'Что нового',             href: '/news' },
              { icon: Gift,      label: 'Реферальная программа', desc: 'Зарабатывай с нами',     href: '/referral' },
            ].map(({ icon: Icon, label, desc, href }) => (
              <button key={label} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-[#f4f3f8] transition-colors text-left"
                onClick={() => { router.push(href); setSupportMenuOpen(false); }}>
                <Icon style={{ width: 14, height: 14, color: '#6b5fd4', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: '#111827' }}>{label}</div>
                  <div className="text-[10px]" style={{ color: '#9ca3af' }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: '#e5e7eb', flexShrink: 0 }} />

      {/* Аккаунт */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => { setUserMenuOpen(o => !o); setSupportMenuOpen(false); setBalanceOpen(false); }}
          className="flex items-center gap-2 px-2 h-8 rounded-[8px] transition-colors hover:bg-gray-100"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: '#ede9ff', color: '#6b5fd4' }}
          >
            {initials}
          </div>
          <span className="text-xs font-medium max-w-[120px] truncate" style={{ color: '#374151' }}>
            {email}
          </span>
          <ChevronDown
            style={{
              width: 12, height: 12, color: '#9ca3af',
              transform: userMenuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1 rounded-[10px] border py-1 z-50"
            style={{ ...dropdownStyle, minWidth: 200 }}
          >
            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <div className="text-xs font-semibold" style={{ color: '#111827' }}>{email}</div>
              <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: '#9ca3af' }}>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#ede9ff', color: '#6b5fd4' }}>
                  <Zap style={{ width: 8, height: 8 }} /> Pro
                </span>
                <span>· Агент</span>
              </div>
            </div>
            <button onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#f4f3f8] transition-colors">
              <Settings style={{ width: 14, height: 14, color: '#6b7280' }} />
              <span className="text-xs" style={{ color: '#374151' }}>Настройки аккаунта</span>
            </button>
            <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#fff1f1] transition-colors">
              <LogOut style={{ width: 14, height: 14, color: '#ef4444' }} />
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Выйти</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
