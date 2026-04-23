import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, AlertTriangle, Gem, Rocket, CheckCircle } from 'lucide-react';

interface ConversionBlockProps {
  isCLT: boolean;
  submitting: boolean;
  destaque: boolean;
  urgente: boolean;
  onDestaqueChange: (v: boolean) => void;
  onUrgenteChange: (v: boolean) => void;
}

export function ConversionBlock({
  isCLT, submitting, destaque, urgente,
  onDestaqueChange, onUrgenteChange,
}: ConversionBlockProps) {
  return (
    <div className="space-y-4">
      <div className="bg-secondary border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Rocket className="h-4 w-4 text-accent" />
          {isCLT
            ? 'Sua vaga CLT será publicada para candidatos da sua região.'
            : 'Sua vaga será enviada para profissionais disponíveis na sua região.'}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" />{isCLT ? 'Processo simples' : 'Mais rápido'}</span>
          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" />{isCLT ? 'Profissionais qualificados' : 'Sem burocracia'}</span>
          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" />{isCLT ? 'Contato direto' : 'Profissionais avaliados'}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className={isCLT
          ? 'w-full bg-blue-600 hover:bg-blue-700 text-white'
          : 'w-full bg-green-600 hover:bg-green-700 text-white'}
      >
        {submitting ? 'Publicando...' : isCLT ? 'PUBLICAR VAGA CLT' : 'PUBLICAR VAGA'}
      </Button>

      {!isCLT && (
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-3 cursor-pointer text-sm text-muted-foreground">
            <Checkbox checked={destaque} onCheckedChange={(c) => onDestaqueChange(!!c)} />
            <Star className="h-4 w-4 text-accent" />
            Destacar vaga
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-sm text-muted-foreground">
            <Checkbox checked={urgente} onCheckedChange={(c) => onUrgenteChange(!!c)} />
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Marcar como Urgente
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-sm text-muted-foreground opacity-50">
            <Checkbox disabled />
            <Gem className="h-4 w-4" />
            Solicitar Profissional Premium (em breve)
          </label>
        </div>
      )}
    </div>
  );
}
