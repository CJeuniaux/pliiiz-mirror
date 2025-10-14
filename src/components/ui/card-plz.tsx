import React from 'react';
import { cn } from '@/lib/utils';

interface CardPlzProps {
  children: React.ReactNode;
  className?: string;
}

export function CardPlz({ children, className }: CardPlzProps) {
  return <div className={cn('plz-card', className)}>{children}</div>;
}

export function PillPlz({ children, className }: CardPlzProps) {
  return <div className={cn('plz-pill', className)}>{children}</div>;
}
