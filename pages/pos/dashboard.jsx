import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import POSDashboard from '../../src/pages/POSDashboard';

export default function PosDashboard() { return <POSDashboard />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosDashboard.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
