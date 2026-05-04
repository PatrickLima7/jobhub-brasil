import { useState } from 'react';
import { Plus, BookOpen, Clock, MapPin, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Curso, PerfilData } from './types';

interface Props {
  form: PerfilData;
  setForm: React.Dispatch<React.SetStateAction<PerfilData>>;
}

const inputCls = 'bg-[#F7F7F7] border-[#E5E5E5]';
const blank: Omit<Curso, 'id'> = { nome: '', carga_horaria: 0, ano_conclusao: new Date().getFullYear(), instituicao: '' };

export function CursosSection({ form, setForm }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Curso, 'id'>>(blank);

  const startAdd = () => { setDraft(blank); setEditingId(null); setAdding(true); };
  const startEdit = (c: Curso) => { const { id, ...rest } = c; setDraft(rest); setEditingId(id); setAdding(true); };
  const cancel = () => { setAdding(false); setEditingId(null); setDraft(blank); };

  const save = () => {
    if (!draft.nome.trim() || !draft.instituicao.trim()) {
      toast.error('Preencha nome do curso e instituição');
      return;
    }
    if (editingId) {
      setForm(f => ({ ...f, cursos: f.cursos.map(c => c.id === editingId ? { ...draft, id: editingId } : c) }));
      toast.success('Curso atualizado');
    } else {
      setForm(f => ({ ...f, cursos: [...f.cursos, { ...draft, id: crypto.randomUUID() }] }));
      toast.success('Curso adicionado');
    }
    cancel();
  };

  const remove = (id: string) => {
    setForm(f => ({ ...f, cursos: f.cursos.filter(c => c.id !== id) }));
    toast.success('Curso removido');
  };

  const canAdd = form.cursos.length < 3 && !adding;

  return (
    <div className="space-y-3 pt-3">
      {form.cursos.map(c => (
        <div key={c.id} className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0A0A0A]">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="truncate">{c.nome}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {c.carga_horaria}h · {c.ano_conclusao}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {c.instituicao}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => startEdit(c)} className="p-1.5 hover:bg-white rounded-md">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button type="button" onClick={() => remove(c.id)} className="p-1.5 hover:bg-white rounded-md">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {adding && (
        <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">{editingId ? 'Editar curso' : 'Novo curso'}</span>
            <button type="button" onClick={cancel}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Nome do curso</Label>
            <Input className={inputCls} value={draft.nome} onChange={e => setDraft({ ...draft, nome: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Carga horária</Label>
              <Input className={inputCls} type="number" min={0} value={draft.carga_horaria || ''} onChange={e => setDraft({ ...draft, carga_horaria: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">Ano conclusão</Label>
              <Input className={inputCls} type="number" min={1980} max={2100} value={draft.ano_conclusao || ''} onChange={e => setDraft({ ...draft, ano_conclusao: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Local / Instituição</Label>
            <Input className={inputCls} value={draft.instituicao} onChange={e => setDraft({ ...draft, instituicao: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={cancel}>Cancelar</Button>
            <Button type="button" size="sm" onClick={save}>Salvar curso</Button>
          </div>
        </div>
      )}

      {canAdd && (
        <Button type="button" variant="outline" className="w-full border-dashed" onClick={startAdd}>
          <Plus className="h-4 w-4" /> Adicionar curso
        </Button>
      )}
      {form.cursos.length >= 3 && !adding && (
        <p className="text-[12px] text-muted-foreground text-center">Máximo de 3 cursos atingido</p>
      )}
    </div>
  );
}
