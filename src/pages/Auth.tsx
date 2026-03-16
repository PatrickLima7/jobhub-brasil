import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, User } from 'lucide-react';

export default function Auth() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'company' | 'freelancer'>('freelancer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (user && role) return <Navigate to={role === 'company' ? '/empresa' : '/freelancer'} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, selectedRole);
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar o cadastro.' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">ShiftHub</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-muted-foreground">Eu sou</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('company')}
                    className={`flex items-center justify-center gap-2 h-11 rounded-md border text-sm font-medium transition-colors ${
                      selectedRole === 'company'
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('freelancer')}
                    className={`flex items-center justify-center gap-2 h-11 rounded-md border text-sm font-medium transition-colors ${
                      selectedRole === 'freelancer'
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground hover:bg-secondary'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Freelancer
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-muted-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-muted-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
