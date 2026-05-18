'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Clock, History, Images, Map, MessageCircle, Palmtree, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const defaultIconMap: Record<string, React.ReactNode> = {
  overview: <Map className="h-4 w-4 text-current" />,
  activities: <Palmtree className="h-4 w-4 text-current" />,
  timeline: <Clock className="h-4 w-4 text-current" />,
  history: <History className="h-4 w-4 text-current" />,
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

  const currentTab = tabs.find(t => pathname === `${basePath}${t.href}`)?.id || tabs[0]?.id || '';

  return (
    <nav
      aria-label="Trip folders"
      className={cn(
        "scrollbar-none -mb-px flex w-full gap-1 overflow-x-auto border-b border-border/80 px-1 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`${basePath}${tab.href}`)}
          aria-current={currentTab === tab.id ? 'page' : undefined}
          className={cn(
            "relative flex shrink-0 items-center gap-2 rounded-t-lg border border-border/75 border-b-0 bg-card/55 px-4 py-3 shadow-[0_-10px_26px_-24px_rgba(13,78,91,0.55)] transition hover:bg-card/90 hover:text-foreground sm:px-5",
            currentTab === tab.id
              ? "z-10 -mb-px bg-card text-foreground shadow-[0_-12px_32px_-24px_rgba(13,78,91,0.65)]"
              : "text-muted-foreground"
          )}
        >
          {iconMap[tab.id] || tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
