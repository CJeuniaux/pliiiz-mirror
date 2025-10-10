import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface KitSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function KitSearchBar({ 
  placeholder = "Search...", 
  className,
  onSearch 
}: KitSearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full h-12 pl-12 pr-4 bg-background border border-input rounded-[20px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  );
}