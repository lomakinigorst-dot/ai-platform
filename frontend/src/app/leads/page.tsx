'use client';

import AppShell from '@/components/layout/AppShell';
import LeadsPage from '@/components/leads/LeadsPage';

export default function LeadsRoute() {
  return (
    <AppShell>
      <LeadsPage />
    </AppShell>
  );
}
