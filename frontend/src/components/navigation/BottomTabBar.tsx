'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, MessageCircle, User } from 'lucide-react';

/** ============================================================
 * BottomTabBar — Mobile Bottom Navigation
 * Shows on all routes EXCEPT immersive trip sub-routes:
 * /trip/[id]/timeline, /trip/[id]/payments,
 * /trip/[id]/chat, /trip/[id]/activities
 * ============================================================ */

const TABS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

// Routes where bottom tab bar should be hidden
const IMMERSIVE_ROUTES = [
  /^\/trip\/[^/]+\/(timeline|payments|chat|activities|memories)$/,
];

function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTES.some((regex) => regex.test(pathname));
}

export function BottomTabBar() {
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
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
