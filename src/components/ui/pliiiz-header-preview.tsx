import { useAuth } from "@/hooks/use-auth";

interface PliiizHeaderPreviewProps {
  className?: string;
  showLogo?: boolean; // Pour masquer sur Support
}

export function PliiizHeaderPreview({ className, showLogo = true }: PliiizHeaderPreviewProps) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // Redirection gérée automatiquement par l'auth state
  };

  return (
    <header 
      className={`pliiz-ribbon ${className || ''}`} 
      role="banner" 
      aria-label="En-tête Pliiiz"
    >
      <div className="pliiz-ribbon__inner">
        <div className="pliiz-left">
          {showLogo && (
            <img 
              className="pliiz-logo"
              src="https://charlottejeuniaux.be/wp-content/uploads/2025/09/Sans-titre-1-01.svg"
              alt="Logo PLIIIZ"
            />
          )}
        </div>
        <div className="pliiz-spacer"></div>
        <div className="pliiz-right">
          <span className="pliiz-tagline">The right gift <span>…everytime</span></span>
          <button 
            className="btn-primary" 
            id="btn-logout"
            onClick={handleLogout}
            type="button"
            aria-label="Se déconnecter"
          >
            Logout
          </button>
        </div>
      </div>
      
      <style>{`
        .pliiz-ribbon {
          position: relative;
          isolation: isolate;
          background: linear-gradient(135deg, #9600FF, #AEBAF8);
          color: #fff;
          padding: 18px 20px;
          overflow: visible;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(95,42,177,.35);
        }
        
        /* Renflement ovale haut & bas */
        .pliiz-ribbon::before,
        .pliiz-ribbon::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 140%;
          border-radius: 50%;
          background: inherit;
          z-index: -1;
          filter: drop-shadow(0 6px 12px rgba(95,42,177,.25));
        }
        
        .pliiz-ribbon::before {
          top: -70%;
        }
        
        .pliiz-ribbon::after {
          bottom: -70%;
        }
        
        .pliiz-ribbon__inner {
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .pliiz-left {
          flex-shrink: 0;
        }
        
        .pliiz-spacer {
          flex: 1;
        }
        
        .pliiz-right {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .pliiz-logo {
          height: 48px;
          width: auto;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,.15));
        }
        
        .pliiz-tagline {
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,.25);
        }
        
        .btn-primary {
          background: #9600FF;
          color: #fff;
          border: 0;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .btn-primary:hover {
          background: #7f00d6; /* Foncé 8% */
        }
        
        @media (max-width: 768px) {
          .pliiz-ribbon__inner {
            flex-direction: column;
            gap: 8px;
          }
          
          .pliiz-left {
            order: 1;
          }
          
          .pliiz-right {
            order: 2;
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }
          
          .pliiz-logo {
            height: 40px;
          }
        }
      `}</style>
    </header>
  );
}