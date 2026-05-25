import AdminLayout from '../../../src/layouts/AdminLayout';
import { useAuth } from '../../../src/hooks/useAuth';
import ContractBuilder from '../../../src/pages/admin/ContractBuilder';

export default function AdminContract() { return <ContractBuilder />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminContract.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
