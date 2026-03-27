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
  const { data: session } = useSession();
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
        // API call failed - user data will remain null
        // Logout will still work using session data as fallback
        console.warn('Failed to fetch user from API, using session data as fallback');
      }
    };
    
    if (session) {
      fetchUser();
    }
  }, [session]);

  // Only hide entirely if there's no session (not logged in)
  if (!session) return null;

  // Use user data from API if available, otherwise fall back to session data
  const displayUser = user || (session.user ? {
    id: (session.user as any).id,
    name: session.user.name || 'User',
    email: session.user.email || '',
    avatarUrl: session.user.image || undefined,
  } : null);

  const handleLogout = async () => {
    // Clear all local auth state
    if (typeof window !== 'undefined') {
      // Clear NextAuth session storage
      sessionStorage.removeItem('next-auth.session-token');
      sessionStorage.removeItem('next-auth.callback-url');
      sessionStorage.removeItem('next-auth.csrf-token');
      
      // Clear any application-specific auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      
      // Clear all cookies related to auth
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.trim().split('=');
        if (name.startsWith('next-auth') || name === 'auth_token') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
    
    // Call NextAuth signOut to clear server-side session and JWT cookie
    await signOut({ redirect: false });
    
    // Redirect to login
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
          src={(displayUser as any)?.avatarUrl || (displayUser as any)?.image || undefined}
          name={displayUser?.name || 'User'}
          size="sm"
        />
        <span className="text-sm font-medium text-foreground hidden sm:inline-block">
          {displayUser?.name || 'User'}
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
            {/* User info - show if we have displayUser, otherwise hide this section */}
            {displayUser && (
              <div className="border-b border-border px-4 pb-3 mb-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {displayUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayUser.email}
                </p>
              </div>
            )}

            {/* Menu items - only show if we have user data */}
            {displayUser && (
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
            )}

            {/* Logout - ALWAYS visible when session exists, even with broken user data */}
            <div className={displayUser ? 'border-t border-border pt-2 mt-1' : ''}>
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
