import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ViewProfileButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  showText?: boolean;
}

export function ViewProfileButton({
  userId,
  variant = "outline",
  size = "sm",
  className,
  showText = false,
}: ViewProfileButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!userId) return;
    // Always navigate via legacy route to bypass RLS; redirect component will resolve slug
    navigate(`/profil/${userId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <Eye className={showText ? "h-4 w-4 mr-2" : "h-4 w-4"} />
      {showText && "Voir le profil"}
    </Button>
  );
}
