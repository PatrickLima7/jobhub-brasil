import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertBanner } from '@/components/AlertBanner';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';

export default function PublicarVaga() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkCompanyProfile } = useSystemAlerts();
  const [submitting, setSubmitting] = useState(false);
  const [funcao, setFuncao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState<Date>();
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [valor, setValor] = useState('');
  const [incluirVT, setIncluirVT] = useState(false);
  const [valorVT, setValorVT] = useState('');
  const [numVagas, setNumVagas] = useState('1');
  const [requisitos, setRequisitos] = useState('');
  const [profileAlert, setProfileAlert] = useState('');

  const valorNum = parseFloat(valor) || 0;
  const vtNum = incluirVT ? (parseFloat(valorVT) || 0) : 0;
  const total = valorNum + vtNum;
  const taxa = total * 0.22;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dataEvento) return;

    const profileCheck = await checkCompanyProfile(user.id);
    if (!profileCheck.valid) {
      setProfileAlert(profileCheck.message);
      return;
    }
    setProfileAlert('');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        company_id: user.id,
        funcao,
        descricao,
        data_evento: format(dataEvento, 'yyyy-MM-dd'),
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        valor: valorNum,
        vale_transporte: vtNum,
        num_vagas: parseInt(numVagas) || 1,
        requisitos: requisitos || null,
      });
      if (error) throw error;
      toast({ title: 'Vaga publicada com sucesso!' });
      setFuncao(''); setDescricao(''); setDataEvento(undefined); setHorarioInicio('');
      setHorarioFim(''); setValor(''); setIncluirVT(false); setValorVT(''); setNumVagas('1'); setRequisitos('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-display mb-8">Publicar Vaga</h1>

      {profileAlert && (
        <div className="mb-6">
          <AlertBanner message={profileAlert} linkTo="/empresa/perfil" linkLabel="Completar perfil" />
        </div>
      )}

      <div className="border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Função</Label>
            <Input placeholder="Ex: Garçom, Bartender" value={funcao} onChange={e => setFuncao(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Descrição da vaga</Label>
            <Textarea className="bg-secondary border-input focus-visible:border-foreground focus-visible:bg-background min-h-[100px]" placeholder="Descreva a vaga..." value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Data do evento/serviço</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal bg-secondary', !dataEvento && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataEvento ? format(dataEvento, "dd/MM/yyyy", { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dataEvento} onSelect={setDataEvento} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Horário de início</Label>
              <Input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-muted-foreground">Horário de fim</Label>
              <Input type="time" value={horarioFim} onChange={e => setHorarioFim(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Valor fixo da vaga</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="pl-10"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Vale transporte toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[13px] font-medium text-muted-foreground">Incluir vale transporte?</Label>
              <Switch checked={incluirVT} onCheckedChange={setIncluirVT} />
            </div>

            {incluirVT && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-muted-foreground">Valor do vale transporte</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    placeholder="0,00"
                    value={valorVT}
                    onChange={e => setValorVT(e.target.value)}
                  />
                </div>
              </div>
            )}

            {incluirVT && (valorNum > 0 || vtNum > 0) && (
              <div className="bg-secondary border rounded-lg p-4 space-y-1.5 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Valor da vaga:</span>
                  <span>R$ {valorNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Vale transporte:</span>
                  <span>R$ {vtNum.toFixed(2)}</span>
                </div>
                <div className="border-t border-border my-1.5" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total da contratação:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-accent">
                  <span>Taxa TôLivre (22%):</span>
                  <span>R$ {taxa.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Número de vagas</Label>
            <Input type="number" min="1" value={numVagas} onChange={e => setNumVagas(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Requisitos (opcional)</Label>
            <Textarea className="bg-secondary border-input focus-visible:border-foreground focus-visible:bg-background" placeholder="Requisitos..." value={requisitos} onChange={e => setRequisitos(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Publicando...' : 'Publicar Vaga'}
          </Button>
        </form>
      </div>
    </div>
  );
}
