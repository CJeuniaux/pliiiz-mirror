import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  count?: number;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({ title, count, subtitle, onBack, className }: PageHeaderProps) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className="mt-0.5 rounded-md p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
