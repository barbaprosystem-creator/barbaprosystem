import { useEffect } from 'react';
import { useRouter } from 'next/router';

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
  const router = useRouter();

  useEffect(() => {
    if (!role) {
      router.replace('/login');
      return;
    }
    if (!allowed.includes(role)) {
      const roleHome = {
        admin: '/admin',
        salesperson: '/pos/estimator',
        supervisor: '/projects',
        office: '/crm',
      };
      router.replace(fallback || roleHome[role] || '/');
    }
  }, [role, allowed, fallback, router]);

  if (!role || !allowed.includes(role)) return null;
  return children;
}
