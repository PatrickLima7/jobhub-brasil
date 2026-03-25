import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FUNCOES = ['Garçom', 'Garçonete', 'Bartender', 'Auxiliar de Cozinha', 'Auxiliar Geral', 'Recepcionista'];
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
const DIAS_LABELS: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
const PERIODOS = ['diurno', 'noturno'] as const;

type DisponibilidadeGrid = Record<string, string[]>;

function calcAge(dateStr: string): number {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function MeuPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nome: '', cpf: '', telefone: '', cidade: '', estado: '',
    funcoes: [] as string[], experiencia: 0, bio: '',
    data_nascimento: '',
  });
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeGrid>({});

  useEffect(() => {
    if (!user) return;
    supabase.from('freelancer_profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          // Parse disponibilidade - could be old array format or new JSON object
          let dispGrid: DisponibilidadeGrid = {};
          if (data.disponibilidade) {
            if (Array.isArray(data.disponibilidade) && data.disponibilidade.length > 0) {
              if (typeof data.disponibilidade[0] === 'string' && !data.disponibilidade[0].startsWith('{')) {
                // Old format: simple day strings like ["Seg", "Ter"]
                // Convert to new grid with empty periods
                data.disponibilidade.forEach((d: string) => {
                  const key = d.toLowerCase().replace('á', 'a');
                  dispGrid[key] = ['diurno', 'noturno'];
                });
              } else {
                // Try parsing as JSON string
                try {
                  dispGrid = JSON.parse(data.disponibilidade[0]);
                } catch {
                  dispGrid = {};
                }
              }
            }
          }

          setForm({
            nome: data.nome ?? '', cpf: data.cpf ?? '', telefone: data.telefone ?? '',
            cidade: data.cidade ?? '', estado: data.estado ?? '',
            funcoes: data.funcoes ?? [], experiencia: data.experiencia ?? 0,
            bio: data.bio ?? '',
            data_nascimento: (data as Record<string, unknown>).data_nascimento as string ?? '',
          });
          setDisponibilidade(dispGrid);
        }
        setLoading(false);
      });
  }, [user]);

  const toggleFuncao = (f: string) => {
    setForm(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(f) ? prev.funcoes.filter(x => x !== f) : [...prev.funcoes, f],
    }));
  };

  const togglePeriodo = (dia: string, periodo: string) => {
    setDisponibilidade(prev => {
      const current = prev[dia] ?? [];
      const updated = current.includes(periodo)
        ? current.filter(p => p !== periodo)
        : [...current, periodo];
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[dia];
      } else {
        next[dia] = updated;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      // Store disponibilidade as JSON string in the array field
      const dispArray = [JSON.stringify(disponibilidade)];
      const { error } = await supabase.from('freelancer_profiles')
        .update({
          ...form,
          disponibilidade: dispArray,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Perfil salvo!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-display mb-8">Meu Perfil</h1>
      <div className="border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {user && (
            <div className="flex justify-center mb-2">
              <AvatarUpload userId={user.id} type="freelancer" name={form.nome || 'F'} size={80} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Nome completo</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Data de nascimento</Label>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={form.data_nascimento}
                onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))}
                className="flex-1"
              />
              {form.data_nascimento && (
                <span className="text-[13px] text-muted-foreground whitespace-nowrap">
                  {calcAge(form.data_nascimento)} anos
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">CPF</Label>
              <Input placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Telefone (WhatsApp)</Label>
              <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Cidade</Label>
              <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Estado</Label>
              <Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-muted-foreground">Funções que exerce</Label>
            <div className="flex flex-wrap gap-2">
              {FUNCOES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFuncao(f)}
                  className={cn(
                    'inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer',
                    form.funcoes.includes(f)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:bg-secondary'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Anos de experiência</Label>
            <Input type="number" min="0" value={form.experiencia} onChange={e => setForm(f => ({ ...f, experiencia: parseInt(e.target.value) || 0 }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Mini bio</Label>
            <Textarea className="bg-secondary border-input focus-visible:border-foreground focus-visible:bg-background" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte um pouco sobre você..." />
          </div>

          {/* Availability grid */}
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-muted-foreground">Disponibilidade</Label>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-12" />
                    {PERIODOS.map(p => (
                      <th key={p} className="text-center text-[12px] font-medium text-muted-foreground py-2 capitalize">
                        {p === 'diurno' ? 'Diurno' : 'Noturno'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIAS.map(dia => (
                    <tr key={dia}>
                      <td className="text-[12px] font-medium text-muted-foreground py-1 pr-2">
                        {DIAS_LABELS[dia]}
                      </td>
                      {PERIODOS.map(periodo => {
                        const active = (disponibilidade[dia] ?? []).includes(periodo);
                        return (
                          <td key={periodo} className="text-center py-1 px-1">
                            <button
                              type="button"
                              onClick={() => togglePeriodo(dia, periodo)}
                              className={cn(
                                'min-w-[60px] h-10 rounded-md text-[12px] font-medium transition-colors duration-150 border',
                                active
                                  ? 'bg-foreground text-background border-foreground'
                                  : 'bg-secondary text-muted-foreground border-border hover:bg-background'
                              )}
                            >
                              {active ? '✓' : '—'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button type="submit" className="w-full btn-press" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </form>
      </div>
    </div>
  );
}
