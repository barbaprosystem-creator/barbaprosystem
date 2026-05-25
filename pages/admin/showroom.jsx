import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import ShowroomAdminPage from '../../src/pages/admin/ShowroomAdminPage';

export default function AdminShowroom() { return <ShowroomAdminPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminShowroom.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
