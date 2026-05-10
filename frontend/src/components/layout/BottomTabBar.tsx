'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, Plus, Users, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomTabBarProps {
  unreadCount?: number;
}

export function BottomTabBar({ unreadCount = 0 }: BottomTabBarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  const tabs = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/browse', icon: Compass, label: 'Browse' },
    { href: '/trip/new', icon: Plus, label: 'New' },
    { href: '/friends', icon: Users, label: 'Friends' },
    { href: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount },
  ];

  return (
    <nav className={cn('bottom-tab-bar', 'lg:hidden')}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const badgeCount = tab.badge ?? 0;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'tab-item',
              isActive && 'active'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-card">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
