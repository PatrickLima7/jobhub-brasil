import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const statusMap: Record<string, { className: string }> = {
  ativa: { className: 'bg-accent-soft text-[#92400E] border-0' },
  encerrada: { className: 'bg-[#F3F4F6] text-[#6B7280] border-0' },
  cancelada: { className: 'bg-destructive/10 text-destructive border-0' },
  concluida: { className: 'bg-[#D1FAE5] text-[#065F46] border-0' },
};

interface VagaData {
  id: string;
  funcao: string;
  empresa: string;
  data: string;
  valor: number;
  candidatos: number;
  status: string;
  cidade: string;
}

export default function AdminVagas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [vagas, setVagas] = useState<VagaData[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: jobsData, error } = await supabase
          .from('jobs')
          .select('*');
        
        if (error) throw error;

        // Fetch company profiles manually
        const companyIds = [...new Set((jobsData || []).map(j => j.company_id))];
        let companyMap = new Map();
        if (companyIds.length > 0) {
          const { data: companies } = await supabase.from('company_profiles').select('user_id, nome').in('user_id', companyIds);
          companyMap = new Map((companies || []).map(c => [c.user_id, c.nome]));
        }

        // Fetch applications manually for count
        const { data: appsData } = await supabase.from('applications').select('job_id');
        const appsCountMap = new Map();
        appsData?.forEach(app => {
          appsCountMap.set(app.job_id, (appsCountMap.get(app.job_id) || 0) + 1);
        });

        const formatted: VagaData[] = (jobsData || []).map(v => ({
          id: v.id,
          funcao: v.funcao || 'Não informada',
          empresa: companyMap.get(v.company_id) || 'Empresa desconhecida',
          data: v.data_evento || v.created_at,
          valor: v.valor || 0,
          candidatos: appsCountMap.get(v.id) || 0,
          status: v.status || 'ativa',
          cidade: v.cidade_evento || 'Não informada',
        }));

        setVagas(formatted);
      } catch (err) {
        toast.error('Erro ao buscar vagas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = vagas.filter((v) => {
    if (search && !(v.funcao + v.empresa).toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'todas' && v.status.toLowerCase() !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vagas</h1>
        <p className="text-sm text-muted-foreground">{vagas.length} vagas publicadas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar vaga..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="encerrada">Encerrada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" className="border border-border gap-2" onClick={() => toast.success('Relatório gerado! Download iniciando...')}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {isMobile ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{v.funcao}</p>
                  <p className="text-xs text-muted-foreground">{v.empresa}</p>
                </div>
                <Badge className={statusMap[v.status]?.className}>{v.status.toUpperCase()}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{new Date(v.data).toLocaleDateString('pt-BR')}</span>
                <span>R$ {v.valor.toLocaleString('pt-BR')}</span>
                <span>{v.candidatos} candidatos</span>
                <span>{v.cidade}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full"><Eye className="h-4 w-4 mr-2" /> Ver detalhes</Button>
            </Card>
          ))}
        </motion.div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                {['Vaga', 'Data do evento', 'Valor', 'Candidatos', 'Status', 'Cidade', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/50 transition-colors h-[52px]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{v.funcao}</p>
                    <p className="text-xs text-muted-foreground">{v.empresa}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm">R$ {v.valor.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm">{v.candidatos}</td>
                  <td className="px-4 py-3"><Badge className={statusMap[v.status]?.className}>{v.status.toUpperCase()}</Badge></td>
                  <td className="px-4 py-3 text-sm">{v.cidade}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-sm text-muted-foreground">Nenhuma vaga encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground border-t border-border">
            <span>Mostrando 1-{filtered.length} de {vagas.length}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled>Anterior</Button>
              <Button variant="ghost" size="sm" disabled>Próximo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
