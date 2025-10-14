import { cn } from "@/lib/utils";
import pliiizLogoNew from "@/assets/branding/pliiiz-logo-new-updated.svg";

interface PageHeaderMainProps {
  className?: string;
}

export function PageHeaderMain({ className }: PageHeaderMainProps) {
  return (
    <div className={cn("bg-primary px-4 py-4 shadow-soft-2", className)} style={{ height: '80px' }}>
      <div className="flex items-center justify-between h-full">
        {/* Tagline left - hidden on small screens */}
        <div className="hidden min-[360px]:block text-base font-inter font-medium text-primary-foreground flex-shrink-0">
          The right gift
        </div>
        
        {/* Logo center - Clean and minimal */}
        <div className="h-12 w-auto flex-shrink-0">
          <img 
            src={pliiizLogoNew}
            alt="PLIIIZ logo"
            className="h-full w-auto object-contain filter brightness-0 invert"
          />
        </div>
        
        {/* Tagline right - hidden on small screens */}
        <div className="hidden min-[360px]:block text-base font-inter font-medium text-primary-foreground flex-shrink-0">
          ...everytime
        </div>
      </div>
    </div>
  );
}