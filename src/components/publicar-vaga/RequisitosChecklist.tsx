import { BeneficiosChecklist } from './BeneficiosChecklist';

const REQUISITOS_BASE = [
  'Experiência mínima',
  'Já trabalhou em restaurante',
  'Boa comunicação',
  'Agilidade',
  'Saber vender',
];

const REQUISITOS_CLT_EXTRAS = [
  'CNH',
  'Ensino médio completo',
  'Disponibilidade para finais de semana',
];

interface RequisitosChecklistProps {
  value: string[];
  onChange: (value: string[]) => void;
  isCLT?: boolean;
}

export function RequisitosChecklist({ value, onChange, isCLT = false }: RequisitosChecklistProps) {
  const options = isCLT ? [...REQUISITOS_BASE, ...REQUISITOS_CLT_EXTRAS] : REQUISITOS_BASE;

  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-muted-foreground">Requisitos</label>
      <BeneficiosChecklist options={options} value={value} onChange={onChange} showOutro />
    </div>
  );
}
