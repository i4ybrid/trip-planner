import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // All standard input props inherited
}

export function Input({ className = '', ...rest }: InputProps) {
  return (
    <input
      className={`input-base ${className}`}
      {...rest}
    />
  )
}