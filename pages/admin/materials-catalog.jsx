import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import MaterialsCatalog from '../../src/pages/admin/MaterialsCatalog';

export default function AdminMaterialsCatalog() { return <MaterialsCatalog />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminMaterialsCatalog.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
