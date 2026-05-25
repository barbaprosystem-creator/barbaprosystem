import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import CalendarPage from '../../src/pages/admin/CalendarPage';

export default function PosCalendar() { return <CalendarPage />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosCalendar.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
