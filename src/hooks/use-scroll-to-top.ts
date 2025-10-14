import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top on route change using instant behavior for reliability
    const scroller = document.querySelector('.app-scroll') as HTMLElement | null;
    
    if (scroller) {
      scroller.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Fallback pour certains navigateurs
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [pathname]);
}