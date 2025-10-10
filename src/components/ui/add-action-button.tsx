import React from 'react';
import { Plus } from 'lucide-react';
import { CircularActionButton } from '@/components/ui/circular-action-button';

interface AddActionButtonProps {
  onClick: () => void;
  'aria-label': string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function AddActionButton({
  onClick,
  'aria-label': ariaLabel,
  className,
  size = 'md',
  disabled = false
}: AddActionButtonProps) {
  return (
    <CircularActionButton
      icon={Plus}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      size={size}
      disabled={disabled}
    />
  );
}