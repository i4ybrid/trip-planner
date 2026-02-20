'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Menu, X, Home, Users, MessageCircle, Settings, Bell, Compass, 
  Plus, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-full border-r border-border bg-background transition-all duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-border",
          isCollapsed ? "justify-center px-2" : "gap-3 px-6"
        )}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold whitespace-nowrap">TripPlanner</span>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex flex-col gap-6",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <ul className={cn("space-y-1", isCollapsed && "space-y-2")}>
                {section.items.map((item) => (
                  <li key={item.href}>
                    <button
                      onClick={() => handleNavClick(item.href)}
                      className={cn(
                        "flex items-center rounded-lg transition-colors",
                        isCollapsed 
                          ? "justify-center p-2.5" 
                          : "gap-3 px-3 py-2.5 text-sm font-medium",
                        pathname === item.href
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {pathname === item.href && (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute bottom-4 hidden lg:flex",
            isCollapsed ? "left-1/2 -translate-x-1/2" : "right-[-12px] bg-background border border-border rounded-full h-6 w-6 p-0"
          )}
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>
    </>
  );
}
