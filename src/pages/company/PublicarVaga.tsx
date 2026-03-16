import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PublicarVaga() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [funcao, setFuncao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState<Date>();
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [valor, setValor] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState('diaria');
  const [numVagas, setNumVagas] = useState('1');
  const [requisitos, setRequisitos] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dataEvento) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        company_id: user.id,
        funcao,
        descricao,
        data_evento: format(dataEvento, 'yyyy-MM-dd'),
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        valor: parseFloat(valor) || 0,
        tipo_pagamento: tipoPagamento,
        num_vagas: parseInt(numVagas) || 1,
        requisitos: requisitos || null,
      });
      if (error) throw error;
      toast({ title: 'Vaga publicada com sucesso!' });
      setFuncao(''); setDescricao(''); setDataEvento(undefined); setHorarioInicio('');
      setHorarioFim(''); setValor(''); setNumVagas('1'); setRequisitos('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-display mb-8">Publicar Vaga</h1>
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
            <Label className="text-[13px] font-medium text-muted-foreground">Valor ofertado (R$)</Label>
            <Input type="number" step="0.01" min="0" placeholder="150.00" value={valor} onChange={e => setValor(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground">Tipo de pagamento</Label>
            <RadioGroup value={tipoPagamento} onValueChange={setTipoPagamento}>
              <div className="flex gap-4">
                {[['diaria', 'Diária'], ['hora', 'Por hora'], ['combinar', 'A combinar']].map(([v, l]) => (
                  <div key={v} className="flex items-center space-x-2">
                    <RadioGroupItem value={v} id={v} />
                    <Label htmlFor={v} className="text-sm">{l}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
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
