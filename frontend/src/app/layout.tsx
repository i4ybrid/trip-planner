import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';
import NextAuthProvider from '@/components/next-auth-provider';
import { SocketProvider } from '@/components/socket-provider';

export const metadata: Metadata = {
  title: 'TripPlanner - Plan trips with friends',
  description: 'Collaborative trip planning for groups of friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <NextAuthProvider>
          <SocketProvider>
            <AuthProvider>{children}</AuthProvider>
          </SocketProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
