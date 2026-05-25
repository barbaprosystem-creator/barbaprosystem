import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import EstimatesList from '../../src/pages/admin/EstimatesList';

export default function AdminEstimates() { return <EstimatesList />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminEstimates.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
