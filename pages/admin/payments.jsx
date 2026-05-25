import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import PaymentTracker from '../../src/pages/admin/PaymentTracker';

export default function AdminPayments() { return <PaymentTracker />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminPayments.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
