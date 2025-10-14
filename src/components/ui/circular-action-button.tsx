import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CircularActionButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  'aria-label': string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  variant?: 'default' | 'ghost';
}

export function CircularActionButton({
  icon: Icon,
  onClick,
  'aria-label': ariaLabel,
  className,
  size = 'md',
  disabled = false,
  variant = 'default'
}: CircularActionButtonProps) {
  const sizeClasses = {
    sm: 'circular-btn-sm',
    md: 'circular-btn-md', 
    lg: 'circular-btn-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'circular-btn',
        sizeClasses[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
    </Button>
  );
}