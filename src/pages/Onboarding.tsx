import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UtensilsCrossed, Soup, Wine, ChefHat, Flame, Banknote, Handshake, Zap, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

const FUNCOES_LIST = [
  { id: 'Garçom', label: 'Garçom', icon: UtensilsCrossed },
  { id: 'Cumim', label: 'Cumim', icon: Coffee },
  { id: 'Bartender', label: 'Bartender', icon: Wine },
  { id: 'Auxiliar de Cozinha', label: 'Auxiliar de Cozinha', icon: Soup },
  { id: 'Cozinheiro', label: 'Cozinheiro', icon: ChefHat },
  { id: 'Churrasqueiro', label: 'Churrasqueiro', icon: Flame },
  { id: 'Caixa', label: 'Caixa', icon: Banknote },
  { id: 'Recepcionista', label: 'Recepcionista', icon: Handshake },
  { id: 'Freelancer Geral', label: 'Freelancer Geral', icon: Zap },
];

export default function Onboarding() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Freelancer form
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [funcoes, setFuncoes] = useState<string[]>([]);

  // Company form
  const [cnpj, setCnpj] = useState('');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const toggleFuncao = (id: string) => {
    setFuncoes(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleFinish = async () => {
    if (!user || !role) return;
    setLoading(true);
    try {
      if (role === 'freelancer') {
        const { error } = await supabase.from('freelancer_profiles').update({
          nome,
          cidade,
          funcoes,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
        if (error) throw error;
      } else if (role === 'company') {
        const { error } = await supabase.from('company_profiles').update({
          nome,
          cidade,
          cnpj,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
        if (error) throw error;
      }

      toast.success('Bem-vindo ao JobHub!');
      // Invalidate the query to trigger redirect in ProtectedRoute
      await queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
      navigate(role === 'company' ? '/empresa' : '/freelancer', { replace: true });
    } catch (err: unknown) {
      toast.error('Erro ao finalizar o cadastro', { description: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setLoading(false);
    }
  };

  const isFreelancer = role === 'freelancer';
  const totalSteps = isFreelancer ? 3 : 2;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i + 1 <= step ? 'bg-accent' : 'bg-secondary'}`} />
          ))}
        </div>

        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm overflow-hidden relative min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* STEP 1: Name and Photo */}
              {step === 1 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Qual o seu nome?</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      {isFreelancer ? "Como as empresas vão te chamar?" : "Qual o nome do seu estabelecimento?"}
                    </p>
                  </div>
                  
                  {user && (
                    <div className="flex justify-center mb-4">
                      <AvatarUpload userId={user.id} type={role || 'freelancer'} name={nome || '?'} size={80} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      placeholder={isFreelancer ? "João da Silva" : "Restaurante Sabor & Arte"} 
                      value={nome} 
                      onChange={e => setNome(e.target.value)} 
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* STEP 2 FREELANCER: Location */}
              {isFreelancer && step === 2 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Onde você mora?</h2>
                    <p className="text-muted-foreground text-sm mt-1">Isso ajuda a encontrar vagas perto de você.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input 
                      placeholder="Ex: São Paulo, SP" 
                      value={cidade} 
                      onChange={e => setCidade(e.target.value)} 
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* STEP 3 FREELANCER: Functions */}
              {isFreelancer && step === 3 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">O que você faz?</h2>
                    <p className="text-muted-foreground text-sm mt-1">Selecione suas especialidades (pode ser mais de uma).</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {FUNCOES_LIST.map((f) => {
                      const Icon = f.icon;
                      const selected = funcoes.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFuncao(f.id)}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-colors min-h-[72px] justify-center',
                            selected ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-secondary text-muted-foreground hover:border-foreground/30'
                          )}
                        >
                          <Icon className={cn("h-5 w-5", selected ? "text-accent" : "text-muted-foreground")} />
                          <span className="text-[10px] font-medium leading-tight">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2 COMPANY: Document & Location */}
              {!isFreelancer && step === 2 && (
                <div className="space-y-6 flex-1">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Detalhes do Estabelecimento</h2>
                    <p className="text-muted-foreground text-sm mt-1">Preencha os dados fiscais e de localização.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input 
                        placeholder="00.000.000/0000-00" 
                        value={cnpj} 
                        onChange={e => setCnpj(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input 
                        placeholder="Ex: Rio de Janeiro, RJ" 
                        value={cidade} 
                        onChange={e => setCidade(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="flex gap-3 pt-6 mt-auto border-t">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={loading} className="w-1/3">
                Voltar
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button 
                onClick={nextStep} 
                className={step === 1 ? 'w-full' : 'w-2/3'}
                disabled={(step === 1 && nome.trim().length < 3) || (step === 2 && isFreelancer && cidade.trim().length < 3)}
              >
                Continuar
              </Button>
            ) : (
              <Button 
                onClick={handleFinish} 
                className="flex-1" 
                disabled={loading || (isFreelancer && funcoes.length === 0) || (!isFreelancer && (cnpj.trim().length < 14 || cidade.trim().length < 3))}
              >
                {loading ? 'Finalizando...' : 'Concluir Perfil'}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
