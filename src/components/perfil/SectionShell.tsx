import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'completo' | 'incompleto' | 'recomendado' | 'muito-recomendado';

const statusStyles: Record<StatusVariant, string> = {
  completo: 'bg-[#D1FAE5] text-[#065F46]',
  incompleto: 'bg-[#FEE2E2] text-[#991B1B]',
  recomendado: 'bg-[#FEF3C7] text-[#92400E]',
  'muito-recomendado': 'bg-[#D1FAE5] text-[#065F46]',
};

const statusLabels: Record<StatusVariant, string> = {
  completo: 'Completo',
  incompleto: 'Incompleto',
  recomendado: 'Recomendado',
  'muito-recomendado': 'Muito recomendado',
};

interface Props {
  title: string;
  subtitle?: string;
  status?: StatusVariant;
  statusLabel?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SectionShell({ title, subtitle, status, statusLabel, open, onToggle, children }: Props) {
  return (
    <div
      className={cn(
        'bg-white border rounded-[12px] overflow-hidden transition-colors',
        open ? 'border-[#E5E5E5] border-l-[3px] border-l-[#F59E0B]' : 'border-[#E5E5E5]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] font-semibold text-[#0A0A0A]">{title}</h2>
            {status && (
              <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', statusStyles[status])}>
                {statusLabel ?? statusLabels[status]}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-[#E5E5E5]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
