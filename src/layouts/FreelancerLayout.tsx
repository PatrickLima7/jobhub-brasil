import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FreelancerSidebar } from '@/components/FreelancerSidebar';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';
import { Search, FileText, MessageCircle, UserCircle, Wifi, WifiOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const bottomItems = [
  { title: 'Vagas', url: '/freelancer', icon: Search, end: true },
  { title: 'Candidaturas', url: '/freelancer/candidaturas', icon: FileText },
  { title: 'Chat', url: '/freelancer/chat', icon: MessageCircle },
  { title: 'Perfil', url: '/freelancer/perfil', icon: UserCircle },
];

export default function FreelancerLayout() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loadingOnline, setLoadingOnline] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOnlineStatus = async () => {
      const { data } = await supabase
        .from('freelancer_profiles')
        .select('is_online')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setIsOnline(!!(data as any).is_online);
      }
      setLoadingOnline(false);
    };
    fetchOnlineStatus();
  }, [user]);

  const handleOnlineToggle = async (checked: boolean) => {
    setIsOnline(checked);
    if (!user) return;
    
    // Optimistic update
    if (checked) {
      toast.success('Você está Online!', { description: 'Empresas agora podem ver você no mapa.' });
    } else {
      toast.info('Você está Offline', { description: 'Você não aparecerá no mapa para novas convocações.' });
    }

    try {
      await supabase
        .from('freelancer_profiles')
        .update({ is_online: checked } as any)
        .eq('user_id', user.id);
    } catch (e) {
      console.error('Error updating online status:', e);
      setIsOnline(!checked);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FreelancerSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-14 flex items-center justify-between border-b px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4 hidden md:flex" />
              <div className="md:hidden font-bold text-lg tracking-tight">JobHub</div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
                {isOnline ? 'Pronto para trampar' : 'Indisponível'}
              </span>
              <div className="flex items-center gap-2 bg-secondary/50 rounded-full pl-2 pr-1 py-1">
                {isOnline ? <Wifi className="h-3.5 w-3.5 text-success" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
                <Switch 
                  checked={isOnline}
                  onCheckedChange={handleOnlineToggle}
                  className="data-[state=checked]:bg-success"
                />
              </div>
            </div>
          </header>
          <main className="flex-1 p-0 md:p-8 overflow-hidden pb-20 md:pb-8 flex flex-col relative h-[calc(100vh-56px)]">
            <div className="flex-1 mx-auto w-full max-w-[1100px] flex flex-col h-full relative">
              <PageTransition className="flex-1 h-full w-full">
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
