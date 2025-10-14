import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import pliiizLogo from '@/assets/branding/pliiiz-logo-white-final-v3.svg';

/**
 * HEADER INTÉGRÉ DANS LE CONTENEUR PRINCIPAL
 * Même largeur et marges que les cartes
 */
export function IntegratedHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeNavigation = () => {
    // Éviter la duplication d'historique si on est déjà sur Home
    if (location.pathname === '/' || location.pathname === '/home') {
      return;
    }
    navigate('/');
  };

  return (
    <section className="banner">
      <img 
        className="app-header__logo cursor-pointer" 
        src={pliiizLogo} 
        alt="Pliiiz" 
        onClick={handleHomeNavigation}
      />
      <div 
        className="app-header__tagline cursor-pointer" 
        onClick={handleHomeNavigation}
      >
        The right gift… everytime
      </div>
    </section>
  );
}