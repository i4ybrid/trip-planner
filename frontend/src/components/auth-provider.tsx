'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth-store';

const PUBLIC_PATHS = ['/login', '/invite', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(true);
  const [isBackendValidated, setIsBackendValidated] = useState(false);
  const isAuthenticated = !!session;
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    // Skip auth check for public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
      setIsChecking(false);
      return;
    }

    // Auth check is handled by useSession
    setIsChecking(false);
  }, [pathname]);

  // Session expiration validation — runs once on mount for protected routes
  useEffect(() => {
    if (status === 'loading' || isChecking) return;

    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    if (isPublic) return;

    let cancelled = false;

    api.getCurrentUser().then(() => {
      if (!cancelled) {
        setIsBackendValidated(true);
      }
    }).catch(async () => {
      if (cancelled) return;
      // Session is invalid — call signout endpoint to clear server-side cookie
      // and clear localStorage tokens, then redirect
      try {
        await fetch('/api/auth/signout', { method: 'POST' });
      } catch {
        // ignore fetch errors
      }
      localStorage.removeItem('next-auth.session-token');
      localStorage.removeItem('next-auth.csrf-token');
      clearSession();
      window.location.href = '/login?reason=session_expired';
    });

    return () => {
      cancelled = true;
    };
  }, [status, isChecking, pathname, clearSession]);

  useEffect(() => {
    // Redirect logic — only redirect away from /login after backend validation succeeds
    if (status === 'loading' || isChecking) return;

    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (!isAuthenticated && !isPublic) {
      // Not authenticated and trying to access protected route
      router.push('/login');
    } else if (isAuthenticated && isBackendValidated && isPublic && pathname === '/login') {
      // Authenticated and trying to access login — only redirect after backend validation passes
      router.push('/dashboard');
    }
  }, [isAuthenticated, isBackendValidated, isChecking, status, pathname, router]);

  // Show loading state while checking auth
  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-800 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated and not on public path
  if (!isAuthenticated && !PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return null;
  }

  return <>{children}</>;
}
