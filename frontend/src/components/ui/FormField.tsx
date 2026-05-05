import React from 'react'

export interface FormFieldProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label: string
  htmlFor?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  children,
  className = '',
  ...rest
}: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`flex flex-col gap-1.5 ${className}`} {...rest}>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}