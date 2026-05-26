import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { Newspaper } from 'lucide-react';

export default function NewsPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Новости и обновления"
        desc="Здесь будет лента всех изменений: новые функции, улучшения, важные анонсы платформы."
        icon={Newspaper}
        color="#6b5fd4"
      />
    </AppShell>
  );
}
