'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

type OnboardingCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  animationDelay?: string;
};

export function OnboardingCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  animationDelay = '0ms',
}: OnboardingCardProps) {
  return (
    <div
      className="group relative flex flex-col items-center text-center p-6 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer animate-fade-in-up"
      style={{ animationDelay }}
      onClick={onAction}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
