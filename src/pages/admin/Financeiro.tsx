import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpDown, Wallet, Download, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import type { LucideIcon } from 'lucide-react';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

function FinCard({ icon: Icon, label, value, loading }: { icon: LucideIcon; label: string; value: string; loading?: boolean }) {
  return (
    <motion.div variants={item}>
      <Card className="p-6 relative">
        <Icon className="absolute top-6 right-6 h-8 w-8 text-accent opacity-60" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{label}</p>
        {loading ? (
          <div className="mt-2 h-8 w-32 rounded skeleton-shimmer" />
        ) : (
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        )}
      </Card>
    </motion.div>
  );
}

const tipoMap: Record<string, { className: string }> = {
  payment:      { className: 'bg-[#D1FAE5] text-[#065F46] border-0' },
  fee:          { className: 'bg-accent-soft text-[#92400E] border-0' },
  refund:       { className: 'bg-destructive/10 text-destructive border-0' },
  payout:       { className: 'bg-[#EFF6FF] text-[#1D4ED8] border-0' },
};

const tipoLabel: Record<string, string> = {
  payment: 'Pagamento',
  fee: 'Taxa',
  refund: 'Estorno',
  payout: 'Repasse',
};

interface Transaction {
  id: string;
  created_at: string;
  type: string;
  description: string | null;
  amount: number;
  status: string;
  company_id: string;
}

interface FinMetrics {
  totalRecebido: number;
  totalTaxa: number;
  totalRepassar: number;
  saldoRetido: number;
}

export default function AdminFinanceiro() {
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        const txList = (txData ?? []) as Transaction[];
        setTransactions(txList);

        // Compute metrics from real data
        const totalRecebido = txList
          .filter(t => t.type === 'payment' && t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalTaxa = txList
          .filter(t => t.type === 'fee')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalRepassar = txList
          .filter(t => t.type === 'payout' && t.status === 'pending')
          .reduce((sum, t) => sum + t.amount, 0);

        const saldoRetido = txList
          .filter(t => t.type === 'refund')
          .reduce((sum, t) => sum + t.amount, 0);

        setMetrics({ totalRecebido, totalTaxa, totalRepassar, saldoRetido });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatBRL = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filtered = tipoFilter === 'todos'
    ? transactions
    : transactions.filter(t => t.type === tipoFilter);

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('Nenhuma transação para exportar.');
      return;
    }

    const header = ['Data', 'Tipo', 'Descrição', 'Valor', 'Status'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString('pt-BR'),
      tipoLabel[t.type] ?? t.type,
      t.description ?? '',
      t.amount.toFixed(2),
      t.status,
    ]);

    const csv = [header, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FinCard icon={DollarSign} label="TOTAL RECEBIDO" value={formatBRL(metrics?.totalRecebido ?? 0)} loading={loading} />
        <FinCard icon={ArrowUpDown} label="TAXA RETIDA" value={formatBRL(metrics?.totalTaxa ?? 0)} loading={loading} />
        <FinCard icon={DollarSign} label="A REPASSAR" value={formatBRL(metrics?.totalRepassar ?? 0)} loading={loading} />
        <FinCard icon={Wallet} label="SALDOS RETIDOS" value={formatBRL(metrics?.saldoRetido ?? 0)} loading={loading} />
      </motion.div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Transações</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="payment">Pagamento</SelectItem>
              <SelectItem value="payout">Repasse</SelectItem>
              <SelectItem value="refund">Estorno</SelectItem>
              <SelectItem value="fee">Taxa</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="border border-border gap-2 ml-auto" onClick={handleExport}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg skeleton-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhuma transação encontrada.</p>
            {transactions.length === 0 && (
              <p className="text-[13px] mt-1">As transações aparecerão aqui conforme as contratações forem realizadas.</p>
            )}
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            {filtered.map(t => (
              <Card key={t.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={tipoMap[t.type]?.className ?? ''}>{tipoLabel[t.type] ?? t.type}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm text-foreground">{t.description ?? '—'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{formatBRL(t.amount)}</span>
                  <Badge variant={t.status === 'completed' ? 'ativa' : 'aguardando'}>
                    {t.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-foreground">
                  {['Data', 'Tipo', 'Descrição', 'Valor', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-border hover:bg-secondary transition-colors h-[52px]">
                    <td className="px-4 py-3 text-sm">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <Badge className={tipoMap[t.type]?.className ?? ''}>{tipoLabel[t.type] ?? t.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{t.description ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatBRL(t.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.status === 'completed' ? 'ativa' : 'aguardando'}>
                        {t.status === 'completed' ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
