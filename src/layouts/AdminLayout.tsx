import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';
import { LayoutDashboard, Building2, Briefcase, DollarSign, FileText } from 'lucide-react';

const bottomItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Empresas', url: '/admin/empresas', icon: Building2 },
  { title: 'Vagas', url: '/admin/vagas', icon: Briefcase },
  { title: 'Financeiro', url: '/admin/financeiro', icon: DollarSign },
  { title: 'Relatórios', url: '/admin/relatorios', icon: FileText },
];

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
            <div className="max-w-[1200px] mx-auto">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
        <BottomNav items={bottomItems} />
      </div>
    </SidebarProvider>
  );
}
