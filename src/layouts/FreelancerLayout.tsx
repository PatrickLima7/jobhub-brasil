import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FreelancerSidebar } from '@/components/FreelancerSidebar';
import { BottomNav } from '@/components/BottomNav';
import { Search, FileText, MessageCircle, UserCircle } from 'lucide-react';

const bottomItems = [
  { title: 'Vagas', url: '/freelancer', icon: Search, end: true },
  { title: 'Candidaturas', url: '/freelancer/candidaturas', icon: FileText },
  { title: 'Chat', url: '/freelancer/chat', icon: MessageCircle },
  { title: 'Perfil', url: '/freelancer/perfil', icon: UserCircle },
];

export default function FreelancerLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FreelancerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 md:px-6">
            <SidebarTrigger className="mr-4 hidden md:flex" />
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8 page-fade-in">
            <div className="max-w-[1100px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav items={bottomItems} />
      </div>
    </SidebarProvider>
  );
}
