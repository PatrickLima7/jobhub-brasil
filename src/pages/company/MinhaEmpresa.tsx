import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useToast } from '@/hooks/use-toast';

// ─── CNPJ utilities ────────────────────────────────────────────────────────────
function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // all same digit

  const calcDigit = (str: string, weights: number[]) => {
    const sum = str.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(digits.slice(0, 12), w1);
  const d2 = calcDigit(digits.slice(0, 13), w2);

  return parseInt(digits[12]) === d1 && parseInt(digits[13]) === d2;
}

// ─── CEP utilities ──────────────────────────────────────────────────────────────
function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function MinhaEmpresa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
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

  const handleCNPJChange = (raw: string) => {
    const masked = maskCNPJ(raw);
    setForm(f => ({ ...f, cnpj: masked }));
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 14) {
      setCnpjError(validateCNPJ(masked) ? '' : 'CNPJ inválido. Verifique os dígitos.');
    } else {
      setCnpjError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate CNPJ before saving
    const cnpjDigits = form.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length > 0 && !validateCNPJ(form.cnpj)) {
      setCnpjError('CNPJ inválido. Verifique os dígitos.');
      toast({ title: 'CNPJ inválido', description: 'Corrija o CNPJ antes de salvar.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('company_profiles')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Perfil atualizado! ✅' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <div className="border rounded-lg p-6 space-y-4">
          {[0,1,2,3].map(i => <div key={i} className="h-10 rounded skeleton-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-display mb-8">Minha Empresa</h1>
      <div className="border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar upload */}
          {user && (
            <div className="flex justify-center mb-2">
              <AvatarUpload
                userId={user.id}
                type="company"
                name={form.nome || 'E'}
                size={80}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Nome da empresa</Label>
            <Input value={form.nome} onChange={e => updateField('nome', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">CNPJ</Label>
            <Input
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={e => handleCNPJChange(e.target.value)}
              inputMode="numeric"
              className={cnpjError ? 'border-destructive focus-visible:border-destructive' : ''}
            />
            {cnpjError && <p className="text-[12px] text-destructive">{cnpjError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Tipo de estabelecimento</Label>
            <Select value={form.tipo} onValueChange={v => updateField('tipo', v)}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="restaurante">Restaurante</SelectItem>
                <SelectItem value="buffet">Buffet</SelectItem>
                <SelectItem value="lanchonete">Lanchonete</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Telefone</Label>
              <Input
                value={form.telefone}
                onChange={e => updateField('telefone', maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">E-mail comercial</Label>
              <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Rua</Label>
              <Input value={form.endereco_rua} onChange={e => updateField('endereco_rua', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Número</Label>
              <Input value={form.endereco_numero} onChange={e => updateField('endereco_numero', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Bairro</Label>
              <Input value={form.endereco_bairro} onChange={e => updateField('endereco_bairro', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Cidade</Label>
              <Input value={form.endereco_cidade} onChange={e => updateField('endereco_cidade', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Estado</Label>
              <Input
                value={form.endereco_estado}
                onChange={e => updateField('endereco_estado', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">CEP</Label>
            <Input
              value={form.endereco_cep}
              onChange={e => updateField('endereco_cep', maskCEP(e.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Descrição</Label>
            <Textarea
              className="bg-secondary border-input focus-visible:border-foreground focus-visible:bg-background"
              value={form.descricao}
              onChange={e => updateField('descricao', e.target.value)}
              placeholder="Conte um pouco sobre seu estabelecimento..."
            />
          </div>

          <Button type="submit" className="w-full btn-press" disabled={submitting || !!cnpjError}>
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </div>
    </div>
  );
}
