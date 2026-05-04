import { useState } from 'react';
import { Plus, Store, Phone, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Referencia, PerfilData } from './types';

interface Props {
  form: PerfilData;
  setForm: React.Dispatch<React.SetStateAction<PerfilData>>;
}

const inputCls = 'bg-[#F7F7F7] border-[#E5E5E5]';
const TIPOS: Referencia['tipo'][] = ['restaurante', 'bar', 'buffet', 'evento', 'outro'];
const TIPO_LABEL: Record<Referencia['tipo'], string> = {
  restaurante: 'Restaurante', bar: 'Bar', buffet: 'Buffet', evento: 'Evento', outro: 'Outro',
};

const blank: Omit<Referencia, 'id'> = {
  estabelecimento: '', tipo: 'restaurante', funcao: '', inicio: '', fim: '',
  contato_nome: '', contato_telefone: '', contato_email: '', comentario: '',
};

function fmtMonth(ym: string): string {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1] ?? ''} ${y}`;
}

export function ReferenciasSection({ form, setForm }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Referencia, 'id'>>(blank);

  const startAdd = () => { setDraft(blank); setEditingId(null); setAdding(true); };
  const startEdit = (r: Referencia) => { const { id, ...rest } = r; setDraft({ ...blank, ...rest }); setEditingId(id); setAdding(true); };
  const cancel = () => { setAdding(false); setEditingId(null); setDraft(blank); };

  const save = () => {
    if (!draft.estabelecimento.trim() || !draft.funcao.trim()) {
      toast.error('Preencha estabelecimento e função');
      return;
    }
    if (editingId) {
      setForm(f => ({ ...f, referencias: f.referencias.map(r => r.id === editingId ? { ...draft, id: editingId } : r) }));
      toast.success('Referência atualizada');
    } else {
      setForm(f => ({ ...f, referencias: [...f.referencias, { ...draft, id: crypto.randomUUID() }] }));
      toast.success('Referência adicionada');
    }
    cancel();
  };

  const remove = (id: string) => {
    setForm(f => ({ ...f, referencias: f.referencias.filter(r => r.id !== id) }));
    toast.success('Referência removida');
  };

  const canAdd = form.referencias.length < 3 && !adding;

  return (
    <div className="space-y-3 pt-3">
      {form.referencias.map(r => (
        <div key={r.id} className="bg-[#F7F7F7] border border-[#E5E5E5] border-l-[3px] border-l-[#F59E0B] rounded-lg p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0A0A0A]">
                <Store className="h-3.5 w-3.5" />
                <span className="truncate">{r.estabelecimento}</span>
                <span className="text-[11px] font-normal text-muted-foreground">· {TIPO_LABEL[r.tipo]}</span>
              </div>
              <div className="text-[12px] text-muted-foreground">Função: {r.funcao}</div>
              {(r.inicio || r.fim) && (
                <div className="text-[12px] text-muted-foreground">
                  Período: {fmtMonth(r.inicio)}{r.fim && ` - ${fmtMonth(r.fim)}`}
                </div>
              )}
              {r.contato_telefone && (
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {r.contato_telefone}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => startEdit(r)} className="p-1.5 hover:bg-white rounded-md">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button type="button" onClick={() => remove(r.id)} className="p-1.5 hover:bg-white rounded-md">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {adding && (
        <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">{editingId ? 'Editar referência' : 'Nova referência'}</span>
            <button type="button" onClick={cancel}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Nome do estabelecimento</Label>
            <Input className={inputCls} value={draft.estabelecimento} onChange={e => setDraft({ ...draft, estabelecimento: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Tipo</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map(t => (
                <button key={t} type="button" onClick={() => setDraft({ ...draft, tipo: t })}
                  className={cn(
                    'inline-flex rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
                    draft.tipo === t
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-white text-foreground border-[#E5E5E5] hover:bg-[#F7F7F7]',
                  )}>
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Função exercida</Label>
            <Input className={inputCls} value={draft.funcao} onChange={e => setDraft({ ...draft, funcao: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">De</Label>
              <Input className={inputCls} type="month" value={draft.inicio} onChange={e => setDraft({ ...draft, inicio: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Até</Label>
              <Input className={inputCls} type="month" value={draft.fim} onChange={e => setDraft({ ...draft, fim: e.target.value })} />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E5E5]">
            <p className="text-[12px] font-medium text-muted-foreground mb-2">Contato para referência (opcional)</p>
            <div className="space-y-2">
              <Input className={inputCls} placeholder="Nome" value={draft.contato_nome ?? ''} onChange={e => setDraft({ ...draft, contato_nome: e.target.value })} />
              <Input className={inputCls} placeholder="Telefone (WhatsApp)" value={draft.contato_telefone ?? ''} onChange={e => setDraft({ ...draft, contato_telefone: e.target.value })} />
              <Input className={inputCls} placeholder="Email" value={draft.contato_email ?? ''} onChange={e => setDraft({ ...draft, contato_email: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Comentário (opcional)</Label>
            <Textarea className={inputCls} placeholder="Descreva brevemente sua experiência lá..."
              value={draft.comentario ?? ''} onChange={e => setDraft({ ...draft, comentario: e.target.value })} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={cancel}>Cancelar</Button>
            <Button type="button" size="sm" onClick={save}>Salvar referência</Button>
          </div>
        </div>
      )}

      {canAdd && (
        <Button type="button" variant="outline" className="w-full border-dashed" onClick={startAdd}>
          <Plus className="h-4 w-4" /> Adicionar referência
        </Button>
      )}
      {form.referencias.length >= 3 && !adding && (
        <p className="text-[12px] text-muted-foreground text-center">Máximo de 3 referências atingido</p>
      )}
    </div>
  );
}
