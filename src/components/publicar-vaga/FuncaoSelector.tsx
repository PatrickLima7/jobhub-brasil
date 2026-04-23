import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const FUNCOES = [
  { id: 'Garçom', label: 'Garçom', emoji: '🍽️' },
  { id: 'Cumim', label: 'Cumim', emoji: '🍜' },
  { id: 'Bartender', label: 'Bartender', emoji: '🍹' },
  { id: 'Auxiliar de Cozinha', label: 'Auxiliar de Cozinha', emoji: '🥘' },
  { id: 'Cozinheiro', label: 'Cozinheiro', emoji: '👨‍🍳' },
  { id: 'Churrasqueiro', label: 'Churrasqueiro', emoji: '🔥' },
  { id: 'Caixa', label: 'Caixa', emoji: '💰' },
  { id: 'Recepcionista', label: 'Recepcionista', emoji: '🤝' },
  { id: 'Freelancer Geral', label: 'Freelancer Geral', emoji: '⚡' },
];

interface FuncaoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function FuncaoSelector({ value, onChange }: FuncaoSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-muted-foreground">Função</label>
      <div className="grid grid-cols-3 gap-2">
        {FUNCOES.map((f) => (
          <motion.button
            key={f.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(f.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors min-h-[72px] justify-center',
              value === f.id
                ? 'border-accent bg-accent/10 text-foreground'
                : 'border-border bg-secondary text-muted-foreground hover:border-foreground/30'
            )}
          >
            <span className="text-xl">{f.emoji}</span>
            <span className="text-xs font-medium leading-tight">{f.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
