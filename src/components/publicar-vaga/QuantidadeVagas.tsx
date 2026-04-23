import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface QuantidadeVagasProps {
  value: number;
  onChange: (value: number) => void;
}

export function QuantidadeVagas({ value, onChange }: QuantidadeVagasProps) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-muted-foreground">Quantidade de vagas</label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold w-8 text-center">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
