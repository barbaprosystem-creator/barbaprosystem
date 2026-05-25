import AdminLayout from '../../../src/layouts/AdminLayout';
import { useAuth } from '../../../src/hooks/useAuth';
import ClientDetail from '../../../src/pages/admin/ClientDetail';
import { useRouter } from 'next/router';

export default function AdminClientDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  return <ClientDetail clientId={id} onBack={() => router.back()} />;
}

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminClientDetailPage.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
