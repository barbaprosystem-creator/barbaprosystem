import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import SettingsPage from '../../src/pages/admin/SettingsPage';

export default function AdminSettings() { return <SettingsPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminSettings.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
