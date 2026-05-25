import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import CalendarPage from '../../src/pages/admin/CalendarPage';

export default function AdminCalendar() { return <CalendarPage />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminCalendar.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
