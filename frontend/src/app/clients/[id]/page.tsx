import AppShell from '@/components/layout/AppShell';
import ClientDetailPage from '@/components/clients/ClientDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <ClientDetailPage clientId={params.id} />
    </AppShell>
  );
}
