import { useAuth } from "@/hooks/use-auth";

interface PliiizHeaderSVGProps {
  className?: string;
  showLogo?: boolean;
}

export function PliiizHeaderSVG({ className, showLogo = true }: PliiizHeaderSVGProps) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className={`relative ${className || ''}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 1200 112" 
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-auto"
        role="banner"
        aria-label="En-tête Pliiiz"
      >
        <defs>
          <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9600FF"/>
            <stop offset="100%" stopColor="#AEBAF8"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-50%" width="140%" height="300%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="rgba(95,42,177,0.25)"/>
          </filter>
        </defs>
        
        {/* Forme ruban avec renflement ovale */}
        <path 
          d="M 18 56 
             C 18 25.072 43.072 0 74 0 
             L 1126 0 
             C 1156.928 0 1182 25.072 1182 56 
             C 1182 86.928 1156.928 112 1126 112 
             L 74 112 
             C 43.072 112 18 86.928 18 56 Z"
          fill="url(#headerGradient)"
          filter="url(#shadow)"
        />
        
        {/* Renflement ovale supérieur */}
        <ellipse 
          cx="600" 
          cy="-22" 
          rx="360" 
          ry="56" 
          fill="url(#headerGradient)"
          filter="url(#shadow)"
        />
        
        {/* Renflement ovale inférieur */}
        <ellipse 
          cx="600" 
          cy="134" 
          rx="360" 
          ry="56" 
          fill="url(#headerGradient)"
          filter="url(#shadow)"
        />
        
        {/* Tagline gauche */}
        <text 
          x="40" 
          y="62" 
          fill="white" 
          fontFamily="Inter, system-ui, sans-serif" 
          fontSize="18" 
          fontWeight="600"
          textAnchor="start"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
        >
          The right gift.. everytime !
        </text>
        
        {/* Logo central */}
        {showLogo && (
          <image 
            x="576" 
            y="32" 
            width="48" 
            height="48" 
            href="https://charlottejeuniaux.be/wp-content/uploads/2025/09/Sans-titre-1-01.svg"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
          />
        )}
      </svg>
      
      {/* Bouton Logout rendu côté UI */}
      <button 
        className="absolute top-[34px] right-[60px] bg-white/10 border border-white/30 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors duration-200"
        onClick={handleLogout}
        type="button"
        aria-label="Se déconnecter"
      >
        Logout
      </button>
    </div>
  );
}