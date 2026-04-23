import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DataHorarioBlockProps {
  dataEvento: Date | undefined;
  onDataChange: (date: Date | undefined) => void;
  horarioInicio: string;
  horarioFim: string;
  onHorarioInicioChange: (v: string) => void;
  onHorarioFimChange: (v: string) => void;
}

const ATALHOS = [
  { label: 'Almoço', inicio: '11:00', fim: '15:00' },
  { label: 'Jantar', inicio: '18:00', fim: '23:00' },
  { label: 'Evento completo', inicio: '10:00', fim: '02:00' },
];

export function DataHorarioBlock({
  dataEvento, onDataChange, horarioInicio, horarioFim,
  onHorarioInicioChange, onHorarioFimChange,
}: DataHorarioBlockProps) {
  const applyAtalho = (a: typeof ATALHOS[number]) => {
    onHorarioInicioChange(a.inicio);
    onHorarioFimChange(a.fim);
  };

  return (
    <div className="space-y-3">
      <label className="text-[13px] font-medium text-muted-foreground">Data e horário</label>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn('w-full justify-start text-left font-normal bg-secondary', !dataEvento && 'text-muted-foreground')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dataEvento ? format(dataEvento, "dd/MM/yyyy", { locale: ptBR }) : '📅 Selecione a data'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dataEvento} onSelect={onDataChange} className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">⏰ Início</label>
          <Input type="time" value={horarioInicio} onChange={(e) => onHorarioInicioChange(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">⏰ Fim</label>
          <Input type="time" value={horarioFim} onChange={(e) => onHorarioFimChange(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ATALHOS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => applyAtalho(a)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-md border transition-colors',
              horarioInicio === a.inicio && horarioFim === a.fim
                ? 'border-accent bg-accent/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
