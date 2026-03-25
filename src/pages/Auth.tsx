import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, User } from 'lucide-react';

const TERMOS_CONTENT = `O TôLivre é uma plataforma de conexão entre estabelecimentos do setor de food service e profissionais freelancer. Ao se cadastrar, você concorda em utilizar a plataforma de forma ética e responsável.

[Conteúdo completo será inserido pela equipe jurídica do TôLivre]`;

const PRIVACIDADE_CONTENT = `Em conformidade com a LGPD (Lei 13.709/2018), o TôLivre coleta apenas os dados necessários para o funcionamento da plataforma. Seus dados não são vendidos a terceiros.

[Conteúdo completo será inserido pela equipe jurídica do TôLivre]`;

export default function Auth() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'company' | 'freelancer'>('freelancer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModal, setTermsModal] = useState<'termos' | 'privacidade' | null>(null);
  const { signIn, signUp } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (user && role) return <Navigate to={role === 'company' ? '/empresa' : '/freelancer'} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !termsAccepted) return;
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, selectedRole);
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar o cadastro.' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = isLogin || termsAccepted;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">TôLivre</h1>
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
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-muted-foreground">Senha</Label>
              <Input id="password" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-[13px] text-muted-foreground leading-relaxed cursor-pointer">
                  Li e aceito os{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setTermsModal('termos'); }}
                    className="text-accent underline underline-offset-2 hover:no-underline font-medium"
                  >
                    Termos de Uso
                  </button>
                  {' '}e a{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setTermsModal('privacidade'); }}
                    className="text-accent underline underline-offset-2 hover:no-underline font-medium"
                  >
                    Política de Privacidade
                  </button>
                  {' '}do TôLivre
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !canSubmit}
              style={!canSubmit ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setTermsAccepted(false); }}
              className="text-foreground font-medium underline underline-offset-4 hover:no-underline"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>

      {/* Terms / Privacy Modal */}
      <Dialog open={termsModal !== null} onOpenChange={(open) => !open && setTermsModal(null)}>
        <DialogContent className="max-w-lg border">
          <DialogHeader>
            <DialogTitle>
              {termsModal === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {termsModal === 'termos' ? TERMOS_CONTENT : PRIVACIDADE_CONTENT}
          </div>
          <Button
            className="w-full btn-press"
            onClick={() => {
              setTermsAccepted(true);
              setTermsModal(null);
            }}
          >
            Li e entendi
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
