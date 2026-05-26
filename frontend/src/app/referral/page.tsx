import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { Gift } from 'lucide-react';

export default function ReferralPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Реферальная программа"
        desc="Приглашайте коллег и зарабатывайте бонусы. Детали программы будут опубликованы скоро."
        icon={Gift}
        color="#34d399"
      />
    </AppShell>
  );
}
