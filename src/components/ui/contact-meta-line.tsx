import React from 'react';
import { calculateAge } from '@/utils/age';

interface ContactMetaLineProps {
  city?: string | null;
  birthday?: string | null;
}

export function ContactMetaLine({ city, birthday }: ContactMetaLineProps) {
  const age = calculateAge(birthday);
  
  const cityPart = city?.trim();
  const agePart = age !== undefined && age !== null && age >= 0 ? `${age} ans` : undefined;
  
  const parts = [cityPart, agePart].filter(Boolean);
  
  if (parts.length === 0) return null;
  
  return (
    <div className="text-[13px] text-[#BFC7C8] font-normal mt-1">
      {parts.join('\u00A0–\u00A0')}
    </div>
  );
}