'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useCallback, useEffect } from 'react';

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { user: storeUser, setUser } = useAuthStore();

  // Sync session user to auth store whenever session changes
  useEffect(() => {
    if (session?.user) {
      const sessionUser = {
        id: (session.user as any).id || session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        avatarUrl: session.user.image || undefined,
      };
      // Only update if different to avoid infinite loops
      if (!storeUser || storeUser.id !== sessionUser.id) {
        setUser(sessionUser);
      }
    } else if (!session && storeUser) {
      // Session cleared, clear store
      setUser(null);
    }
  }, [session, storeUser, setUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      // Update the session to get the latest data
      await update();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }, [update]);

  const register = useCallback(async (email: string, name: string, password: string, inviteCode?: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }));
        return { success: false, error: error.error };
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      // If there's an invite code, use it after registration
      // Note: The session will have the token after update(), so we refresh the session first
      if (inviteCode) {
        await update();
        try {
          const session = await fetch('/api/auth/session').then(r => r.json());
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invite-codes/${inviteCode}/use`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.accessToken || ''}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch {
          // Ignore invite code errors - they can still sign up
        }
      }

      await update();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, [update]);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.push('/login');
  }, [setUser, router]);

  return {
    user: session?.user ? {
      id: (session.user as any).id || session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      avatarUrl: session.user.image,
    } : null,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    login,
    register,
    logout,
  };
}
