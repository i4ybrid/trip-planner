'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const PUBLIC_PATHS = ['/login', '/invite', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isChecking, setIsChecking] = useState(true);
  const isAuthenticated = !!session;

  useEffect(() => {
    // Skip auth check for public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
      setIsChecking(false);
      return;
    }

    // Auth check is handled by useSession
    setIsChecking(false);
  }, [pathname]);

  // Redirect logic — based on NextAuth's useSession (server-validated)
  useEffect(() => {
    if (status === 'loading' || isChecking) return;

    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (!isAuthenticated && !isPublic) {
      // Not authenticated and trying to access protected route
      router.push('/login');
    } else if (isAuthenticated && isPublic && pathname === '/login') {
      // Authenticated and on login — redirect to dashboard
      router.push('/dashboard');
    }
  }, [isAuthenticated, isChecking, status, pathname, router]);

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
