'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
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
        <AppHeader 
          title={`Trip ${tripId}`}
          showBack
          onBack={() => router.push('/dashboard')}
        />

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
