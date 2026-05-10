'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, Moon, Star, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/** ============================================================
 * TopBar — Sticky top navigation bar
 * - Mobile: 56px height, blurred backdrop, back button + title + actions
 * - Desktop (lg:): 64px height, no blur, centered title
 * ============================================================ */

interface TopBarProps {
  /** Page title (defaults to route segment) */
  title?: string;
  /** Show back button (auto-shows on sub-routes) */
  showBack?: boolean;
  /** Override back button target (defaults to -1) */
  backHref?: string;
  /** Additional right-side actions */
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  showBack: showBackProp,
  backHref,
  actions,
}: TopBarProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showBack, setShowBack] = useState(showBackProp ?? false);

  useEffect(() => {
    setMounted(true);
    // Auto-detect back button need based on pathname
    if (showBackProp === undefined) {
      const pathname = window.location.pathname;
      setShowBack(pathname !== '/dashboard' && pathname !== '/');
    }
  }, [showBackProp]);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="top-bar">
      {/* Left: Back button */}
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="btn btn-ghost p-2 -ml-2 flex-shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
            <span className="hidden lg:inline text-sm">Back</span>
          </button>
        )}
      </div>

      {/* Center: Title */}
      <div className="flex-1 text-center truncate px-2">
        <h1 className="inline-flex max-w-full items-center justify-center gap-2 truncate font-display text-xl font-bold text-[var(--color-text-primary)]">
          {!title && <Star className="h-5 w-5 shrink-0 fill-[var(--color-accent)] text-[var(--color-accent)]" />}
          <span className="truncate">{title ?? 'Trip Planner'}</span>
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {actions}

        {/* Theme toggle — visible on all screen sizes */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn btn-ghost p-2"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Notification bell */}
        <button
          className="btn btn-ghost p-2 relative"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Unread indicator dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
        </button>
      </div>
    </header>
  );
}
