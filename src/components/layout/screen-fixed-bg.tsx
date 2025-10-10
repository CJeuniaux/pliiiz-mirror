import React, { ReactNode } from 'react';

interface ScreenFixedBGProps {
  children: ReactNode;
  isAuth?: boolean;
  topGap?: number;
  padH?: number;
  padB?: number;
  className?: string;
}

export function ScreenFixedBG({
  children,
  isAuth,
  topGap = 16,
  padH = 16,
  padB = 24,
  className = ''
}: ScreenFixedBGProps) {
  return (
    <div 
      className={`relative min-h-screen overflow-auto plz-content ${className}`}
      style={{
        paddingTop: `${topGap}px`,
        paddingBottom: `${padB}px`
      }}
    >
      {children}
    </div>
  );
}
