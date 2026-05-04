import { Instagram, Music2, Linkedin, TrendingUp, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PerfilData } from './types';

interface Props {
  form: PerfilData;
  setForm: React.Dispatch<React.SetStateAction<PerfilData>>;
}

const inputCls = 'bg-[#F7F7F7] border-[#E5E5E5]';

function instaUrl(handle: string) {
  const h = handle.replace(/^@/, '').trim();
  return h ? `https://instagram.com/${h}` : '';
}

export function RedesSociaisSection({ form, setForm }: Props) {
  const set = <K extends keyof PerfilData>(k: K, v: PerfilData[K]) => setForm(f => ({ ...f, [k]: v }));

  const igLink = instaUrl(form.instagram);

  return (
    <div className="space-y-4 pt-3">
      {/* Insight */}
      <div className="bg-[#D1FAE5] border-l-[3px] border-[#10B981] rounded-lg p-4 flex gap-3">
        <TrendingUp className="h-4 w-4 text-[#065F46] shrink-0 mt-0.5" />
        <p className="text-[13px] font-medium text-[#065F46]">
          Profissionais com Instagram recebem 90% mais convites para trabalhar
        </p>
      </div>

      {/* Instagram */}
      <div className="border border-[#E5E5E5] rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-medium flex items-center gap-2">
            <Instagram className="h-4 w-4" /> Instagram
          </Label>
          {form.instagram && (
            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input className={inputCls} placeholder="@seu_usuario" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
          {igLink && (
            <a href={igLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-[#F59E0B] hover:underline shrink-0">
              <ExternalLink className="h-3 w-3" /> Ver
            </a>
          )}
        </div>
      </div>

      {/* TikTok */}
      <div className="border border-[#E5E5E5] rounded-lg p-4 space-y-2">
        <Label className="text-[13px] font-medium flex items-center gap-2">
          <Music2 className="h-4 w-4" /> TikTok <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input className={inputCls} placeholder="@seu_usuario" value={form.tiktok} onChange={e => set('tiktok', e.target.value)} />
      </div>

      {/* LinkedIn */}
      <div className="border border-[#E5E5E5] rounded-lg p-4 space-y-2">
        <Label className="text-[13px] font-medium flex items-center gap-2">
          <Linkedin className="h-4 w-4" /> LinkedIn <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input className={inputCls} placeholder="linkedin.com/in/seu-perfil" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} />
      </div>
    </div>
  );
}
