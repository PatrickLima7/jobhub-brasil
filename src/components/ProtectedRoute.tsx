import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'company' | 'freelancer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Carregando...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'company' ? '/empresa' : '/freelancer'} replace />;
  }

  return <>{children}</>;
}
