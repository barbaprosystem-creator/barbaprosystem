import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import BrigadesPage from '../../src/pages/admin/BrigadesPage';

export default function AdminBrigades() { return <BrigadesPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminBrigades.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
