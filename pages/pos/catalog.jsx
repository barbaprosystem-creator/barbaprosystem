import POSLayout from '../../src/layouts/POSLayout';
import { useAuth } from '../../src/hooks/useAuth';
import PublicCatalogPage from '../../src/pages/PublicCatalogPage';

export default function PosCatalog() { return <PublicCatalogPage />; }

function POSWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <POSLayout profile={profile} onSignOut={signOut}>{children}</POSLayout>;
}

PosCatalog.getLayout = (page) => <POSWrapper>{page}</POSWrapper>;
