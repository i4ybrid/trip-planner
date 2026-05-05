import React from 'react'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  src?: string
  name: string
  size?: AvatarSize
  showOnline?: boolean
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'avatar-sm w-7 h-7 text-2xs',
  md: 'avatar-md w-9 h-9 text-xs',
  lg: 'avatar-lg w-12 h-12 text-sm',
  xl: 'avatar-xl w-16 h-16 text-base',
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function Avatar({
  src,
  name,
  size = 'md',
  showOnline = false,
  className = '',
}: AvatarProps) {
  const sizeClass = sizeClasses[size]
  const [imgError, setImgError] = React.useState(false)

  return (
    <div className={`relative inline-flex ${className}`}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          className={`avatar ${sizeClass}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`avatar flex items-center justify-center font-semibold ${sizeClass}`}
          style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Online indicator */}
      {showOnline && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size === 'sm' ? '8px' : '10px',
            height: size === 'sm' ? '8px' : '10px',
            background: 'var(--color-online)',
            borderColor: 'var(--color-surface)',
          }}
        />
      )}
    </div>
  )
}