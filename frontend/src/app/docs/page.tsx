import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { BookOpen } from 'lucide-react';

export default function DocsPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Документация"
        desc="Полные гайды по работе с платформой, API-документация и видеоуроки."
        icon={BookOpen}
        color="#60a5fa"
      />
    </AppShell>
  );
}
