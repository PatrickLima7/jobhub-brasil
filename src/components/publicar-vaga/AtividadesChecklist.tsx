import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const ATIVIDADES = [
  'Atendimento ao cliente',
  'Organização do salão',
  'Montagem de mesas',
  'Venda de produtos',
  'Apoio à cozinha',
  'Limpeza do ambiente',
  'Produção de alimentos',
];

interface AtividadesChecklistProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function AtividadesChecklist({ value, onChange }: AtividadesChecklistProps) {
  const [outroText, setOutroText] = useState('');
  const outroKey = 'outro:';

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  const hasOutro = value.some((v) => v.startsWith(outroKey));

  const handleOutroToggle = (checked: boolean) => {
    if (checked) {
      onChange([...value, `${outroKey}${outroText}`]);
    } else {
      onChange(value.filter((v) => !v.startsWith(outroKey)));
      setOutroText('');
    }
  };

  const handleOutroText = (text: string) => {
    setOutroText(text);
    const filtered = value.filter((v) => !v.startsWith(outroKey));
    onChange([...filtered, `${outroKey}${text}`]);
  };

  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-muted-foreground">
        O que esse profissional vai fazer?
      </label>
      <div className="space-y-2.5">
        {ATIVIDADES.map((a) => (
          <label key={a} className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={value.includes(a)} onCheckedChange={() => toggle(a)} />
            <span className="text-sm">{a}</span>
          </label>
        ))}
        <div className="flex items-center gap-3">
          <Checkbox checked={hasOutro} onCheckedChange={(c) => handleOutroToggle(!!c)} />
          <span className="text-sm">Outro:</span>
          {hasOutro && (
            <Input
              className="h-8 text-sm flex-1 max-w-[200px]"
              placeholder="Especifique..."
              value={outroText}
              onChange={(e) => handleOutroText(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
