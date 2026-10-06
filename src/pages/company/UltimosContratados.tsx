import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/AvatarUpload';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { Users, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subYears, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContratadoData {
  id: string;
  freelancer_id: string;
  nome: string;
  funcao: string;
  data_evento: string | undefined;
  valor: number | undefined;
  contracted_at: string;
}

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export default function UltimosContratados() {
  const { user } = useAuth();
  const [contratados, setContratados] = useState<ContratadoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        // Get all company jobs
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, funcao, data_evento, valor')
          .eq('company_id', user.id);

        const jobIds = jobs?.map(j => j.id) ?? [];
        if (jobIds.length === 0) {
          setContratados([]);
          return;
        }

        // Only last 1 year
        const oneYearAgo = subYears(new Date(), 1).toISOString();

        const { data: apps } = await supabase
          .from('applications')
          .select('*')
          .in('job_id', jobIds)
          .in('status', ['contratado', 'concluido', 'aguardando_freelancer'])
          .gte('created_at', oneYearAgo)
          .order('created_at', { ascending: false })
          .limit(100);

        // Batch fetch all freelancer profiles
        const freelancerIds = [...new Set((apps ?? []).map(a => a.freelancer_id))];
        const { data: profiles } = freelancerIds.length > 0
          ? await supabase.from('freelancer_profiles').select('user_id, nome').in('user_id', freelancerIds)
          : { data: [] };

        const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p.nome]));
        const jobMap = new Map((jobs ?? []).map(j => [j.id, j]));

        const enriched: ContratadoData[] = (apps ?? []).map(app => {
          const job = jobMap.get(app.job_id);
          return {
            id: app.id,
            freelancer_id: app.freelancer_id,
            nome: profileMap.get(app.freelancer_id) ?? 'Sem nome',
            funcao: job?.funcao ?? '',
            data_evento: job?.data_evento,
            valor: job?.valor,
            contracted_at: app.created_at,
          };
        });

        setContratados(enriched);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  // Derived filtered list
  const filtered = contratados.filter(c => {
    if (filterDate) {
      const d = new Date(c.contracted_at);
      return d.toDateString() === filterDate.toDateString();
    }
    if (filterMonth !== null) {
      const d = new Date(c.contracted_at);
      return d.getMonth() === filterMonth;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-display font-bold">Últimos Contratados</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} contratado{filtered.length !== 1 ? 's' : ''} nos últimos 12 meses
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Month filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Calendar className="h-3.5 w-3.5" />
                {filterMonth !== null ? MONTHS[filterMonth] : 'Filtrar por mês'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => { setFilterMonth(null); setFilterDate(undefined); }}
                  className="col-span-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary rounded-md text-left transition-colors"
                >
                  Todos os meses
                </button>
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => { setFilterMonth(i); setFilterDate(undefined); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md text-left transition-colors ${
                      filterMonth === i ? 'bg-foreground text-background' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Day filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Calendar className="h-3.5 w-3.5" />
                {filterDate ? format(filterDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Filtrar por dia'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={filterDate}
                onSelect={(d) => { setFilterDate(d); setFilterMonth(null); }}
                className="p-3"
                locale={ptBR}
              />
              {filterDate && (
                <div className="px-3 pb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    onClick={() => setFilterDate(undefined)}
                  >
                    Limpar data
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {(filterMonth !== null || filterDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => { setFilterMonth(null); setFilterDate(undefined); }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="h-16 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <FloatingIcon><Users className="h-10 w-10 mb-3" /></FloatingIcon>
          <p className="text-sm">Nenhum freelancer contratado no período.</p>
        </div>
      ) : (
        <StaggerContainer className="space-y-3">
          {filtered.map((c) => (
            <StaggerItem key={c.id}>
              <div className="border rounded-lg p-4 md:p-5 flex items-center justify-between card-hover">
                <div className="flex items-center gap-3">
                  <UserAvatar type="freelancer" userId={c.freelancer_id} name={c.nome} size={40} />
                  <div>
                    <p className="font-medium text-sm">{c.nome}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {c.funcao}
                      {c.data_evento && ` · ${new Date(c.data_evento).toLocaleDateString('pt-BR')}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Contratado em {new Date(c.contracted_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">R$ {Number(c.valor ?? 0).toFixed(2)}</p>
                  <Badge variant="contratado" className="mt-1.5 text-[10px]">Contratado</Badge>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
