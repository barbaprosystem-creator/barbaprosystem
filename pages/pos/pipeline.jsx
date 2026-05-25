import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import CRMPipeline from '../../src/pages/admin/CRMPipeline';

export default function PosPipeline() { return <CRMPipeline />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosPipeline.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
