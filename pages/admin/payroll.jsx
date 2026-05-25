import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import PayrollPage from '../../src/pages/admin/PayrollPage';

export default function AdminPayroll() { return <PayrollPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminPayroll.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
