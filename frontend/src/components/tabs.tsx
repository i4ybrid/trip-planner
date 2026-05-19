'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Clock, Images, Map, MessageCircle, Palmtree, Wallet } from 'lucide-react';
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
        "backdrop-blur-xl bg-[var(--color-surface)]/80 scrollbar-none -mb-px flex w-full gap-1 overflow-x-auto border-b border-border/80 px-1 pt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`${basePath}${tab.href}`)}
          aria-current={currentTab === tab.id ? 'page' : undefined}
          className={cn(
            "relative flex shrink-0 items-center gap-2 rounded-t-xl border border-border/75 border-b-0 bg-secondary/40 px-4 py-3 shadow-[0_-10px_26px_-24px_rgba(13,78,91,0.55)] transition hover:bg-secondary/70 hover:text-foreground sm:px-5",
            currentTab === tab.id
              ? "z-10 -mb-px rounded-t-xl bg-gradient-to-b from-card to-card/80 text-foreground shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.4),0_4px_8px_-4px_rgba(0,0,0,0.3)] border-t-2 border-primary/30"
              : "rounded-t-lg text-muted-foreground hover:border-border/50"
          )}
        >
          {iconMap[tab.id] || tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
