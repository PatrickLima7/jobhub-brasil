import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FUNCOES, NivelExperiencia, PerfilData } from './types';

interface Props {
  form: PerfilData;
  setForm: React.Dispatch<React.SetStateAction<PerfilData>>;
}

const NIVEIS: { value: NivelExperiencia; label: string }[] = [
  { value: 'nada', label: 'Não sei nada' },
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'experiente', label: 'Experiente' },
];

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;
const DIAS_LABELS: Record<string, string> = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
const PERIODOS = ['diurno', 'noturno'] as const;

export function CompatibilidadeSection({ form, setForm }: Props) {
  const set = <K extends keyof PerfilData>(k: K, v: PerfilData[K]) => setForm(f => ({ ...f, [k]: v }));

  const toggleFuncao = (f: string) => {
    setForm(prev => {
      const has = prev.funcoes.includes(f);
      const funcoes = has ? prev.funcoes.filter(x => x !== f) : [...prev.funcoes, f];
      const niveis = { ...prev.niveis_experiencia };
      if (has) delete niveis[f];
      return { ...prev, funcoes, niveis_experiencia: niveis };
    });
  };

  const setNivel = (funcao: string, nivel: NivelExperiencia) => {
    if (nivel === 'nada') {
      toast.warning("Essa opção pode afastar contratantes. Considere marcar 'Iniciante'.");
    }
    setForm(prev => ({ ...prev, niveis_experiencia: { ...prev.niveis_experiencia, [funcao]: nivel } }));
  };

  const toggleArr = (key: 'uniforme_pecas' | 'sistemas_digitais' | 'tipos_trabalho', value: string) => {
    setForm(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const togglePeriodo = (dia: string, periodo: string) => {
    setForm(prev => {
      const current = prev.disponibilidade[dia] ?? [];
      const updated = current.includes(periodo) ? current.filter(p => p !== periodo) : [...current, periodo];
      const next = { ...prev.disponibilidade };
      if (updated.length === 0) delete next[dia]; else next[dia] = updated;
      return { ...prev, disponibilidade: next };
    });
  };

  return (
    <div className="space-y-6 pt-3">
      {/* A — Funções e nível */}
      <div className="space-y-3">
        <div>
          <Label className="text-[13px] font-semibold text-foreground">Funções que você exerce</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {FUNCOES.map(f => (
            <button key={f} type="button" onClick={() => toggleFuncao(f)}
              className={cn(
                'inline-flex rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
                form.funcoes.includes(f)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-white text-foreground border-[#E5E5E5] hover:bg-[#F7F7F7]',
              )}>
              {f}
            </button>
          ))}
        </div>

        {form.funcoes.length > 0 && (
          <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-3 space-y-3">
            <p className="text-[12px] font-medium text-muted-foreground">Nível de experiência por função</p>
            {form.funcoes.map(f => (
              <div key={f} className="space-y-1.5">
                <div className="text-[12px] font-medium">{f}</div>
                <div className="flex flex-wrap gap-1.5">
                  {NIVEIS.map(n => (
                    <button key={n.value} type="button" onClick={() => setNivel(f, n.value)}
                      className={cn(
                        'inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors',
                        form.niveis_experiencia[f] === n.value
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-white text-foreground border-[#E5E5E5] hover:bg-white',
                      )}>
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disponibilidade */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Disponibilidade</Label>
        <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-3 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-12" />
                {PERIODOS.map(p => (
                  <th key={p} className="text-center text-[12px] font-medium text-muted-foreground py-1 capitalize">
                    {p === 'diurno' ? 'Diurno' : 'Noturno'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS.map(dia => (
                <tr key={dia}>
                  <td className="text-[12px] font-medium text-muted-foreground py-1 pr-2">{DIAS_LABELS[dia]}</td>
                  {PERIODOS.map(periodo => {
                    const active = (form.disponibilidade[dia] ?? []).includes(periodo);
                    return (
                      <td key={periodo} className="text-center py-1 px-1">
                        <button type="button" onClick={() => togglePeriodo(dia, periodo)}
                          className={cn(
                            'min-w-[60px] h-9 rounded-md text-[12px] font-medium border transition-colors',
                            active
                              ? 'bg-foreground text-background border-foreground'
                              : 'bg-white text-muted-foreground border-[#E5E5E5]',
                          )}>
                          {active ? '✓' : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* B — Uniforme */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Você possui uniforme completo?</Label>
        <RadioPills
          value={form.uniforme_status}
          onChange={v => set('uniforme_status', v)}
          options={[
            { value: 'completo', label: 'Sim, completo' },
            { value: 'parcial', label: 'Parcial' },
            { value: 'nao', label: 'Não tenho' },
          ]}
        />
        {(form.uniforme_status === 'completo' || form.uniforme_status === 'parcial') && (
          <div className="space-y-2 pt-2 pl-1">
            {['Camisa social', 'Calça preta', 'Sapato apropriado'].map(p => (
              <CheckboxRow key={p} label={p}
                checked={form.uniforme_pecas.includes(p)}
                onChange={() => toggleArr('uniforme_pecas', p)} />
            ))}
          </div>
        )}
        {form.uniforme_status === 'nao' && (
          <CheckboxRow label="Preciso de apoio logístico para uniforme"
            checked={form.uniforme_apoio} onChange={() => set('uniforme_apoio', !form.uniforme_apoio)} />
        )}
      </div>

      {/* C — Transporte */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Como você chega ao estabelecimento?</Label>
        <RadioPills
          value={form.transporte_tipo}
          onChange={v => set('transporte_tipo', v)}
          options={[
            { value: 'proprio', label: 'Tenho transporte próprio' },
            { value: 'publico', label: 'Uso transporte público' },
            { value: 'apoio', label: 'Preciso de carona/apoio' },
          ]}
        />
        {form.transporte_tipo === 'apoio' && (
          <CheckboxRow label="Estabelecimento deve ajudar com transporte"
            checked={form.transporte_apoio} onChange={() => set('transporte_apoio', !form.transporte_apoio)} />
        )}
      </div>

      {/* D — Sistemas digitais */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Experiência com sistemas de trabalho</Label>
        <div className="space-y-1.5">
          {[
            'Trabalho com PDV / sistema de caixa',
            'Trabalho com aplicativos de delivery',
            'Trabalho com comanda eletrônica',
            'Trabalho com sistemas de reserva',
          ].map(s => (
            <CheckboxRow key={s} label={s}
              checked={form.sistemas_digitais.includes(s)}
              onChange={() => toggleArr('sistemas_digitais', s)} />
          ))}
        </div>
      </div>

      {/* E — Comissão */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Você prefere vagas com comissão?</Label>
        <RadioPills
          value={form.preferencia_comissao}
          onChange={v => set('preferencia_comissao', v)}
          options={[
            { value: 'sim', label: 'Sim, prefiro com comissão' },
            { value: 'tanto-faz', label: 'Tanto faz' },
            { value: 'fixo', label: 'Prefiro valor fixo' },
          ]}
        />
      </div>

      {/* F — Tipos de trabalho */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Que tipo de trabalho você aceita?</Label>
        <div className="space-y-1.5">
          {[
            'Diária pontual (um dia)',
            'Trabalhos contínuos / rotina',
            'Eventos grandes',
            'Finais de semana (turno noturno)',
            'Madrugada / trabalho até tarde',
          ].map(t => (
            <CheckboxRow key={t} label={t}
              checked={form.tipos_trabalho.includes(t)}
              onChange={() => toggleArr('tipos_trabalho', t)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RadioPills({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
            value === o.value
              ? 'bg-foreground text-background border-foreground'
              : 'bg-white text-foreground border-[#E5E5E5] hover:bg-[#F7F7F7]',
          )}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-[13px]">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
