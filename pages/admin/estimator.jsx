import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import Estimator from '../../src/pages/Estimator';

export default function AdminEstimator() { return <Estimator />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminEstimator.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
