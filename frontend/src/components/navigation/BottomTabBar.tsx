'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Compass, Home, MessageCircle, Users } from 'lucide-react';

/** ============================================================
 * BottomTabBar — Mobile Bottom Navigation
 * Shows on all routes EXCEPT immersive trip sub-routes:
 * /trip/[id]/overview, /trip/[id]/timeline, /trip/[id]/payments,
 * /trip/[id]/chat, /trip/[id]/activities, /trip/[id]/history, /trip/[id]/memories
 * ============================================================ */

interface BottomTabBarProps {
  unreadCount?: number;
}

const TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/browse', label: 'Browse', icon: Compass },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
] as const;

// Routes where bottom tab bar should be hidden
const IMMERSIVE_ROUTES = [
  /^\/trip\/[^/]+\/(overview|timeline|history|payments|chat|activities|memories)$/,
];

function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTES.some((regex) => regex.test(pathname));
}

export function BottomTabBar({ unreadCount = 0 }: BottomTabBarProps) {
  const pathname = usePathname();

  if (isImmersiveRoute(pathname)) {
    return null;
  }

  return (
    <nav
      className="bottom-tab-bar lg:hidden"
      aria-label="Main navigation"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`tab-item${isActive ? ' active' : ''}`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {unreadCount > 0 && label === 'Messages' && (
                <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
