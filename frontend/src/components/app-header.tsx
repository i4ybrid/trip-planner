'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';
import { useAuthStore } from '@/store';
import { User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/use-click-outside';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function AppHeader({ title, showBack, onBack, actions, className }: AppHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className={`border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 ${className || 'ml-sidebar'}`}>
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-2">
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
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center justify-center rounded-full transition-colors",
                isAuthenticated ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80",
                "h-9 w-9"
              )}
            >
              <User className="h-5 w-5" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-border bg-background shadow-lg">
                {isAuthenticated ? (
                  <>
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-medium">{user?.name || ''}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                    </div>
                    <button
                      onClick={() => { router.push('/settings'); setShowUserMenu(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-secondary"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { router.push('/login'); setShowUserMenu(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                  >
                    Sign in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
