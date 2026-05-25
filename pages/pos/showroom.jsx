import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import Showroom from '../../src/pages/Showroom';

export default function PosShowroom() { return <Showroom />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosShowroom.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
