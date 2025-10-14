import React from 'react';
import { Recycle } from 'lucide-react';

interface RegiftBadgeProps {
  value?: boolean | null;
}

export function RegiftBadge({ value }: RegiftBadgeProps) {
  if (value === null || value === undefined) return null;
  
  const label = value ? 'Apprécie le regift' : 'Préfère les cadeaux neufs';

  return (
    <span 
      className="inline-flex items-center gap-2 bg-[#F8F8F8] rounded-xl px-3 py-2 text-[#2F4B4E] text-sm font-normal leading-[1.4]"
      role="text"
      aria-label={label}
    >
      <Recycle className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}