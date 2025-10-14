import React from "react";
import { OfferButton } from "@/components/ui/offer-button";

interface OfferThisButtonProps {
  label: string;
  userCity?: string;
  userCoords?: { lat: number; lng: number };
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function OfferThisButton({ 
  label, 
  userCity, 
  userCoords,
  className = "",
  variant = "default",
  size = "default"
}: OfferThisButtonProps) {
  // Convert label to type (simple mapping for common cases)
  const getTypeFromLabel = (label: string): string => {
    const lowercaseLabel = label.toLowerCase();
    if (lowercaseLabel.includes('chocolat')) return 'chocolatier';
    if (lowercaseLabel.includes('fleur')) return 'fleuriste';
    if (lowercaseLabel.includes('patiss')) return 'patisserie';
    if (lowercaseLabel.includes('cave') || lowercaseLabel.includes('vin')) return 'cave';
    if (lowercaseLabel.includes('spa') || lowercaseLabel.includes('massage')) return 'spa';
    if (lowercaseLabel.includes('livre') || lowercaseLabel.includes('librairie')) return 'librairie';
    if (lowercaseLabel.includes('concept')) return 'concept';
    if (lowercaseLabel.includes('restaurant')) return 'restaurant';
    if (lowercaseLabel.includes('parfum')) return 'parfumerie';
    if (lowercaseLabel.includes('bougie')) return 'bougies';
    if (lowercaseLabel.includes('plante')) return 'plantes';
    if (lowercaseLabel.includes('déco') || lowercaseLabel.includes('decoration')) return 'decoration';
    if (lowercaseLabel.includes('jeu')) return 'jeux';
    if (lowercaseLabel.includes('vinyle') || lowercaseLabel.includes('disque')) return 'vinyle';
    return 'cadeau'; // fallback
  };

  return (
    <OfferButton
      type={getTypeFromLabel(label)}
      near={userCity}
      lat={userCoords?.lat}
      lng={userCoords?.lng}
      className={className}
      variant={variant}
      size={size}
    >
      Offrir ça !
    </OfferButton>
  );
}