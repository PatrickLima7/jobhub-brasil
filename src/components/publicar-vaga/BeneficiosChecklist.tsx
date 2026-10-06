import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface BeneficiosChecklistProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  showOutro?: boolean;
}

export function BeneficiosChecklist({ options, value, onChange, showOutro = false }: BeneficiosChecklistProps) {
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
    <div className="space-y-2.5">
      {options.map((b) => (
        <label key={b} className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={value.includes(b)} onCheckedChange={() => toggle(b)} />
          <span className="text-sm">{b}</span>
        </label>
      ))}
      {showOutro && (
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
      )}
    </div>
  );
}
