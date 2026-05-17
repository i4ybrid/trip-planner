'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Compass } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationBell } from '@/components/notification/notification-bell';
import { UserMenu } from '@/components/user-menu';
import { BottomTabBar } from '@/components/layout/BottomTabBar';

interface NavigationBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const navItems = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Browse', href: '/browse' },
  { label: 'Friends', href: '/friends' },
  { label: 'Messages', href: '/messages' },
];

export function NavigationBar({ title, showBack, onBack, actions, className }: NavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <header className={`sticky top-0 z-30 w-full ${className || ''}`}>
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-[#20312f] dark:text-white sm:px-6 lg:px-8">
          {/* Brand / Logo */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#20312f]/20 bg-[#20312f]/12 backdrop-blur dark:border-white/20 dark:bg-white/12">
              <Compass className="h-6 w-6 text-[#20312f] dark:text-white" />
            </div>
            <span className="font-display text-2xl font-bold leading-none">
              Trip Planner
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#20312f]/70 dark:text-white/90 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`transition-opacity hover:opacity-80 ${
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('/')[1] === '' ? '/' : item.href))
                    ? 'text-[#20312f] dark:text-white'
                    : 'text-[#20312f]/70 dark:text-white/70'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right cluster with glassmorphism */}
          <div className="flex items-center gap-2 rounded-full border border-[#20312f]/20 bg-[#20312f]/12 px-2 py-1 backdrop-blur dark:border-white/20 dark:bg-white/12">
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