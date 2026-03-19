import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CompanySidebar } from '@/components/CompanySidebar';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';
import { LayoutDashboard, Briefcase, MessageCircle, Building2 } from 'lucide-react';

const bottomItems = [
  { title: 'Dashboard', url: '/empresa', icon: LayoutDashboard, end: true },
  { title: 'Vagas', url: '/empresa/vagas', icon: Briefcase },
  { title: 'Chat', url: '/empresa/chat', icon: MessageCircle },
  { title: 'Perfil', url: '/empresa/perfil', icon: Building2 },
];

export default function CompanyLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CompanySidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
            <div className="max-w-[1100px] mx-auto">
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
