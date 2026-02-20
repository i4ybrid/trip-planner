import React from 'react';
import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary';
  status?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
  };

  const statusClass = status ? getStatusColor(status) : '';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        status ? statusClass : variants[variant],
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
};
