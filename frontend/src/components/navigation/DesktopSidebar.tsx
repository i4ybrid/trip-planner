'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  MessageCircle,
  Compass,
  Settings,
  ChevronLeft,
  Star,
} from 'lucide-react';
import { useState } from 'react';

/** ============================================================
 * DesktopSidebar — Left sidebar for desktop (lg: and up)
 * Width: 72px collapsed / 220px expanded
 * Active state: accent pill bg, left border accent
 * ============================================================ */

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/browse', label: 'Packages', icon: Compass },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
] as const;

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-[var(--color-surface)] border-r border-[var(--color-border)] backdrop-blur-xl
        transition-all duration-300 ease-out-expo
        relative flex-shrink-0
        ${expanded ? 'w-[220px]' : 'w-[72px]'}
      `}
      style={{ height: '100vh', position: 'sticky', top: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--color-border)] flex-shrink-0">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--color-accent)]/20"
        >
          <Compass size={22} className="fill-white text-white" />
        </div>

        {expanded && (
          <span className="font-display text-lg text-[var(--color-text-primary)]">
            Trip Planner
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 rounded-[var(--radius-md)]
                px-3 py-2.5 transition-all duration-200 ease-out-expo
                relative
                ${isActive
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]'
                }
                ${!expanded ? 'justify-center' : ''}
              `}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active left border */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-white/80"
                />
              )}

              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

              {expanded && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + Collapse toggle */}
      <div className="border-t border-[var(--color-border)] py-4 px-3 space-y-1 flex-shrink-0">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 rounded-[var(--radius-md)]
                px-3 py-2.5 transition-all duration-200 ease-out-expo
                ${isActive
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]'
                }
                ${!expanded ? 'justify-center' : ''}
              `}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {expanded && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className={`
            w-full flex items-center gap-3 rounded-[var(--radius-md)]
            px-3 py-2.5 transition-all duration-200 ease-out-expo
            text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]
            ${!expanded ? 'justify-center' : ''}
          `}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronLeft
            size={20}
            className={`transition-transform duration-300 ${!expanded ? 'rotate-180' : ''}`}
          />
          {expanded && (
            <span className="text-sm font-medium">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}
