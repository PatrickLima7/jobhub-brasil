import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useToast } from '@/hooks/use-toast';

const FUNCOES = ['Garçom', 'Garçonete', 'Bartender', 'Cozinheiro', 'Auxiliar de Cozinha', 'Recepcionista', 'Copeiro', 'Outros'];
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function MeuPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nome: '', cpf: '', telefone: '', cidade: '', estado: '',
    funcoes: [] as string[], experiencia: 0, bio: '', disponibilidade: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('freelancer_profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome ?? '', cpf: data.cpf ?? '', telefone: data.telefone ?? '',
            cidade: data.cidade ?? '', estado: data.estado ?? '',
            funcoes: data.funcoes ?? [], experiencia: data.experiencia ?? 0,
            bio: data.bio ?? '', disponibilidade: data.disponibilidade ?? [],
          });
        }
        setLoading(false);
      });
  }, [user]);

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('freelancer_profiles')
        .update({ ...form, updated_at: new Date().toISOString() })
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
          {/* Avatar upload */}
          {user && (
            <div className="flex justify-center mb-2">
              <AvatarUpload
                userId={user.id}
                type="freelancer"
                name={form.nome || 'F'}
                size={80}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Nome completo</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
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
                  onClick={() => setForm(prev => ({ ...prev, funcoes: toggleArray(prev.funcoes, f) }))}
                  className={`inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    form.funcoes.includes(f)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:bg-secondary'
                  }`}
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

          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-muted-foreground">Disponibilidade</Label>
            <div className="flex flex-wrap gap-4">
              {DIAS.map((dia) => (
                <div key={dia} className="flex items-center space-x-2">
                  <Checkbox
                    id={dia}
                    checked={form.disponibilidade.includes(dia)}
                    onCheckedChange={() => setForm(f => ({ ...f, disponibilidade: toggleArray(f.disponibilidade, dia) }))}
                  />
                  <Label htmlFor={dia} className="text-sm cursor-pointer">{dia}</Label>
                </div>
              ))}
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
