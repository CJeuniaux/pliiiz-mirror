import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AppHeader } from '@/components/ui/app-header';

const ROOTS = ['/', '/home', '/requests', '/contacts', '/notifications', '/profile'];

interface AppBarProps {
  title?: string;
  onBackClick?: () => void;
}

export function AppBar({ title, onBackClick }: AppBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { type } = useParams();
  const showBack = !ROOTS.includes(pathname);

  // Special handling for /offrir/:type routes
  const isOffrirRoute = pathname.startsWith('/offrir/');
  const offrirTitle = isOffrirRoute ? "Définir ma zone" : title;

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <AppHeader />
      {showBack && (
        <header className="plz-appbar">
          <button 
            className="plz-iconbtn" 
            onClick={handleBack}
            aria-label="Retour"
          >
            <ChevronLeft size={20} />
          </button>
          {(title || offrirTitle) && <h1 className="plz-title">{offrirTitle || title}</h1>}
        </header>
      )}
    </>
  );
}
