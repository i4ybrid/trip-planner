'use client';

/** ============================================================
 * AppShell — Full layout wrapper
 * - Mobile: TopBar + page content + BottomTabBar
 * - Desktop (lg:): Sidebar + TopBar + content
 * ============================================================ */

import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { TopBar } from '@/components/navigation/TopBar';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';

interface AppShellProps {
  children: React.ReactNode;
  /** Override page title */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back href */
  backHref?: string;
  /** Additional top bar actions */
  topBarActions?: React.ReactNode;
  /** Hide the top bar */
  hideTopBar?: boolean;
  /** Hide the bottom tab bar (auth routes) */
  hideBottomBar?: boolean;
  /** Hide the desktop sidebar (auth routes) */
  hideSidebar?: boolean;
}

export function AppShell({
  children,
  title,
  showBack,
  backHref,
  topBarActions,
  hideTopBar,
  hideBottomBar,
  hideSidebar,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Desktop Sidebar — hidden on mobile and auth routes */}
      {!hideSidebar && <DesktopSidebar />}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        {!hideTopBar && (
          <TopBar
            title={title}
            showBack={showBack}
            backHref={backHref}
            actions={topBarActions}
          />
        )}

        {/* Page Content */}
        <main
          className="
            flex-1 px-4 pb-20 pt-4
            lg:px-8 lg:py-6 lg:pb-6
            max-w-5xl mx-auto w-full
          "
        >
          <div className="page-enter">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        {!hideBottomBar && <BottomTabBar />}
      </div>
    </div>
  );
}