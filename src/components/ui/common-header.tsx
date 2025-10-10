import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { handleBack } from "@/utils/back-handler";
import pliiizLogoBlack from "@/assets/branding/pliiiz-logo-black-final.svg";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final.svg";

interface CommonHeaderProps {
  title: string;
  count?: number;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
  showLogo?: boolean;
  variant?: "light" | "dark";
}

export function CommonHeader({ 
  title, 
  count, 
  subtitle, 
  onBack, 
  className,
  showLogo = true,
  variant = "light"
}: CommonHeaderProps) {
  const logoSrc = variant === "dark" ? pliiizLogoWhite : pliiizLogoBlack;
  
  return (
    <div className={cn("bg-transparent px-4 py-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack || handleBack}
              aria-label="Retour"
              className="mt-0.5 rounded-md p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">
              {title}
              {count !== undefined && count > 0 && (
                <span className="text-muted-foreground"> ({count})</span>
              )}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}