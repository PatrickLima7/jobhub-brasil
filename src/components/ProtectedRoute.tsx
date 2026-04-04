import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'company' | 'freelancer' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Carregando...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole) {
    const redirectMap: Record<string, string> = {
      company: '/empresa',
      freelancer: '/freelancer',
      admin: '/admin',
    };
    return <Navigate to={role ? (redirectMap[role] || '/auth') : '/auth'} replace />;
  }

  return <>{children}</>;
}
