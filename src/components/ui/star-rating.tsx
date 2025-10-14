import React from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function StarRating({ level, size = 'sm', className, showLabel = false }: StarRatingProps) {
  const stars = Array.from({ length: 3 }, (_, i) => i + 1);
  
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const validLevel = Math.max(1, Math.min(3, level || 2)); // Fallback to 2 if invalid

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div 
        className="flex items-center gap-0.5"
        aria-label={`${validLevel} étoile${validLevel > 1 ? 's' : ''}`}
      >
        {stars.map((star) => (
          <svg
            key={star}
            className={cn(
              sizeClasses[size],
              star <= validLevel 
                ? "text-primary fill-primary" 
                : "text-muted-foreground/30 fill-muted-foreground/30"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground ml-1">
          {validLevel}★
        </span>
      )}
    </div>
  );
}