'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token && !isAuthenticated) {
        // If there is a token but we're not authenticated yet, fetch the user
        await fetchUser();
      }
      
      setCheckingAuth(false);
    };

    checkAuth();
  }, [isAuthenticated, fetchUser]);

  useEffect(() => {
    if (!checkingAuth && !isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, checkingAuth, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">Directing you to the right place...</p>
      </div>
    </div>
  );
}
