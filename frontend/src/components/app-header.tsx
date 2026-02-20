'use client';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function AppHeader({ title, showBack, onBack, actions }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 ml-sidebar">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          )}
          {title && <h1 className="text-lg font-semibold">{title}</h1>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeSwitcher />
          <NotificationDrawer />
        </div>
      </div>
    </header>
  );
}
