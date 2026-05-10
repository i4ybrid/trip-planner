import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  info: 'badge badge-accent',
  neutral: 'badge badge-neutral',
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...rest
}: BadgeProps) {
  return (
    <span className={`${variantClasses[variant]} ${className}`} {...rest}>
      {children}
    </span>
  )
}