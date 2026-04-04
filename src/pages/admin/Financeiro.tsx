import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpDown, Wallet, Download, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

function FinCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <motion.div variants={item}>
      <Card className="p-6 relative">
        <Icon className="absolute top-6 right-6 h-8 w-8 text-accent opacity-60" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      </Card>
    </motion.div>
  );
}

const tipoMap: Record<string, { className: string }> = {
  Pagamento: { className: 'bg-[#D1FAE5] text-[#065F46] border-0' },
  Repasse: { className: 'bg-[#EFF6FF] text-[#1D4ED8] border-0' },
  Cancelamento: { className: 'bg-destructive/10 text-destructive border-0' },
  Taxa: { className: 'bg-accent-soft text-[#92400E] border-0' },
};

const mockTransacoes = [
  { id: '1', data: '2026-04-03', tipo: 'Pagamento', desc: 'Garçom · Bar do Zé · Lucas M.', valor: '+R$ 220,00', valorColor: 'text-success', status: 'Concluído' },
  { id: '2', data: '2026-04-03', tipo: 'Taxa', desc: 'Taxa 22% · Garçom · Bar do Zé', valor: '-R$ 48,40', valorColor: 'text-accent', status: 'Concluído' },
  { id: '3', data: '2026-04-02', tipo: 'Repasse', desc: 'Repasse · Lucas M. · Garçom', valor: '-R$ 171,60', valorColor: 'text-foreground', status: 'Pendente' },
  { id: '4', data: '2026-04-01', tipo: 'Cancelamento', desc: 'Cancelamento · Bartender · Boteco', valor: '+R$ 250,00', valorColor: 'text-destructive', status: 'Concluído' },
  { id: '5', data: '2026-03-30', tipo: 'Pagamento', desc: 'Garçonete · Cantina · Ana P.', valor: '+R$ 180,00', valorColor: 'text-success', status: 'Concluído' },
];

export default function AdminFinanceiro() {
  const [tipoFilter, setTipoFilter] = useState('todos');
  const isMobile = useIsMobile();

  const filtered = mockTransacoes.filter(t => tipoFilter === 'todos' || t.tipo.toLowerCase() === tipoFilter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FinCard icon={DollarSign} label="TOTAL RECEBIDO" value="R$ 284.720" />
        <FinCard icon={ArrowUpDown} label="TAXA RETIDA" value="R$ 62.638" />
        <FinCard icon={DollarSign} label="A REPASSAR" value="R$ 222.081" />
        <FinCard icon={Wallet} label="SALDOS RETIDOS" value="R$ 4.280" />
      </motion.div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Transações</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pagamento">Pagamento</SelectItem>
              <SelectItem value="repasse">Repasse</SelectItem>
              <SelectItem value="cancelamento">Cancelamento</SelectItem>
              <SelectItem value="taxa">Taxa</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="border border-border gap-2 ml-auto" onClick={() => toast.success('Relatório gerado! Download iniciando...')}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {isMobile ? (
          <div className="space-y-3">
            {filtered.map(t => (
              <Card key={t.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={tipoMap[t.tipo]?.className}>{t.tipo}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm text-foreground">{t.desc}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${t.valorColor}`}>{t.valor}</span>
                  <Badge variant={t.status === 'Concluído' ? 'ativa' : 'aguardando'}>{t.status}</Badge>
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
                  <tr key={t.id} className="border-b border-border hover:bg-surface transition-colors h-[52px]">
                    <td className="px-4 py-3 text-sm">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3"><Badge className={tipoMap[t.tipo]?.className}>{t.tipo}</Badge></td>
                    <td className="px-4 py-3 text-sm">{t.desc}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${t.valorColor}`}>{t.valor}</td>
                    <td className="px-4 py-3"><Badge variant={t.status === 'Concluído' ? 'ativa' : 'aguardando'}>{t.status}</Badge></td>
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
