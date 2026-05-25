import AdminLayout from '../../src/layouts/AdminLayout';
import { useAuth } from '../../src/hooks/useAuth';
import ProjectsList from '../../src/pages/admin/ProjectsList';

export default function AdminProjects() { return <ProjectsList />; }

function AdminWrapper({ children }) {
  const { profile, signOut } = useAuth();
  return <AdminLayout profile={profile} onSignOut={signOut}>{children}</AdminLayout>;
}

AdminProjects.getLayout = (page) => <AdminWrapper>{page}</AdminWrapper>;
