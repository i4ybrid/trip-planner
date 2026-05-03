'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Clock, MessageCircle, Wallet, Images, Star, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const defaultIconMap: Record<string, React.ReactNode> = {
  overview: <Map className="h-4 w-4 text-current" />,
  activities: <Star className="h-4 w-4 text-current" />,
  timeline: <Clock className="h-4 w-4 text-current" />,
  chat: <MessageCircle className="h-4 w-4 text-current" />,
  payments: <Wallet className="h-4 w-4 text-current" />,
  memories: <Images className="h-4 w-4 text-current" />,
};

interface TabsProps {
  tabs: Tab[];
  basePath: string;
  iconMap?: Record<string, React.ReactNode>;
  className?: string;
}

export function Tabs({ tabs, basePath, iconMap = defaultIconMap, className }: TabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = tabs.find(t => t.href && pathname.endsWith(`${basePath}${t.href}`))?.id || tabs[0]?.id || '';

  return (
    <nav
      className={cn(
        "flex snap-x gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:gap-2 sm:px-6 sm:py-3 [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`${basePath}${tab.href}`)}
          aria-current={currentTab === tab.id ? 'page' : undefined}
          className={cn(
            "flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm",
            currentTab === tab.id
              ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:bg-secondary hover:text-foreground"
          )}
        >
          {iconMap[tab.id] || tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
