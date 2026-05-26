import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { Target } from 'lucide-react';

export default function MarketingHomePage() {
  return (
    <AppShell>
      <ComingSoon
        title="AI Маркетолог"
        desc="ДНК-анализ аудитории, персонализированные рассылки и аналитика конкурентов. Lite-версия подключена — страница в разработке."
        icon={Target}
        color="#fb923c"
      />
    </AppShell>
  );
}
