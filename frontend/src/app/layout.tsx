import type { Metadata } from 'next';
import './globals.css';
import { AuthGuard } from '@/components/auth-guard';

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
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}

