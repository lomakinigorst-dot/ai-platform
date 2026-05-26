import ClientPortalPage from '@/components/portal/ClientPortalPage';

export default function PortalPage({ params }: { params: { token: string } }) {
  return <ClientPortalPage token={params.token} />;
}
