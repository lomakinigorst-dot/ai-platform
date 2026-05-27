'use client';

import AppShell from '@/components/layout/AppShell';
import AgencySettingsPage from '@/components/settings/AgencySettingsPage';

export default function SettingsRoute() {
  return (
    <AppShell>
      <AgencySettingsPage />
    </AppShell>
  );
}
