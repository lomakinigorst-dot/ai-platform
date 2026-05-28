'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import AIRail, { AI_BLOCKS } from './AIRail';
import BlockSubNav from './BlockSubNav';
import TopNav from './TopNav';

// Маппинг URL-путей на активный AI-блок
const PATH_TO_BLOCK: Array<{ prefix: string; blockId: string }> = [
  { prefix: '/atlas',         blockId: 'atlas' },
  { prefix: '/marketing',     blockId: 'marketer' },
  { prefix: '/hr',            blockId: 'hr' },
  { prefix: '/finance',       blockId: 'finance' },
  { prefix: '/legal',         blockId: 'legal' },
  { prefix: '/sales',         blockId: 'sales' },
  // Все страницы консультанта — sidebar не меняется при навигации внутри блока
  { prefix: '/leads',         blockId: 'consultant' },
  { prefix: '/conversations', blockId: 'consultant' },
  { prefix: '/knowledge',     blockId: 'consultant' },
  { prefix: '/settings',      blockId: 'consultant' },
  { prefix: '/clients',       blockId: 'consultant' },
  { prefix: '/analytics',     blockId: 'consultant' },
  { prefix: '/scanner',       blockId: 'consultant' },
  { prefix: '/team',          blockId: 'consultant' },
  { prefix: '/support',       blockId: 'consultant' },
  { prefix: '/billing',       blockId: 'consultant' },
  { prefix: '/journey',       blockId: 'consultant' },
  { prefix: '/integrations',  blockId: 'consultant' },
  // Дашборд — консультант
  { prefix: '/',              blockId: 'consultant' },
];

function getActiveBlockId(pathname: string): string {
  for (const { prefix, blockId } of PATH_TO_BLOCK) {
    if (prefix === '/') {
      if (pathname === '/') return blockId;
      continue;
    }
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return blockId;
    }
  }
  return 'consultant';
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [railExpanded, setRailExpanded] = useState(false);

  // Активный блок определяется по URL, не по state — нет рассинхрона при навигации
  const activeBlock = getActiveBlockId(pathname);

  const handleBlockSelect = (id: string) => {
    setRailExpanded(false);
    const block = AI_BLOCKS.find(b => b.id === id);
    if (block) router.push(block.homeHref);
  };

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      <AIRail
        expanded={railExpanded}
        onToggle={() => setRailExpanded(e => !e)}
        activeBlock={activeBlock}
        onBlockSelect={handleBlockSelect}
      />
      <BlockSubNav blockId={activeBlock} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
