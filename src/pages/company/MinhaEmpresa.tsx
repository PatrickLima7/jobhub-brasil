import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function MinhaEmpresa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nome: '', cnpj: '', tipo: '', telefone: '', email: '',
    endereco_rua: '', endereco_numero: '', endereco_bairro: '',
    endereco_cidade: '', endereco_estado: '', endereco_cep: '', descricao: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('company_profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            nome: data.nome ?? '', cnpj: data.cnpj ?? '', tipo: data.tipo ?? '',
            telefone: data.telefone ?? '', email: data.email ?? '',
            endereco_rua: data.endereco_rua ?? '', endereco_numero: data.endereco_numero ?? '',
            endereco_bairro: data.endereco_bairro ?? '', endereco_cidade: data.endereco_cidade ?? '',
            endereco_estado: data.endereco_estado ?? '', endereco_cep: data.endereco_cep ?? '',
            descricao: data.descricao ?? '',
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('company_profiles')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Perfil atualizado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Minha Empresa</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input value={form.nome} onChange={e => updateField('nome', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => updateField('cnpj', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de estabelecimento</Label>
              <Select value={form.tipo} onValueChange={v => updateField('tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="restaurante">Restaurante</SelectItem>
                  <SelectItem value="buffet">Buffet</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => updateField('telefone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail comercial</Label>
                <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rua</Label>
                <Input value={form.endereco_rua} onChange={e => updateField('endereco_rua', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={form.endereco_numero} onChange={e => updateField('endereco_numero', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={form.endereco_bairro} onChange={e => updateField('endereco_bairro', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.endereco_cidade} onChange={e => updateField('endereco_cidade', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={form.endereco_estado} onChange={e => updateField('endereco_estado', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={form.endereco_cep} onChange={e => updateField('endereco_cep', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => updateField('descricao', e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
