import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, User, Mail, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const TERMOS_CONTENT = `O TôLivre é uma plataforma de conexão entre estabelecimentos do setor de food service e profissionais freelancer. Ao se cadastrar, você concorda em utilizar a plataforma de forma ética e responsável.

[Conteúdo completo será inserido pela equipe jurídica do TôLivre]`;

const PRIVACIDADE_CONTENT = `Em conformidade com a LGPD (Lei 13.709/2018), o TôLivre coleta apenas os dados necessários para o funcionamento da plataforma. Seus dados não são vendidos a terceiros.

[Conteúdo completo será inserido pela equipe jurídica do TôLivre]`;

// Password strength checker
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Muito fraca', color: 'bg-destructive' };
  if (score === 2) return { score, label: 'Fraca', color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Média', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Forte', color: 'bg-green-400' };
  return { score, label: 'Muito forte', color: 'bg-success' };
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'email-sent' | 'signup-success';

export default function Auth() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<'company' | 'freelancer'>('freelancer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModal, setTermsModal] = useState<'termos' | 'privacidade' | null>(null);
  const { signIn, signUp, resetPassword } = useAuth();

  const passwordStrength = getPasswordStrength(password);

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

  // Redirect authenticated users to their dashboard
  if (user && role) {
    const redirectMap: Record<string, string> = {
      company: '/empresa',
      freelancer: '/freelancer',
      admin: '/admin',
    };
    return <Navigate to={redirectMap[role] || '/freelancer'} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      const friendlyMessage = message.includes('Invalid login credentials')
        ? 'E-mail ou senha incorretos.'
        : message;
      toast({ title: 'Erro ao entrar', description: friendlyMessage, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) return;
    if (passwordStrength.score < 2) {
      toast({ title: 'Senha muito fraca', description: 'Use pelo menos 8 caracteres com letras e números.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, selectedRole);
      setMode('signup-success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao criar conta', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMode('email-sent');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Signup success screen ───────────────────────────────────────────────────
  if (mode === 'signup-success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </div>
          <h1 className="text-xl font-bold mb-2">Verifique seu e-mail!</h1>
          <p className="text-sm text-muted-foreground mb-1">
            Enviamos um link de confirmação para
          </p>
          <p className="font-medium text-sm mb-6">{email}</p>
          <div className="border rounded-lg p-4 bg-secondary text-left text-sm text-muted-foreground space-y-2 mb-6">
            <p>✅ Abra o e-mail e clique em <strong className="text-foreground">Confirmar cadastro</strong></p>
            <p>✅ Após confirmar, faça login normalmente</p>
            <p>📩 Não recebeu? Verifique a pasta de spam</p>
          </div>
          <button
            onClick={() => { setMode('login'); setEmail(''); setPassword(''); }}
            className="text-sm text-foreground font-medium underline underline-offset-4 hover:no-underline"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  // ─── Email sent (forgot password) screen ─────────────────────────────────────
  if (mode === 'email-sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h1 className="text-xl font-bold mb-2">E-mail enviado!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enviamos as instruções para redefinir sua senha para <strong>{email}</strong>.
          </p>
          <button
            onClick={() => setMode('login')}
            className="text-sm text-foreground font-medium underline underline-offset-4 hover:no-underline"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  // ─── Forgot password screen ───────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">TôLivre</h1>
            <p className="text-sm text-muted-foreground mt-1">Recuperar senha</p>
          </div>
          <div className="border rounded-lg p-6 bg-card">
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email-forgot" className="text-[13px] font-medium text-muted-foreground">
                  Seu e-mail de cadastro
                </Label>
                <Input
                  id="email-forgot"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar instruções'}
              </Button>
            </form>
            <div className="mt-5 text-center">
              <button
                onClick={() => setMode('login')}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLogin = mode === 'login';
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
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-5">
            {/* Role selector — only on signup */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-muted-foreground">Eu sou</Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { r: 'company' as const, label: 'Empresa', icon: Building2 },
                    { r: 'freelancer' as const, label: 'Freelancer', icon: User },
                  ]).map(({ r, label, icon: Icon }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`flex items-center justify-center gap-2 h-11 rounded-md border text-sm font-medium transition-colors ${
                        selectedRole === r
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isLogin ? 'Sua senha' : 'Mínimo 8 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicator — only on signup */}
              {!isLogin && password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= passwordStrength.score ? passwordStrength.color : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[12px] text-muted-foreground">{passwordStrength.label}</p>
                </div>
              )}
            </div>

            {/* Terms checkbox — only on signup */}
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

          {/* Forgot password link — only on login */}
          {isLogin && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setMode('forgot')}
                className="text-[13px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => { setMode(isLogin ? 'signup' : 'login'); setTermsAccepted(false); setPassword(''); }}
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
