import { cn } from "@/lib/utils";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final-v3.svg";

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function HeroHeader({ title, subtitle, className }: HeroHeaderProps) {
  return (
    <div className={cn("", className)}>
    </div>
  );
}