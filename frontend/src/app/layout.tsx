import type { Metadata } from 'next';
import './globals.css';
import { ThemeSwitcher } from '@/components/theme-switcher';

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
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  );
}
