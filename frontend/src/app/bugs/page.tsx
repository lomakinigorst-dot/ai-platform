import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { Bug } from 'lucide-react';

export default function BugsPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Сообщить о баге"
        desc="Помогите нам сделать платформу лучше. Опишите проблему — мы исправим в течение 24 часов."
        icon={Bug}
        color="#ef4444"
      />
    </AppShell>
  );
}
