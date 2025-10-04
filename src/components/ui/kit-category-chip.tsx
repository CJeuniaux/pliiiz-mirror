import { cn } from "@/lib/utils";

interface KitCategoryChipProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}

export function KitCategoryChip({ 
  children, 
  active = false, 
  className,
  onClick 
}: KitCategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-4 py-2 rounded-[16px] text-sm font-medium transition-all duration-200",
        active 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}