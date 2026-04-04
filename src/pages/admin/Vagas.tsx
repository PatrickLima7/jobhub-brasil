import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const statusMap: Record<string, { className: string }> = {
  Ativa: { className: 'bg-accent-soft text-[#92400E] border-0' },
  Encerrada: { className: 'bg-[#F3F4F6] text-[#6B7280] border-0' },
  Cancelada: { className: 'bg-destructive/10 text-destructive border-0' },
  Concluída: { className: 'bg-[#D1FAE5] text-[#065F46] border-0' },
};

const mockVagas = [
  { id: '1', funcao: 'Garçom', empresa: 'Bar do Zé', data: '2026-04-10', valor: 200, candidatos: 12, status: 'Ativa', cidade: 'São Paulo, SP' },
  { id: '2', funcao: 'Bartender', empresa: 'Boteco Carioca', data: '2026-04-08', valor: 250, candidatos: 8, status: 'Ativa', cidade: 'BH, MG' },
  { id: '3', funcao: 'Auxiliar de Cozinha', empresa: 'Cantina Bella Napoli', data: '2026-03-28', valor: 150, candidatos: 5, status: 'Encerrada', cidade: 'Curitiba, PR' },
  { id: '4', funcao: 'Garçonete', empresa: 'Restaurante Sabor & Arte', data: '2026-03-22', valor: 180, candidatos: 15, status: 'Concluída', cidade: 'Rio de Janeiro, RJ' },
  { id: '5', funcao: 'Recepcionista', empresa: 'Espetaria Gaúcha', data: '2026-03-15', valor: 160, candidatos: 3, status: 'Cancelada', cidade: 'Porto Alegre, RS' },
];

export default function AdminVagas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const isMobile = useIsMobile();

  const filtered = mockVagas.filter((v) => {
    if (search && !(v.funcao + v.empresa).toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'todas' && v.status.toLowerCase() !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vagas</h1>
        <p className="text-sm text-muted-foreground">{mockVagas.length} vagas publicadas</p>
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
            <SelectItem value="concluída">Concluída</SelectItem>
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
                <Badge className={statusMap[v.status]?.className}>{v.status}</Badge>
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
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-foreground">
                {['Vaga', 'Data do evento', 'Valor', 'Candidatos', 'Status', 'Cidade', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border hover:bg-surface transition-colors h-[52px]">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{v.funcao}</p>
                    <p className="text-xs text-muted-foreground">{v.empresa}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm">R$ {v.valor.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm">{v.candidatos}</td>
                  <td className="px-4 py-3"><Badge className={statusMap[v.status]?.className}>{v.status}</Badge></td>
                  <td className="px-4 py-3 text-sm">{v.cidade}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground border-t border-border">
            <span>Mostrando 1-{filtered.length} de 3.204</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled>Anterior</Button>
              <Button variant="ghost" size="sm">Próximo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
