'use client';

import { useRouter, usePathname } from 'next/navigation';
import { HelpCircle, Clock, MessageCircle, Wallet, Images, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const defaultIconMap: Record<string, React.ReactNode> = {
  overview: <HelpCircle className="h-4 w-4" />,
  activities: <Star className="h-4 w-4" />,
  timeline: <Clock className="h-4 w-4" />,
  chat: <MessageCircle className="h-4 w-4" />,
  payments: <Wallet className="h-4 w-4" />,
  memories: <Images className="h-4 w-4" />,
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
    <nav className={cn("flex gap-1 px-6 py-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`${basePath}${tab.href}`)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            currentTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {iconMap[tab.id] || tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
