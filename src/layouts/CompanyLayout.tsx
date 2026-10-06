import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CompanySidebar } from '@/components/CompanySidebar';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';
import { LayoutDashboard, Briefcase, MessageCircle, Building2, PlusCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const bottomItems = [
  { title: 'Home', url: '/empresa', icon: LayoutDashboard, end: true },
  { title: 'Vagas', url: '/empresa/vagas', icon: Briefcase },
  { title: 'Criar', url: '/empresa/publicar', icon: PlusCircle },
  { title: 'Perfils', url: '/empresa/freelancers', icon: Search },
  { title: 'Chat', url: '/empresa/chat', icon: MessageCircle },
];

export default function CompanyLayout() {
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <CompanySidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-1 hidden md:flex" />
              <span className="md:hidden font-bold text-base tracking-tight">JobHub Empresa</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="md:hidden h-8 text-xs gap-1.5"
                onClick={() => navigate('/empresa/publicar')}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Nova Vaga
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="md:hidden h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => supabase.auth.signOut()}
              >
                Sair
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 md:pb-8">
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
