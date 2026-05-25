import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import Clients from '../../src/pages/Clients';

export default function PosClients() { return <Clients />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosClients.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
