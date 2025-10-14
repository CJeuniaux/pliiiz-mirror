import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Scroll au changement de route using instant behavior for reliability
    const scroller = document.querySelector(".app-scroll") as HTMLElement | null;
    
    if (scroller) {
      scroller.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Fallback pour certains navigateurs
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [pathname]);
  
  return null;
}
