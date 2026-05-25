import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import BillsPage from '../../src/pages/admin/BillsPage';

export default function AdminBills() { return <BillsPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminBills.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
