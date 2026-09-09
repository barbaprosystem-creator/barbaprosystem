import { Navigate } from 'react-router-dom';

/**
 * RoleGuard - Protects routes based on user role.
 * 
 * @param {Object} props
 * @param {string[]} props.allowed - Array of allowed roles e.g. ['admin', 'office']
 * @param {string} props.role - Current user's role
 * @param {string} [props.fallback] - Redirect path if unauthorized (defaults to role home)
 * @param {React.ReactNode} props.children - Protected content
 */
export default function RoleGuard({ allowed, role, fallback, children }) {
  if (!role) return <Navigate to="/login" replace />;

  if (!allowed.includes(role)) {
    const roleHome = {
      admin: '/admin',
      office: '/admin',
      supervisor: '/admin/projects',
      salesperson: '/pos/estimator',
    };
    return <Navigate to={fallback || roleHome[role] || '/admin'} replace />;
  }

  return children;
}

