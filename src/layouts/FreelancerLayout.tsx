import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FreelancerSidebar } from '@/components/FreelancerSidebar';

export default function FreelancerLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <FreelancerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="text-lg font-semibold">Painel do Freelancer</h2>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
