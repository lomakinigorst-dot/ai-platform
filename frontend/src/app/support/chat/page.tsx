import AppShell from '@/components/layout/AppShell';
import ComingSoon from '@/components/ui/coming-soon';
import { MessageCircle } from 'lucide-react';

export default function SupportChatPage() {
  return (
    <AppShell>
      <ComingSoon
        title="Чат поддержки"
        desc="Онлайн-чат с командой поддержки. Среднее время ответа — 5 минут."
        icon={MessageCircle}
        color="#a78bfa"
      />
    </AppShell>
  );
}
