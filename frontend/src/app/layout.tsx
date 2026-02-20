import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
