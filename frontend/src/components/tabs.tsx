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
        "flex w-fit overflow-hidden rounded-t-lg bg-[#008c95] text-xs font-bold uppercase tracking-[0.12em] text-white shadow-xl",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`${basePath}${tab.href}`)}
          aria-current={currentTab === tab.id ? 'page' : undefined}
          className={cn(
            "flex items-center gap-2 px-5 py-3 transition hover:bg-white/15",
            currentTab === tab.id
              ? "bg-white/15 text-white"
              : "text-white/75 hover:text-white"
          )}
        >
          {iconMap[tab.id] || tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
