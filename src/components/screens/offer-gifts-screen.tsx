import React, { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, ArrowLeft } from "lucide-react";

// Import hero images from home screen (same as used in home)
import chocolateImg from "@/assets/generated/gifts/dark-chocolate-85.jpg";
import rumImg from "@/assets/generated/gifts/aged-rum.jpg";
import bookImg from "@/assets/generated/gifts/architecture-book.jpg";
import coffeeImg from "@/assets/generated/gifts/specialty-coffee.jpg";
import plantImg from "@/assets/generated/gifts/pothos-plant.jpg";

interface Partner {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  rating: number;
  distance: string;
  tags: string[];
  lat?: number;
  lng?: number;
}

interface OfferGiftsScreenProps {
  category: string;
  contactName: string;
  onBack: () => void;
}

const partners: Partner[] = [
  {
    id: "1",
    name: "Chocolaterie Marlette",
    category: "Chocolats artisanaux depuis 1875",
    address: "77 Rue du Faubourg Saint-Antoine",
    city: "Paris",
    rating: 4.8,
    distance: "0.8 km",
    tags: ["Premium", "Artisanal"],
    lat: 48.8518,
    lng: 2.3736
  },
  {
    id: "2", 
    name: "La Maison du Chocolat",
    category: "Chocolatier de luxe parisien",
    address: "225 Rue du Faubourg Saint-Honoré",
    city: "Paris",
    rating: 4.9,
    distance: "1.2 km",
    tags: ["Luxury", "Premium"],
    lat: 48.8738,
    lng: 2.3124
  }
];

// Map category to hero image (same as home screen)
const getHeroImage = (category: string) => {
  const imageMap: Record<string, string> = {
    "chocolat": chocolateImg,
    "rhum": rumImg,
    "livre": bookImg,
    "café": coffeeImg,
    "plante": plantImg,
    "coffee": coffeeImg,
    "plant": plantImg,
  };
  return imageMap[category.toLowerCase()] || chocolateImg;
};

export function OfferGiftsScreen({ category, contactName, onBack }: OfferGiftsScreenProps) {
  const heroImage = getHeroImage(category);

  // Always scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const generateItineraryLink = (partner: Partner): string => {
    if (partner.lat && partner.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${partner.lat},${partner.lng}`;
    }
    const query = [category, partner.name, partner.address, partner.city]
      .filter(Boolean)
      .join(' ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleCall = (partner: Partner) => {
    // In a real app, this would open the phone dialer
    console.log(`Calling ${partner.name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient background and back arrow */}
      <div 
        className="relative overflow-hidden"
        style={{ background: 'var(--grad-primary)' }}
      >
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt={category}
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative">
          <div className="flex items-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">
                {category} pour {contactName}
              </h1>
              <p className="text-white/80 text-sm">Partenaires recommandés</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto pb-20" style={{ scrollBehavior: 'smooth' }}>
        {partners.map((partner) => (
          <Card key={partner.id} className="card-soft">
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Title and rating */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate-1">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate-2">
                      {partner.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{partner.rating}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground truncate-2">
                    {partner.address}, {partner.city}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {partner.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs chip"
                    >
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs chip">
                    {partner.distance}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--pliiz-primary-hover))] text-white"
                    onClick={() => window.open(generateItineraryLink(partner), '_blank', 'noopener')}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCall(partner)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Appeler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state if no partners */}
        {partners.length === 0 && (
          <Card className="text-center p-8">
            <CardContent>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Aucun partenaire trouvé</h3>
                  <p className="text-sm text-muted-foreground">
                    Nous n'avons pas encore de partenaires pour cette catégorie dans votre région.
                  </p>
                </div>
                <Button variant="outline" onClick={onBack}>
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}