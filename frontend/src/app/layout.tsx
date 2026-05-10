import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import NextAuthProvider from '@/components/next-auth-provider';
import { SocketProvider } from '@/components/socket-provider';
import { CrashReporter } from '@/components/crash-reporter';

export const metadata: Metadata = {
  title: 'Trip Planner - Collaborative trip planning',
  description: 'A travel-agency inspired workspace for planning group trips with friends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <CrashReporter />
        <NextAuthProvider>
          <SocketProvider>
            <AuthProvider>{children}</AuthProvider>
          </SocketProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
