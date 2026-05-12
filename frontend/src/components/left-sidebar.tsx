'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, Users, MessageCircle, Settings, Bell, Compass, 
  Plus
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Menu',
    items: [
      { icon: <Home className="h-5 w-5" />, label: 'Dashboard', href: '/dashboard' },
      { icon: <Compass className="h-5 w-5" />, label: 'Browse Events', href: '/browse' },
      { icon: <Plus className="h-5 w-5" />, label: 'New Trip', href: '/trip/new' },
    ],
  },
  {
    title: 'Social',
    items: [
      { icon: <Users className="h-5 w-5" />, label: 'Friends', href: '/friends' },
      { icon: <MessageCircle className="h-5 w-5" />, label: 'Messages', href: '/messages' },
      { icon: <Bell className="h-5 w-5" />, label: 'Activity Feed', href: '/feed' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/settings' },
    ],
  },
];

export function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    if (isMobile) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) {
      collapseTimeoutRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, 5000);
    }
  };

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobile && isCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed, isMobile]);

  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 hidden h-full border-r border-white/55 bg-card/88 shadow-2xl shadow-accent/5 backdrop-blur-xl transition-all duration-200 lg:block",
        isMobile && isCollapsed ? "w-20" : "w-64"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-border/70",
          isMobile && isCollapsed ? "justify-center px-2" : "gap-3 px-6"
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/12 backdrop-blur">
            <Compass className="h-5 w-5 text-white" />
          </div>
          {!(isMobile && isCollapsed) && (
            <span className="font-display text-xl font-bold whitespace-nowrap">Trip Planner</span>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex flex-col gap-6 p-4"
        )}>
          {navSections.map((section) => (
            <div key={section.title}>
              {!(isMobile && isCollapsed) && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <ul className={cn("space-y-1", isMobile && isCollapsed && "space-y-2")}>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <button
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "flex w-full items-center rounded-lg bg-transparent transition-colors text-sm font-semibold",
                        isMobile && isCollapsed 
                          ? "justify-center p-2.5" 
                          : "justify-start gap-3 px-3 py-2.5",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      title={isMobile && isCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!(isMobile && isCollapsed) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
