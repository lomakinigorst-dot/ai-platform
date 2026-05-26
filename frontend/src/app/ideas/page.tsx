import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { Lightbulb } from 'lucide-react';

export default function IdeasPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Предложить идею"
        desc="Голосуйте за функции, которые хотите увидеть. Чем больше голосов — тем быстрее реализуем."
        icon={Lightbulb}
        color="#f97316"
      />
    </AppShell>
  );
}
