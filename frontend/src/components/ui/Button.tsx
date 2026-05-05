import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'default' | 'icon-sm'
  children: React.ReactNode
}

const variantClasses = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
  outline: 'btn btn-outline',
}

export function Button({
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const baseClass = variantClasses[variant]
  const sizeClass = size === 'icon-sm' ? 'p-1.5 w-6 h-6' : 'px-4 py-2.5'
  return (
    <button
      className={`${baseClass} ${sizeClass} btn-press ${className}`}
      style={{ transition: 'transform 80ms var(--ease-spring)' }}
      {...rest}
    >
      {children}
    </button>
  )
}