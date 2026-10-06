import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertBanner } from '@/components/AlertBanner';
import { useToast } from '@/hooks/use-toast';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, Briefcase, MapPin, Loader2 } from 'lucide-react';

import { FuncaoSelector } from '@/components/publicar-vaga/FuncaoSelector';
import { AtividadesChecklist } from '@/components/publicar-vaga/AtividadesChecklist';
import { DataHorarioBlock } from '@/components/publicar-vaga/DataHorarioBlock';
import { BeneficiosChecklist } from '@/components/publicar-vaga/BeneficiosChecklist';
import { QuantidadeVagas } from '@/components/publicar-vaga/QuantidadeVagas';
import { RequisitosChecklist } from '@/components/publicar-vaga/RequisitosChecklist';
import { ConversionBlock } from '@/components/publicar-vaga/ConversionBlock';
import { RichTextEditor } from '@/components/RichTextEditor';

type TipoVaga = 'freelancer' | 'clt';
type PosicionamentoValor = 'acima' | 'padrao' | 'negociavel';
type SalarioTipo = 'a_combinar' | 'fixo' | 'fixo_comissao';
type RegimeTrabalho = 'integral' | 'meio_periodo' | 'escala_6x1' | 'escala_5x2';

const BENEFICIOS_FREELANCER = [
  'Vale transporte',
  'Alimentação no local',
  'Bebida liberada',
  'Comissão / bônus',
];

const BENEFICIOS_CLT = [
  'Vale transporte',
  'Vale refeição / alimentação',
  'Plano de saúde',
  'Comissão',
];

export default function PublicarVaga() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkCompanyProfile } = useSystemAlerts();

  const [tipoVaga, setTipoVaga] = useState<TipoVaga | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileAlert, setProfileAlert] = useState('');

  // Shared fields
  const [funcao, setFuncao] = useState('');
  const [atividades, setAtividades] = useState<string[]>([]);
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [numVagas, setNumVagas] = useState(1);
  const [requisitos, setRequisitos] = useState<string[]>([]);

  // Freelancer fields
  const [dataEvento, setDataEvento] = useState<Date>();
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [valor, setValor] = useState('180');
  const [posicionamento, setPosicionamento] = useState<PosicionamentoValor>('padrao');
  const [destaque, setDestaque] = useState(false);
  const [urgente, setUrgente] = useState(false);

  // CLT fields
  const [regimeTrabalho, setRegimeTrabalho] = useState<RegimeTrabalho>('integral');
  const [salario, setSalario] = useState('');
  const [salarioTipo, setSalarioTipo] = useState<SalarioTipo>('fixo');
  const [infoAdicionais, setInfoAdicionais] = useState('');

  // Location fields
  const [endereco, setEndereco] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const buscarCoordenadas = async () => {
    if (!endereco) return;
    setGeoLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
        toast({ title: 'Endereço localizado no mapa!' });
      } else {
        toast({ title: 'Endereço não encontrado.', description: 'Tente ser mais específico (Rua, Número, Cidade)', variant: 'destructive' });
        setLat(null);
        setLng(null);
      }
    } catch (e) {
      toast({ title: 'Erro ao buscar endereço', variant: 'destructive' });
    } finally {
      setGeoLoading(false);
    }
  };

  const resetForm = () => {
    setFuncao(''); setAtividades([]); setBeneficios([]);
    setNumVagas(1); setRequisitos([]);
    setDataEvento(undefined); setHorarioInicio(''); setHorarioFim('');
    setValor('180'); setPosicionamento('padrao');
    setDestaque(false); setUrgente(false);
    setRegimeTrabalho('integral'); setSalario('');
    setSalarioTipo('fixo'); setInfoAdicionais('');
    setEndereco(''); setLat(null); setLng(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !funcao) return;

    if (tipoVaga === 'freelancer' && !dataEvento) {
      toast({ title: 'Selecione a data do evento', variant: 'destructive' });
      return;
    }

    if (!lat || !lng) {
      toast({ title: 'Localização obrigatória', description: 'Por favor, digite o endereço e clique em "Buscar no Mapa".', variant: 'destructive' });
      return;
    }

    if (tipoVaga === 'freelancer') {
      const valorNum = parseFloat(valor);
      if (isNaN(valorNum) || valorNum < 180) {
        toast({ title: 'Valor mínimo é R$ 180,00', description: 'O valor da diária não pode ser inferior ao piso mínimo.', variant: 'destructive' });
        return;
      }
    }

    const profileCheck = await checkCompanyProfile(user.id);
    if (!profileCheck.valid) {
      setProfileAlert(profileCheck.message);
      return;
    }
    setProfileAlert('');
    setSubmitting(true);

    try {
      const baseData = {
        company_id: user.id,
        funcao,
        tipo_vaga: tipoVaga,
        atividades,
        beneficios,
        num_vagas: numVagas,
        requisitos_checklist: requisitos,
        requisitos: requisitos.join(', ') || null,
        descricao: atividades.join(', ') || null,
        data_evento: tipoVaga === 'freelancer'
          ? format(dataEvento!, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        horario_inicio: tipoVaga === 'freelancer' ? horarioInicio : null,
        horario_fim: tipoVaga === 'freelancer' ? horarioFim : null,
        valor: tipoVaga === 'freelancer' ? (parseFloat(valor) || 180) : (parseFloat(salario) || 0),
        posicionamento_valor: tipoVaga === 'freelancer' ? posicionamento : null,
        destaque: tipoVaga === 'freelancer' ? destaque : false,
        urgente: tipoVaga === 'freelancer' ? urgente : false,
        regime_trabalho: tipoVaga === 'clt' ? regimeTrabalho : null,
        salario_tipo: tipoVaga === 'clt' ? salarioTipo : null,
        informacoes_adicionais: tipoVaga === 'clt' ? (infoAdicionais || null) : null,
        lat,
        lng,
      };

      const { error } = await supabase.from('jobs').insert(baseData);
      if (error) throw error;

      toast({ title: tipoVaga === 'clt' ? 'Vaga CLT publicada com sucesso!' : 'Vaga publicada com sucesso!' });
      resetForm();
      setTipoVaga(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-display mb-8">Publicar Vaga</h1>

      {profileAlert && (
        <div className="mb-6">
          <AlertBanner message={profileAlert} linkTo="/empresa/perfil" linkLabel="Completar perfil" />
        </div>
      )}

      {/* Tipo de Vaga Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { type: 'freelancer' as TipoVaga, label: 'Freelancer / Diária', icon: Users, desc: 'Contrate para um evento ou dia' },
          { type: 'clt' as TipoVaga, label: 'Vaga CLT', icon: Briefcase, desc: 'Contratação com carteira assinada' },
        ]).map(({ type, label, icon: Icon, desc }) => (
          <motion.button
            key={type}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setTipoVaga(type)}
            className={cn(
              'flex flex-col items-center gap-2 p-5 rounded-lg border text-center transition-colors',
              tipoVaga === type
                ? 'border-accent bg-accent/10'
                : 'border-border bg-secondary hover:border-foreground/30'
            )}
          >
            <Icon className={cn('h-6 w-6', tipoVaga === type ? 'text-accent' : 'text-muted-foreground')} />
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">{desc}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tipoVaga && (
          <motion.div
            key={tipoVaga}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="border rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <FuncaoSelector value={funcao} onChange={setFuncao} />

                <div className="space-y-2 p-4 border rounded-lg bg-secondary/50">
                  <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> Endereço do Evento/Local
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    A vaga só será visível no mapa se o endereço for encontrado. Digite Rua, Número e Cidade.
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ex: Av Paulista, 1000, São Paulo" 
                      value={endereco} 
                      onChange={(e) => {
                        setEndereco(e.target.value);
                        setLat(null);
                        setLng(null);
                      }} 
                    />
                    <button 
                      type="button" 
                      onClick={buscarCoordenadas}
                      disabled={geoLoading || !endereco}
                      className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-transform active:scale-95"
                    >
                      {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                    </button>
                  </div>
                  {lat && lng && (
                    <p className="text-xs text-success font-medium flex items-center gap-1 mt-2">
                      <MapPin className="h-3 w-3" /> Endereço validado com sucesso!
                    </p>
                  )}
                </div>

                {tipoVaga === 'clt' && (
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-muted-foreground">Regime de trabalho</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { v: 'integral' as RegimeTrabalho, l: 'Tempo integral' },
                        { v: 'meio_periodo' as RegimeTrabalho, l: 'Meio período' },
                        { v: 'escala_6x1' as RegimeTrabalho, l: 'Escala 6x1' },
                        { v: 'escala_5x2' as RegimeTrabalho, l: 'Escala 5x2' },
                      ]).map(({ v, l }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRegimeTrabalho(v)}
                          className={cn(
                            'px-3 py-2.5 rounded-md border text-sm transition-colors',
                            regimeTrabalho === v
                              ? 'border-accent bg-accent/10 text-foreground font-medium'
                              : 'border-border text-muted-foreground hover:border-foreground/30'
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AtividadesChecklist value={atividades} onChange={setAtividades} />

                {tipoVaga === 'freelancer' && (
                  <>
                    <DataHorarioBlock
                      dataEvento={dataEvento}
                      onDataChange={setDataEvento}
                      horarioInicio={horarioInicio}
                      horarioFim={horarioFim}
                      onHorarioInicioChange={setHorarioInicio}
                      onHorarioFimChange={setHorarioFim}
                    />

                    <div className="space-y-3">
                      <label className="text-[13px] font-medium text-muted-foreground">Quanto você vai pagar?</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          className="pl-10"
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {([
                          { v: 'acima' as PosicionamentoValor, l: 'Valor acima da média (atrai mais rápido)' },
                          { v: 'padrao' as PosicionamentoValor, l: 'Valor padrão' },
                          { v: 'negociavel' as PosicionamentoValor, l: 'Valor negociável' },
                        ]).map(({ v, l }) => (
                          <label key={v} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="posicionamento"
                              checked={posicionamento === v}
                              onChange={() => setPosicionamento(v)}
                              className="accent-[hsl(var(--accent))]"
                            />
                            <span className="text-sm">{l}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {tipoVaga === 'clt' && (
                  <div className="space-y-3">
                    <label className="text-[13px] font-medium text-muted-foreground">Salário</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="pl-10"
                        placeholder="0,00"
                        value={salario}
                        onChange={(e) => setSalario(e.target.value)}
                        disabled={salarioTipo === 'a_combinar'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      {([
                        { v: 'a_combinar' as SalarioTipo, l: 'A combinar' },
                        { v: 'fixo' as SalarioTipo, l: 'Fixo' },
                        { v: 'fixo_comissao' as SalarioTipo, l: 'Fixo + comissão' },
                      ]).map(({ v, l }) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="salario_tipo"
                            checked={salarioTipo === v}
                            onChange={() => setSalarioTipo(v)}
                            className="accent-[hsl(var(--accent))]"
                          />
                          <span className="text-sm">{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-muted-foreground">Benefícios incluídos</label>
                  <BeneficiosChecklist
                    options={tipoVaga === 'clt' ? BENEFICIOS_CLT : BENEFICIOS_FREELANCER}
                    value={beneficios}
                    onChange={setBeneficios}
                    showOutro={tipoVaga === 'clt'}
                  />
                </div>

                <QuantidadeVagas value={numVagas} onChange={setNumVagas} />

                <RequisitosChecklist value={requisitos} onChange={setRequisitos} isCLT={tipoVaga === 'clt'} />

                {tipoVaga === 'clt' && (
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-muted-foreground">Informações adicionais (opcional)</label>
                    <RichTextEditor
                      value={infoAdicionais}
                      onChange={setInfoAdicionais}
                    />
                  </div>
                )}

                <ConversionBlock
                  isCLT={tipoVaga === 'clt'}
                  submitting={submitting}
                  destaque={destaque}
                  urgente={urgente}
                  onDestaqueChange={setDestaque}
                  onUrgenteChange={setUrgente}
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
