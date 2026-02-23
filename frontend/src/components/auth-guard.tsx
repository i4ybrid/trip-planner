'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/invite'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, fetchUser, user } = useAuthStore();

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Fetch user on initial load if a token exists, to hydrate the session.
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && !isAuthenticated) {
      fetchUser();
    }
  }, [fetchUser]);

  useEffect(() => {
    // Redirect to login if not authenticated and not on a public route.
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router, isPublicRoute]);

  if (isLoading && !isAuthenticated && !isPublicRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
