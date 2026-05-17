'use client';

import { ReactNode } from 'react';
import { NavigationBar } from '@/components/navigation/NavigationBar';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function PageLayout({ 
  children, 
  title, 
  showBack, 
  onBack, 
  actions,
  className 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen">
      <NavigationBar 
        title={title}
        showBack={showBack}
        onBack={onBack}
        actions={actions}
      />
      <div className={className || 'px-6 pb-24 pt-6 lg:pb-6'}>
        {children}
      </div>
    </div>
  );
}
