import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import ReportsPage from '../../src/pages/admin/ReportsPage';

export default function AdminReports() { return <ReportsPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminReports.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
