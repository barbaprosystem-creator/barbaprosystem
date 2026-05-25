import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import ProfitTracker from '../../src/pages/admin/ProfitTracker';

export default function AdminProfitTracker() { return <ProfitTracker />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminProfitTracker.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
