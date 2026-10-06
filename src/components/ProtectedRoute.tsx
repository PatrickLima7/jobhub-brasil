import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'company' | 'freelancer' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading: authLoading } = useAuth();
  const location = useLocation();

  const { data: profileStatus, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-completion', user?.id, role],
    queryFn: async () => {
      if (!user || !role || role === 'admin') return { complete: true };
      
      if (role === 'freelancer') {
        const { data } = await supabase.from('freelancer_profiles').select('nome, funcoes').eq('user_id', user.id).maybeSingle();
        if (!data) return { complete: false };
        const funcoes = (data.funcoes as string[]) || [];
        const isComplete = Boolean(data.nome && data.nome.trim() !== '' && funcoes.length > 0);
        return { complete: isComplete };
      }
      
      if (role === 'company') {
        const { data } = await supabase.from('company_profiles').select('nome, cnpj').eq('user_id', user.id).maybeSingle();
        if (!data) return { complete: false };
        const isComplete = Boolean(data.nome && data.nome.trim() !== '' && data.cnpj && data.cnpj.trim() !== '');
        return { complete: isComplete };
      }

      return { complete: true };
    },
    enabled: !!user && !!role,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requiredRole && role !== requiredRole) {
    const redirectMap: Record<string, string> = {
      company: '/empresa',
      freelancer: '/freelancer',
      admin: '/admin',
    };
    return <Navigate to={role ? (redirectMap[role] || '/auth') : '/auth'} replace />;
  }

  // Handle Onboarding Redirects
  const isOnboardingRoute = location.pathname === '/onboarding';
  
  if (role !== 'admin' && profileStatus && !profileStatus.complete && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  if (role !== 'admin' && profileStatus && profileStatus.complete && isOnboardingRoute) {
    const redirectMap: Record<string, string> = {
      company: '/empresa',
      freelancer: '/freelancer',
    };
    return <Navigate to={redirectMap[role as string] || '/auth'} replace />;
  }

  return <>{children}</>;
}
