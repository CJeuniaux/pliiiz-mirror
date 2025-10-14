import React from 'react';
import { cn } from '@/lib/utils';

interface ConsistentPageLayoutProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Si true, applique le padding horizontal standard (15px = lignes rouges)
   * Si false, le parent gère son propre padding
   */
  withPadding?: boolean;
}

/**
 * Layout de page cohérent utilisé dans /profile
 * Garantit une largeur uniforme sur toutes les pages :
 * - Mobile : 16px padding (15px lignes rouges + 1px)
 * - Tablette : 24px padding
 * - Desktop : 32px padding avec max-width 420px
 */
export function ConsistentPageLayout({ 
  children, 
  className = '',
  withPadding = true 
}: ConsistentPageLayoutProps) {
  return (
    <div 
      className={cn(
        "plz-content w-full",
        withPadding && "px-[var(--plz-outer-margin)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Conteneur de liste cohérent (ex: contacts, demandes, notifications)
 * Utilise .pliiz-list qui gère déjà l'espacement vertical
 */
export function ConsistentListContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("pliiz-list", className)}>
      {children}
    </div>
  );
}
