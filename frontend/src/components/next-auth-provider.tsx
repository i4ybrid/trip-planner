'use client';

import { SessionProvider } from 'next-auth/react';

export default function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchInterval={3600}>{children}</SessionProvider>;
}
