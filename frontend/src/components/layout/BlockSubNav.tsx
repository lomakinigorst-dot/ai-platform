'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AI_BLOCKS } from './AIRail';
import {
  LayoutDashboard, Users, MessageSquare, BookOpen,
  UserCheck, BarChart3, Settings, Target, Send, PieChart,
  Briefcase, GitBranch, FileText, DollarSign, Calendar,
  Scale, History, TrendingUp, Phone, Dna, Lock, Zap, Brain,
  Plus, ChevronRight,
} from 'lucide-react';

interface NavItem    { label: string; href: string; icon: React.ElementType; }
interface NavSection { title?: string; items: NavItem[]; }

const blockNavs: Record<string, NavSection[]> = {
  atlas: [
    {
      title: 'AI Atlas',
      items: [{ label: 'AI Atlas', href: '/atlas', icon: Brain }],
    },
    {
      title: 'Управление',
      items: [
        { label: 'Дашборд',      href: '/',            icon: LayoutDashboard },
        { label: 'Клиенты',      href: '/clients',     icon: Users },
        { label: 'Аналитика',    href: '/analytics',   icon: BarChart3 },
        { label: 'Интеграции',   href: '/integrations',icon: Zap },
      ],
    },
  ],
  consultant: [
    {
      title: 'Консультант',
      items: [
        { label: 'Дашборд',     href: '/',              icon: LayoutDashboard },
        { label: 'Лиды',        href: '/leads',         icon: UserCheck },
        { label: 'Диалоги',     href: '/conversations', icon: MessageSquare },
      ],
    },
    {
      title: 'Настройка',
      items: [
        { label: 'База знаний', href: '/knowledge',  icon: BookOpen },
        { label: 'Аналитика',   href: '/analytics',  icon: BarChart3 },
        { label: 'Настройки',   href: '/settings',   icon: Settings },
      ],
    },
  ],
  marketer: [
    {
      title: 'Маркетолог',
      items: [
        { label: 'ДНК-анализ',  href: '/marketing',   icon: Dna },
        { label: 'Рассылки',    href: '/campaigns',   icon: Send },
        { label: 'Аналитика ЦА',href: '/audience',    icon: PieChart },
        { label: 'Конкуренты',  href: '/competitors', icon: Target },
      ],
    },
  ],
  hr: [
    {
      title: 'HR',
      items: [
        { label: 'Вакансии',        href: '/hr/vacancies',  icon: Briefcase },
        { label: 'Кандидаты',       href: '/hr/candidates', icon: Users },
        { label: 'Воронка найма',   href: '/hr/funnel',     icon: GitBranch },
        { label: 'Тесты',           href: '/hr/tests',      icon: FileText },
      ],
    },
  ],
  finance: [
    {
      title: 'Финансы',
      items: [
        { label: 'P&L',              href: '/finance/pnl',      icon: TrendingUp },
        { label: 'ДДС',              href: '/finance/cashflow', icon: DollarSign },
        { label: 'Подключить банк',  href: '/finance/banks',    icon: Settings },
        { label: 'Платёжный кал-рь', href: '/finance/calendar', icon: Calendar },
      ],
    },
  ],
  legal: [
    {
      title: 'Юрист',
      items: [
        { label: 'Договоры',         href: '/legal/contracts',   icon: FileText },
        { label: 'Контрагенты',      href: '/legal/counterparts',icon: Users },
        { label: 'История проверок', href: '/legal/history',     icon: History },
        { label: 'Аналитика рисков', href: '/legal/risks',       icon: Scale },
      ],
    },
  ],
  sales: [
    {
      title: 'Отдел продаж',
      items: [
        { label: 'Тренировки',    href: '/sales/training',  icon: TrendingUp },
        { label: 'Анализ звонков',href: '/sales/calls',     icon: Phone },
        { label: 'Скрипты',       href: '/sales/scripts',   icon: FileText },
        { label: 'Аналитика',     href: '/sales/analytics', icon: BarChart3 },
      ],
    },
  ],
};

// Быстрые действия для Atlas — группированные по AI-блокам
const ATLAS_QUICK = [
  {
    blockId: 'marketer', label: 'AI Маркетолог', color: '#fb923c', status: 'lite',
    actions: ['Написать пост для соцсетей', 'ДНК-анализ аудитории', 'Создать рассылку'],
  },
  {
    blockId: 'consultant', label: 'AI Консультант', color: '#60a5fa', status: 'pro',
    actions: ['Настроить базу знаний', 'Просмотреть диалоги', 'Анализ лидов'],
  },
  {
    blockId: 'hr',      label: 'AI HR',       color: '#34d399', status: 'locked', actions: [],
  },
  {
    blockId: 'finance', label: 'AI Финансы',  color: '#fbbf24', status: 'locked', actions: [],
  },
  {
    blockId: 'legal',   label: 'AI Юрист',    color: '#f87171', status: 'locked', actions: [],
  },
  {
    blockId: 'sales',   label: 'AI Продажи',  color: '#818cf8', status: 'locked', actions: [],
  },
];

// ─── Специальный сайдбар для Atlas ──────────────────────────────────────────
function AtlasSubNav() {
  const pathname = usePathname();
  const router   = useRouter();

  const goAtlas = (q: string) => {
    router.push(`/atlas?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {/* Ссылка на чат */}
      <div className="mb-1">
        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
          AI Atlas
        </p>
        <Link
          href="/atlas"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 mx-1 rounded-[8px] transition-colors text-sm',
            pathname === '/atlas'
              ? 'bg-[#ede9ff] text-[#6b5fd4] font-medium'
              : 'text-[#374151] hover:bg-[#f4f3f8]'
          )}
        >
          <Brain className="w-4 h-4 flex-shrink-0" style={{ color: pathname === '/atlas' ? '#6b5fd4' : undefined }} />
          Открыть чат
        </Link>
      </div>

      <div style={{ height: 1, background: '#f3f4f6', margin: '6px 12px' }} />

      {/* Быстрые действия по блокам */}
      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
        Быстрые действия
      </p>

      {ATLAS_QUICK.map(group => {
        const isLocked = group.status === 'locked';
        return (
          <div key={group.blockId} className="mx-3 mb-2">
            {/* Заголовок группы */}
            <div className="flex items-center gap-1.5 py-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
              <span className="text-[11px] font-semibold" style={{ color: '#374151' }}>
                {group.label}
              </span>
              {isLocked && (
                <Lock style={{ width: 10, height: 10, color: '#9ca3af', marginLeft: 'auto' }} />
              )}
            </div>

            {isLocked ? (
              <p className="text-[10px] px-1 pb-1" style={{ color: '#c4c4c4' }}>
                Не подключён
              </p>
            ) : (
              <div className="space-y-0.5">
                {group.actions.map(action => (
                  <button
                    key={action}
                    onClick={() => goAtlas(action)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[7px] text-left hover:bg-[#f4f3f8] transition-colors group"
                  >
                    <ChevronRight style={{ width: 10, height: 10, color: group.color, flexShrink: 0 }} />
                    <span className="text-[11px] text-[#374151] truncate">{action}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ height: 1, background: '#f3f4f6', margin: '6px 12px' }} />

      {/* Сохранённые / кастомные */}
      <div className="mx-3">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[11px] font-semibold" style={{ color: '#374151' }}>Сохранённые</span>
          <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f4f3f8] transition-colors" title="Добавить">
            <Plus style={{ width: 11, height: 11, color: '#9ca3af' }} />
          </button>
        </div>
        <p className="text-[10px] px-1" style={{ color: '#c4c4c4' }}>
          Сохраняйте часто используемые задачи
        </p>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

interface BlockSubNavProps {
  blockId: string;
}

export default function BlockSubNav({ blockId }: BlockSubNavProps) {
  const pathname = usePathname();
  const block    = AI_BLOCKS.find(b => b.id === blockId);
  const sections = blockNavs[blockId] ?? [];
  const isLocked = block?.status === 'locked';
  const Icon     = block?.icon ?? Settings;

  if (!block) return null;

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full z-10"
      style={{
        width: 220,
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Заголовок блока */}
      <div
        className="flex items-center px-4 h-12 flex-shrink-0"
        style={{ background: '#1a1535', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0"
            style={{ background: block.bgColor.replace('0.15', '0.18') }}
          >
            <Icon className="w-4 h-4" style={{ color: block.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
              {block.label}
            </p>
            <p className="text-[10px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {block.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Статус-бейдж */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
        {isLocked ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#f4f3f8]">
            <Lock className="w-3 h-3 text-[#9ca3af]" />
            <span className="text-xs text-[#6b7280]">Блок не подключён</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
            <span className="text-xs font-medium text-[#6b7280]">
              {block.badgeLabel ?? 'Активен'}
            </span>
          </div>
        )}
      </div>

      {/* Контент */}
      {blockId === 'atlas' ? (
        // Atlas — специальный сайдбар с быстрыми действиями
        <AtlasSubNav />
      ) : isLocked ? (
        // Заблокированный блок
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs text-[#6b7280] leading-relaxed">
              {block.desc}. Доступно на тарифе Pro.
            </p>
            {(blockNavs[blockId] ?? blockNavs.consultant).map((section, si) => (
              <div key={si} className="space-y-0.5">
                {section.items.map((item, ii) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={ii} className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] opacity-40 cursor-not-allowed">
                      <ItemIcon className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                      <span className="text-sm text-[#9ca3af]">{item.label}</span>
                      <Lock className="w-3 h-3 text-[#d1d5db] ml-auto flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Активный блок — обычная навигация
        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section, si) => (
            <div key={si} className="mb-1">
              {section.title && (
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 mx-1 rounded-[8px] transition-colors text-sm',
                      isActive
                        ? 'bg-[#ede9ff] text-[#6b5fd4] font-medium'
                        : 'text-[#374151] hover:bg-[#f4f3f8] hover:text-[#111827]'
                    )}
                  >
                    <ItemIcon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#6b5fd4' : undefined }} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Футер — кнопка триала для заблокированных */}
      {isLocked && (
        <div className="p-4 border-t border-[#f3f4f6] flex-shrink-0">
          <button
            className="w-full py-2 px-3 rounded-[8px] text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: block.color }}
            onClick={() => alert('Запрос триала — скоро!')}
          >
            Попробовать 7 дней бесплатно
          </button>
        </div>
      )}
    </div>
  );
}
