import React from 'react';

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * TITRE DE PAGE CONTEXTUEL
 * Affiche un titre sous le header principal.
 * Usage: <PageTitle>Accueil</PageTitle>
 */
export function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <h1 className={`page-title ${className}`}>
      {children}
    </h1>
  );
}