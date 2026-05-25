import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import PricingSettings from '../../src/pages/admin/PricingSettings';

export default function AdminPricing() { return <PricingSettings />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminPricing.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
