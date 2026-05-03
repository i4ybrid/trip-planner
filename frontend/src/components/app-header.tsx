'use client';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationBell } from '@/components/notification/notification-bell';
import { UserMenu } from '@/components/user-menu';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function AppHeader({ title, showBack, onBack, actions, className }: AppHeaderProps) {
  return (
    <>
      <header className={`sticky top-0 z-30 border-b border-white/50 bg-card/82 shadow-sm shadow-accent/5 backdrop-blur-xl ${className || 'ml-sidebar'}`}>
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-2">
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-md bg-transparent px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {title ? (
              <h1 className="truncate font-display text-xl font-bold">{title}</h1>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <ThemeSwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>
      <BottomTabBar />
    </>
  );
}
