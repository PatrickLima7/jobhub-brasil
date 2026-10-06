import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  end?: boolean;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const location = useLocation();

  const isActive = (url: string, end?: boolean) => {
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 md:hidden pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav
        className="mx-auto max-w-sm pointer-events-auto flex items-center justify-around bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl px-1 py-1.5"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {items.map((item) => {
          const active = isActive(item.url, item.end);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-[54px] rounded-xl transition-all duration-200 active:scale-95",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-[10px] font-semibold leading-none">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

