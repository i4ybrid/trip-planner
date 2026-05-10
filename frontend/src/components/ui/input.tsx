import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, variant = 'default', ...props }, ref) => {
    if (variant === 'glass') {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-white/70 mb-1.5">
              {label}
            </label>
          )}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-lg border border-white/25 bg-white/14 px-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50',
              error && 'border-red-400 focus:ring-red-400/30',
              className
            )}
            ref={ref}
            {...props}
          />
          {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
      );
    }
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, variant = 'default', ...props }, ref) => {
    if (variant === 'glass') {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-white/70 mb-1.5">
              {label}
            </label>
          )}
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-lg border border-white/25 bg-white/14 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50',
              error && 'border-red-400 focus:ring-red-400/30',
              className
            )}
            ref={ref}
            {...props}
          />
          {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
      );
    }
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  variant?: 'default' | 'glass';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, variant = 'default', ...props }, ref) => {
    if (variant === 'glass') {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-white/70 mb-1.5">
              {label}
            </label>
          )}
          <select
            className={cn(
              'flex h-11 w-full rounded-lg border border-white/25 bg-white/14 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50',
              error && 'border-red-400 focus:ring-red-400/30',
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#1B8A8A] text-white">
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
      );
    }
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
