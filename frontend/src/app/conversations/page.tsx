'use client';

import AppShell from '@/components/layout/AppShell';
import ConversationsPage from '@/components/conversations/ConversationsPage';

export default function ConversationsRoute() {
  return (
    <AppShell>
      <ConversationsPage />
    </AppShell>
  );
}
