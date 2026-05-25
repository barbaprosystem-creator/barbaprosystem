import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import InboxPage from '../../src/pages/admin/InboxPage';

export default function AdminInbox() { return <InboxPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminInbox.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
