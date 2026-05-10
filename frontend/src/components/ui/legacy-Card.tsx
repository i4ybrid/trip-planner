import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`card-base ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}