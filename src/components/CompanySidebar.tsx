import { LayoutDashboard, PlusCircle, Briefcase, Users, Building2, LogOut, MessageCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', url: '/empresa', icon: LayoutDashboard },
  { title: 'Publicar Vaga', url: '/empresa/publicar', icon: PlusCircle },
  { title: 'Minhas Vagas', url: '/empresa/vagas', icon: Briefcase },
  { title: 'Contratados', url: '/empresa/contratados', icon: Users },
  { title: 'Chat', url: '/empresa/chat', icon: MessageCircle },
  { title: 'Minha Empresa', url: '/empresa/perfil', icon: Building2 },
];

export function CompanySidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0 hidden md:flex">
      <div className="flex h-16 items-center px-6 gap-3">
        <span className="text-xl font-bold text-sidebar-accent-foreground">
          {collapsed ? 'T' : 'TôLivre'}
        </span>
      </div>
      <div className="mx-4 h-px bg-sidebar-border" />
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/empresa'}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-accent"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="h-px bg-sidebar-border mb-4" />
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>
          <LogOut className="mr-2.5 h-4 w-4" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
