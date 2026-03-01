'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Avatar } from '@/components/ui/avatar';
import { Settings, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { User as UserType } from '@/types';

export function UserMenu() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  // Fetch fresh user data from API on mount and when session changes
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await api.getCurrentUser();
        if (result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    
    if (session) {
      fetchUser();
    }
  }, [session]);

  if (!user || !session) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleSettings = () => {
    router.push('/settings');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border bg-background/80 p-1 pr-3 hover:bg-accent transition-colors"
      >
        <Avatar
          src={user.avatarUrl || undefined}
          name={user.name}
          size="sm"
        />
        <span className="text-sm font-medium text-foreground hidden sm:inline-block">
          {user.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover py-2 shadow-lg z-50">
            {/* User info */}
            <div className="border-b border-border px-4 pb-3 mb-2">
              <p className="text-sm font-semibold text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={handleSettings}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="h-4 w-4 text-current" />
                Settings
              </button>
              <button
                onClick={() => {
                  router.push('/settings');
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4 text-current" />
                Profile
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-border pt-2 mt-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4 text-current" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
