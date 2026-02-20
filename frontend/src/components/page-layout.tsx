'use client';

import { ReactNode } from 'react';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
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
    <div className="bg-background">
      <LeftSidebar />
      <AppHeader 
        title={title}
        showBack={showBack}
        onBack={onBack}
        actions={actions}
      />
      <div className={`ml-sidebar ${className || 'p-6'}`}>
        {children}
      </div>
    </div>
  );
}
