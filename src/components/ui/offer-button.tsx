import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

interface OfferButtonProps {
  type: string;
  near?: string;
  lat?: number;
  lng?: number;
  brand?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  children?: React.ReactNode;
}

const slug = (s: string) => s
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function OfferButton({ 
  type, 
  near, 
  lat, 
  lng, 
  brand, 
  className = "",
  variant = "default",
  size = "default",
  children = "Offrir ça"
}: OfferButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const params = new URLSearchParams();
    params.set("q", type); // Pass the type as idea label
    if (near) params.set("near", near);
    if (brand) params.set("brand", brand);
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    
    const queryString = params.toString();
    const path = `/offrir/cadeau?${queryString}`;
    navigate(path);
  };

  return (
    <Button
      type="button"
      className={className}
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={!type?.trim()}
    >
      <Gift className="h-4 w-4 mr-2" />
      {children}
    </Button>
  );
}