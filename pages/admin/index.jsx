import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import AdminDashboard from '../../src/pages/admin/AdminDashboard';

export default function AdminIndex() { return <AdminDashboard />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminIndex.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
