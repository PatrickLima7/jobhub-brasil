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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden liquid-glass-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = isActive(item.url, item.end);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 transition-colors duration-150",
                active
                  ? "text-accent"
                  : "text-[rgba(255,255,255,0.5)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
