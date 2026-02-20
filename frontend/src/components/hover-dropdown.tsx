'use client';

import { useState, useRef, ReactNode } from 'react';
import { useClickOutside } from '@/hooks/use-click-outside';
import { cn } from '@/lib/utils';

interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

interface HoverDropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function HoverDropdown({ 
  trigger, 
  items, 
  align = 'right',
  className,
  onOpenChange 
}: HoverDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    onOpenChange?.(false);
  });

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        onMouseEnter={() => {
          setIsOpen(true);
          onOpenChange?.(true);
        }}
        onMouseLeave={() => {
          setIsOpen(false);
          onOpenChange?.(false);
        }}
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={cn(
            "absolute top-full z-50 min-w-48 rounded-lg border border-border bg-background py-1 shadow-lg",
            align === 'right' ? "right-0" : "left-0"
          )}
        >
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="my-1 border-t border-border" />
            ) : (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-secondary"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}
