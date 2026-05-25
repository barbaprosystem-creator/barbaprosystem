import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import Estimator from '../../src/pages/Estimator';

export default function PosEstimator() { return <Estimator />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosEstimator.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
