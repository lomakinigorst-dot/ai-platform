'use client';

import AppShell from '@/components/layout/AppShell';
import BillingPage from '@/components/billing/BillingPage';

export default function BillingRoute() {
  return (
    <AppShell>
      <BillingPage />
    </AppShell>
  );
}
