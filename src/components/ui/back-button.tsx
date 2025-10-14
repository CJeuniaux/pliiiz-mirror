import { ArrowLeft } from "lucide-react";
import { CircularActionButton } from "@/components/ui/circular-action-button";
import { useEnhancedBackNavigation } from "@/hooks/use-enhanced-back-navigation";

interface BackButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  onClick?: () => void;
  customHandler?: () => boolean;
  fallbackRoute?: string;
}

export function BackButton({ 
  className, 
  size = "md",
  label = "Retour",
  onClick,
  customHandler,
  fallbackRoute
}: BackButtonProps) {
  const { goBack } = useEnhancedBackNavigation({
    customHandler,
    fallbackRoute
  });
  return (
    <CircularActionButton
      icon={ArrowLeft}
      onClick={onClick || goBack}
      aria-label={label}
      size={size}
      className={className}
    />
  );
}