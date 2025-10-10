import React from 'react';
import pliiizLogo from '@/assets/branding/pliiiz-logo-white-final-v3.svg';

/**
 * HEADER GLOBAL PLIIIZ - NE PAS SUPPRIMER
 * Ce composant gère le header principal de l'application avec :
 * - Logo Pliiiz à gauche
 * - Tagline "The right gift ...everytime" à droite
 * - Design dégradé violet/rose obligatoire
 * - Header arrondi avec fond glassmorphique
 */
export function AppHeader() {
  return (
    <header className="plz-header-main header-orange" role="banner" aria-label="Pliiiz header">
      <div className="plz-header-inner">
        <img src={pliiizLogo} alt="Pliiiz" className="plz-logo" />
        <div className="plz-header-spacer"></div>
        <p className="plz-tagline">
          The right gift<span className="plz-tagline-dots">…</span>
          <br />
          everytime !
        </p>
      </div>
    </header>
  );
}