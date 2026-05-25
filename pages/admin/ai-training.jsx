import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import AITrainingChat from '../../src/pages/admin/AITrainingChat';

export default function AdminAITraining() { return <AITrainingChat />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminAITraining.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
