'use client';

import { useState } from 'react';
import {
  Brain, MessageSquare, Target, Users, DollarSign,
  Scale, TrendingUp, Zap, ChevronsLeft,
} from 'lucide-react';

export interface AIBlock {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status: 'active' | 'pro' | 'lite' | 'trial' | 'locked';
  badgeLabel?: string;
  homeHref: string;
}

export const AI_BLOCKS: AIBlock[] = [
  {
    id: 'atlas',
    label: 'AI Atlas',
    desc: 'Оркестратор платформы',
    icon: Brain,
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.15)',
    status: 'active',
    homeHref: '/atlas',
  },
  {
    id: 'consultant',
    label: 'AI Консультант',
    desc: 'Виджет на сайт',
    icon: MessageSquare,
    color: '#60a5fa',
    bgColor: 'rgba(96,165,250,0.15)',
    status: 'pro',
    badgeLabel: 'Pro',
    homeHref: '/',
  },
  {
    id: 'marketer',
    label: 'AI Маркетолог',
    desc: 'ДНК-анализ, рассылки',
    icon: Target,
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,0.15)',
    status: 'lite',
    badgeLabel: 'Lite',
    homeHref: '/marketing',
  },
  {
    id: 'hr',
    label: 'AI HR',
    desc: 'Воронка найма',
    icon: Users,
    color: '#34d399',
    bgColor: 'rgba(52,211,153,0.15)',
    status: 'locked',
    homeHref: '/hr',
  },
  {
    id: 'finance',
    label: 'AI Финансы',
    desc: 'P&L, ДДС, банки',
    icon: DollarSign,
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.15)',
    status: 'locked',
    homeHref: '/finance',
  },
  {
    id: 'legal',
    label: 'AI Юрист',
    desc: 'Анализ договоров',
    icon: Scale,
    color: '#f87171',
    bgColor: 'rgba(248,113,113,0.15)',
    status: 'locked',
    homeHref: '/legal',
  },
  {
    id: 'sales',
    label: 'AI Продажи',
    desc: 'Тренировки, звонки',
    icon: TrendingUp,
    color: '#818cf8',
    bgColor: 'rgba(129,140,248,0.15)',
    status: 'locked',
    homeHref: '/sales',
  },
];

const statusDot: Record<AIBlock['status'], string | null> = {
  active: '#34d399',
  pro:    '#60a5fa',
  lite:   '#9ca3af',
  trial:  '#fbbf24',
  locked: null,
};

interface AIRailProps {
  expanded: boolean;
  onToggle: () => void;
  activeBlock: string;
  onBlockSelect: (id: string) => void;
}

export default function AIRail({ expanded, onToggle, activeBlock, onBlockSelect }: AIRailProps) {
  const [toggleHover, setToggleHover] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  return (
    <div
      className="flex-shrink-0 flex flex-col relative z-20"
      style={{
        // При наведении на тогл — рейл чуть расширяется (+4px)
        width: expanded ? 224 : toggleHover ? 52 : 48,
        background: '#1a1535',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'width 0.18s ease',
      }}
    >
      {/* Кнопка тогла */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setToggleHover(true)}
        onMouseLeave={() => setToggleHover(false)}
        className="h-12 flex items-center flex-shrink-0 w-full relative"
        style={{
          padding: expanded ? '0 10px' : '0',
          justifyContent: expanded ? 'flex-start' : 'center',
          gap: expanded ? 8 : 0,
          background: toggleHover ? 'rgba(255,255,255,0.05)' : 'transparent',
          transition: 'background 0.15s',
        }}
        title={expanded ? 'Свернуть' : 'Открыть AI-блоки'}
      >
        {/* Иконка Zap — сдвигается на 4px вправо при ховере */}
        <div
          className="flex items-center justify-center flex-shrink-0 rounded-[8px]"
          style={{
            width: 30,
            height: 30,
            background: toggleHover || expanded
              ? 'rgba(167,139,250,0.18)'
              : 'rgba(167,139,250,0.08)',
            transform: toggleHover && !expanded ? 'translateX(4px)' : 'none',
            transition: 'transform 0.18s ease, background 0.15s',
          }}
        >
          <Zap style={{ width: 16, height: 16, color: '#a78bfa' }} />
        </div>

        {expanded ? (
          <>
            <span
              className="flex-1 text-[11px] font-bold tracking-widest uppercase text-left"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              AI Блоки
            </span>
            <ChevronsLeft
              style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}
            />
          </>
        ) : null}
      </button>

      {/* Разделитель / индикатор: полоска → стрелка при ховере на молнию */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 8, margin: '0 8px' }}>
        {expanded ? (
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              transform: toggleHover ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.18s ease',
            }}
          >
            <div style={{
              width: 10,
              height: 1.5,
              borderRadius: 1,
              background: toggleHover ? 'rgba(167,139,250,0.75)' : 'rgba(167,139,250,0.3)',
              transition: 'background 0.18s ease',
            }} />
            <div style={{
              width: 0,
              height: 0,
              borderTop: '2.5px solid transparent',
              borderBottom: '2.5px solid transparent',
              borderLeft: '3.5px solid rgba(167,139,250,0.75)',
              opacity: toggleHover ? 1 : 0,
              transition: 'opacity 0.18s ease',
            }} />
          </div>
        )}
      </div>

      {/* Список AI-блоков */}
      <div
        className="flex-1 py-2 flex flex-col gap-0.5"
        style={{ overflowY: expanded ? 'auto' : 'visible' }}
      >
        {AI_BLOCKS.map((block) => {
          const Icon = block.icon;
          const isActive  = activeBlock === block.id;
          const isLocked  = block.status === 'locked';
          const dot       = statusDot[block.status];
          const isHovered = hoveredBlock === block.id;

          return (
            <div
              key={block.id}
              className="relative"
              style={{ margin: '0 4px' }}
              onMouseEnter={() => !expanded && setHoveredBlock(block.id)}
              onMouseLeave={() => setHoveredBlock(null)}
            >
              <button
                onClick={() => onBlockSelect(block.id)}
                title={!expanded ? block.label : undefined}
                className="flex items-center transition-all w-full"
                style={{
                  gap: expanded ? 10 : 0,
                  padding: expanded ? '8px 10px' : '10px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  background: isActive
                    ? 'rgba(255,255,255,0.09)'
                    : isHovered && !expanded
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  borderRadius: 8,
                  opacity: isLocked && !isHovered && !expanded ? 0.5 : 1,
                }}
              >
                {/* Активная полоска слева */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{ width: 2.5, height: 18, background: block.color }}
                  />
                )}

                {/* Иконка — всегда настоящая (dim для locked) */}
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isActive
                      ? block.bgColor
                      : isHovered && !expanded
                      ? block.bgColor
                      : 'rgba(255,255,255,0.05)',
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon
                    style={{
                      width: 15,
                      height: 15,
                      // Locked: серая dim-версия иконки (не замок!)
                      color: isLocked && !isHovered
                        ? 'rgba(255,255,255,0.22)'
                        : block.color,
                    }}
                  />
                </div>

                {/* Название + статус (expanded) */}
                {expanded && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-xs font-medium truncate"
                        style={{
                          color: isLocked
                            ? 'rgba(255,255,255,0.3)'
                            : 'rgba(255,255,255,0.88)',
                        }}
                      >
                        {block.label}
                      </span>
                      {dot ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: dot }} />
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {block.badgeLabel ?? 'Активен'}
                          </span>
                        </div>
                      ) : isLocked ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)' }}>
                          Скоро
                        </span>
                      ) : null}
                    </div>
                    <span
                      className="text-[10px] truncate block"
                      style={{ color: 'rgba(255,255,255,0.22)', marginTop: 1 }}
                    >
                      {block.desc}
                    </span>
                  </div>
                )}
              </button>

              {/* Ховер-попап для свёрнутого рейла */}
              {!expanded && isHovered && (
                <div
                  className="absolute flex items-center gap-2.5 rounded-[10px] z-50 cursor-pointer"
                  style={{
                    left: 'calc(100% + 8px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#2d2652',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                    padding: '7px 12px 7px 10px',
                    whiteSpace: 'nowrap',
                    animation: 'slideInLeft 0.12s ease-out',
                  }}
                  onClick={() => onBlockSelect(block.id)}
                  onMouseEnter={() => setHoveredBlock(block.id)}
                  onMouseLeave={() => setHoveredBlock(null)}
                >
                  <div
                    className="flex items-center justify-center rounded-[7px] flex-shrink-0"
                    style={{ width: 26, height: 26, background: block.bgColor }}
                  >
                    <Icon style={{ width: 14, height: 14, color: block.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {block.label}
                    </div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {block.desc}
                    </div>
                  </div>
                  {dot && (
                    <div className="rounded-full flex-shrink-0" style={{ width: 6, height: 6, background: dot }} />
                  )}
                  {isLocked && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
                      Скоро
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Подвал */}
      <div
        style={{
          padding: expanded ? '8px 12px' : '8px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
        }}
      >
        {expanded ? (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.13)' }}>7 AI-блоков</p>
        ) : (
          <div className="rounded-full mx-auto" style={{ width: 5, height: 5, background: 'rgba(255,255,255,0.08)' }} />
        )}
      </div>
    </div>
  );
}
