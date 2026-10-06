import { CheckCircle2, Circle, AlertCircle, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PerfilData } from './types';

export function computeCompletion(form: PerfilData) {
  const dadosOk = !!(form.nome && form.genero && form.cidade && form.escolaridade);
  const qualOk = form.cursos.length > 0;
  const refOk = form.referencias.length > 0;
  const igOk = !!form.instagram;
  const compatOk = !!(form.funcoes.length && form.uniforme_status && form.transporte_tipo && form.preferencia_comissao);

  const items = [
    { label: 'Dados pessoais', done: dadosOk },
    { label: 'Qualificação', done: qualOk },
    { label: 'Referências', done: refOk },
    { label: 'Instagram', done: igOk, customLabel: igOk ? 'Preenchido' : 'Não preenchido' },
    { label: 'Compatibilidade', done: compatOk },
  ];

  const percent = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return { items, percent, dadosOk, qualOk, refOk, igOk, compatOk };
}

export function ResumoSection({ form }: { form: PerfilData }) {
  const { items, percent } = computeCompletion(form);

  return (
    <div className="space-y-4 pt-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted-foreground">Completude do perfil</span>
          <span className="text-[14px] font-semibold">{percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>

      <div className="border border-[#E5E5E5] rounded-lg p-4 space-y-2">
        {items.map(i => (
          <div key={i.label} className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2">
              {i.done
                ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                : <Circle className="h-4 w-4 text-muted-foreground" />}
              {i.label}
            </span>
            <span className={i.done ? 'text-[#065F46] text-[12px] font-medium' : 'text-muted-foreground text-[12px]'}>
              {i.customLabel ?? (i.done ? 'Completo' : 'Incompleto')}
            </span>
          </div>
        ))}
      </div>

      {percent < 70 && (
        <div className="bg-[#FEF3C7] border-l-[3px] border-[#F59E0B] rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-4 w-4 text-[#92400E] shrink-0 mt-0.5" />
          <div className="text-[13px] text-[#92400E]">
            <p className="font-medium">Complete seu perfil para aparecer nas buscas dos empresários</p>
            <p className="text-[12px] mt-1 opacity-80">Quanto mais completo, mais visibilidade você tem.</p>
          </div>
        </div>
      )}

      {percent >= 80 && (
        <div className="bg-[#D1FAE5] border-l-[3px] border-[#10B981] rounded-lg p-4 flex gap-3">
          <Star className="h-4 w-4 text-[#065F46] shrink-0 mt-0.5 fill-[#F59E0B] text-[#F59E0B]" />
          <div className="text-[13px] text-[#065F46]">
            <p className="font-semibold">Perfil destacado</p>
            <p className="text-[12px] mt-1 opacity-90">Seu perfil aparece em destaque nas buscas dos contratantes.</p>
          </div>
        </div>
      )}
    </div>
  );
}
