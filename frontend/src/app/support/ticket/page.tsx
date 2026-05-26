import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { LifeBuoy } from 'lucide-react';

export default function SupportTicketPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Тикет в поддержку"
        desc="Опишите проблему подробно — команда поддержки ответит в течение нескольких часов."
        icon={LifeBuoy}
        color="#f87171"
      />
    </AppShell>
  );
}
