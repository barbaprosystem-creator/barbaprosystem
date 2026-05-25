import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import CRMPipeline from '../../src/pages/admin/CRMPipeline';

export default function AdminCRM() { return <CRMPipeline />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminCRM.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
