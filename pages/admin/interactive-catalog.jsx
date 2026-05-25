import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import CatalogAdminPage from '../../src/pages/admin/CatalogAdminPage';

export default function AdminInteractiveCatalog() { return <CatalogAdminPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminInteractiveCatalog.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
