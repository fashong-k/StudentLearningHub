import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SimpleDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

interface SimpleDropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface SimpleDropdownSeparatorProps {
  className?: string;
}

export function SimpleDropdown({ trigger, children, align = 'end', className }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 min-w-[12rem] max-w-[16rem] bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1",
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function SimpleDropdownItem({ children, onClick, className, disabled }: SimpleDropdownItemProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) {
          onClick();
        }
      }}
      className={cn(
        "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SimpleDropdownSeparator({ className }: SimpleDropdownSeparatorProps) {
  return (
    <div className={cn("h-px bg-gray-200 my-1", className)} />
  );
}