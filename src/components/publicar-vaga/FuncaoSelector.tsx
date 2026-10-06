import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  UtensilsCrossed, 
  Soup, 
  Wine, 
  ChefHat, 
  Flame, 
  Banknote, 
  Handshake, 
  Zap,
  Coffee
} from 'lucide-react';

const FUNCOES = [
  { id: 'Garçom', label: 'Garçom', icon: UtensilsCrossed },
  { id: 'Cumim', label: 'Cumim', icon: Coffee },
  { id: 'Bartender', label: 'Bartender', icon: Wine },
  { id: 'Auxiliar de Cozinha', label: 'Auxiliar de Cozinha', icon: Soup },
  { id: 'Cozinheiro', label: 'Cozinheiro', icon: ChefHat },
  { id: 'Churrasqueiro', label: 'Churrasqueiro', icon: Flame },
  { id: 'Caixa', label: 'Caixa', icon: Banknote },
  { id: 'Recepcionista', label: 'Recepcionista', icon: Handshake },
  { id: 'Freelancer Geral', label: 'Freelancer Geral', icon: Zap },
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
        {FUNCOES.map((f) => {
          const Icon = f.icon;
          return (
            <motion.button
              key={f.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange(f.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors min-h-[72px] justify-center',
                value === f.id
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-secondary text-muted-foreground hover:border-foreground/30'
              )}
            >
              <Icon className={cn("h-5 w-5", value === f.id ? "text-accent" : "text-muted-foreground")} />
              <span className="text-xs font-medium leading-tight">{f.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
