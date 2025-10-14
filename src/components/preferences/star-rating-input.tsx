import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  level: number;
  onChange: (level: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRatingInput({ 
  level, 
  onChange, 
  size = 'sm',
  className 
}: StarRatingInputProps) {
  const [hoverLevel, setHoverLevel] = useState(0);
  
  const stars = [1, 2, 3];
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stars.map((star) => {
        const isActive = star <= (hoverLevel || level);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverLevel(star)}
            onMouseLeave={() => setHoverLevel(0)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isActive 
                  ? "text-purple-500 fill-purple-500" 
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}