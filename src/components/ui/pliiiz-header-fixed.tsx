import { cn } from "@/lib/utils";

interface PliiizHeaderFixedProps {
  className?: string;
}

export function PliiizHeaderFixed({ className }: PliiizHeaderFixedProps) {
  return (
    <div className={cn("p-4", className)}>
      <header className="pliiz-header" role="banner">
        <div className="ph__inner">
          <img 
            className="ph__logo" 
            src="https://charlottejeuniaux.be/wp-content/uploads/2025/09/Sans-titre-1-01.svg" 
            alt="PLIIIZ"
          />
          <div className="ph__spacer"></div>
          <p className="ph__tagline">
            The right gift <span>…everytime</span>
          </p>
        </div>
      </header>
      
      <style>{`
        /* PATCH: enlever le halo ovale derrière le header */
        .pliiz-header{ position:relative; background:linear-gradient(135deg,#9600FF,#AEBAF8); color:#fff; border-radius:18px; padding:14px 16px; box-shadow:0 10px 30px rgba(95,42,177,.35); }
        .pliiz-header::before,.pliiz-header::after{ display:none !important; }
        .ph__inner{ display:flex; align-items:center; gap:12px; max-width:1200px; margin:0 auto; }
        .ph__logo{ height:42px; width:auto; }
        .ph__spacer{ flex:1; }
        .ph__tagline{ margin:0; font-weight:700; font-size:20px; text-shadow:0 1px 2px rgba(0,0,0,.25); }
        @media (max-width:640px){ .ph__tagline{ font-size:16px; } }
      `}</style>
    </div>
  );
}