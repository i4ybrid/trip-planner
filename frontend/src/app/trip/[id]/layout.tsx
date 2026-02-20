'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LeftSidebar } from '@/components/left-sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';
import { HelpCircle, Clock, MessageCircle, Wallet, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'Overview', href: '' },
  { id: 'activities', label: 'Activities', href: '/activities' },
  { id: 'timeline', label: 'Timeline', href: '/timeline' },
  { id: 'chat', label: 'Chat', href: '/chat' },
  { id: 'payments', label: 'Payments', href: '/payments' },
  { id: 'memories', label: 'Memories', href: '/memories' },
];

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const tripId = params.id as string;
  
  const currentTab = tabs.find(t => t.href && pathname.endsWith(`/trip/${tripId}${t.href}`))?.id || 'overview';

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold">Trip {tripId}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <NotificationDrawer />
          </div>
        </header>

        <div className="border-b border-border bg-background">
          <nav className="flex gap-1 px-6 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(`/trip/${tripId}${tab.href}`)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  currentTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {tab.id === 'overview' && <HelpCircle className="h-4 w-4" />}
                {tab.id === 'activities' && <HelpCircle className="h-4 w-4" />}
                {tab.id === 'timeline' && <Clock className="h-4 w-4" />}
                {tab.id === 'chat' && <MessageCircle className="h-4 w-4" />}
                {tab.id === 'payments' && <Wallet className="h-4 w-4" />}
                {tab.id === 'memories' && <Images className="h-4 w-4" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
