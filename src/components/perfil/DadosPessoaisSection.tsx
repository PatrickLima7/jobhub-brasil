import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ESCOLARIDADES, GENEROS, PerfilData } from './types';

interface Props {
  form: PerfilData;
  setForm: React.Dispatch<React.SetStateAction<PerfilData>>;
}

const inputCls = 'bg-[#F7F7F7] border-[#E5E5E5]';

export function DadosPessoaisSection({ form, setForm }: Props) {
  const set = <K extends keyof PerfilData>(k: K, v: PerfilData[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5 pt-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome completo *">
          <Input className={inputCls} value={form.nome} onChange={e => set('nome', e.target.value)} />
        </Field>
        <Field label="Nome social (opcional)">
          <Input className={inputCls} value={form.nome_social} onChange={e => set('nome_social', e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2">
        <Label className="text-[13px] font-medium text-muted-foreground">Como se identifica *</Label>
        <div className="flex flex-wrap gap-2">
          {GENEROS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => set('genero', g)}
              className={cn(
                'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
                form.genero === g
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-white text-foreground border-[#E5E5E5] hover:bg-[#F7F7F7]',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Cidade onde nasceu">
          <Input className={inputCls} value={form.cidade_nascimento} onChange={e => set('cidade_nascimento', e.target.value)} />
        </Field>
        <Field label="Cidade onde reside *">
          <Input className={inputCls} value={form.cidade} onChange={e => set('cidade', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Estado">
          <Input className={inputCls} value={form.estado} onChange={e => set('estado', e.target.value)} />
        </Field>
        <Field label="Data de nascimento">
          <Input type="date" className={inputCls} value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="CPF">
          <Input className={inputCls} placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
        </Field>
        <Field label="Telefone (WhatsApp)">
          <Input className={inputCls} value={form.telefone} onChange={e => set('telefone', e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2">
        <Label className="text-[13px] font-medium text-muted-foreground">Escolaridade *</Label>
        <div className="flex flex-wrap gap-2">
          {ESCOLARIDADES.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => set('escolaridade', e)}
              className={cn(
                'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
                form.escolaridade === e
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-white text-foreground border-[#E5E5E5] hover:bg-[#F7F7F7]',
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
