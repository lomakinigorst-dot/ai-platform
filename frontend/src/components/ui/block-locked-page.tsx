'use client';

import { Lock } from 'lucide-react';
import { AI_BLOCKS } from '@/components/layout/AIRail';

interface BlockLockedPageProps {
  blockId: string;
  features: string[];
}

export default function BlockLockedPage({ blockId, features }: BlockLockedPageProps) {
  const block = AI_BLOCKS.find(b => b.id === blockId);
  if (!block) return null;
  const Icon = block.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-5 px-6">
      {/* Иконка */}
      <div
        className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{ background: block.bgColor }}
      >
        <Icon style={{ width: 28, height: 28, color: block.color }} />
      </div>

      {/* Заголовок */}
      <div className="text-center max-w-[340px]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ background: '#f4f3f8' }}>
          <Lock style={{ width: 11, height: 11, color: '#9ca3af' }} />
          <span className="text-[11px]" style={{ color: '#9ca3af' }}>Блок не подключён</span>
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#111827' }}>{block.label}</h2>
        <p className="text-sm" style={{ color: '#9ca3af' }}>{block.desc}</p>
      </div>

      {/* Список функций */}
      <div
        className="w-full max-w-[320px] rounded-[12px] p-4 space-y-2.5"
        style={{ background: '#fff', border: '1px solid #e5e7eb' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
          Что входит в блок
        </p>
        {features.map(f => (
          <div key={f} className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${block.color}20` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: block.color }} />
            </div>
            <span className="text-sm" style={{ color: '#374151' }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="w-full max-w-[320px] py-2.5 rounded-[10px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: block.color }}
        onClick={() => alert('Запрос триала — скоро!')}
      >
        Попробовать 7 дней бесплатно
      </button>
    </div>
  );
}
