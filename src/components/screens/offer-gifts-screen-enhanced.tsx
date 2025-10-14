import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CommonHeader } from "@/components/ui/common-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Star } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  distance: string;
  tags: string[];
}

// Mock partners data for the demo
const partners: Partner[] = [
  {
    id: "1",
    name: "Chocolaterie Artisanale",
    category: "chocolat",
    address: "123 Rue des Délices, Paris",
    rating: 4.8,
    distance: "0.5 km",
    tags: ["Bio", "Artisanal", "Local"]
  },
  {
    id: "2",
    name: "Maison du Chocolat",
    category: "chocolat",
    address: "456 Avenue Gourmande, Paris",
    rating: 4.6,
    distance: "1.2 km",
    tags: ["Premium", "Livraison"]
  },
  {
    id: "3",
    name: "Café des Amis",
    category: "café",
    address: "789 Place du Marché, Paris",
    rating: 4.7,
    distance: "0.8 km",
    tags: ["Torréfaction", "Fair Trade"]
  }
];

interface OfferGiftsScreenProps {
  category?: string;
  contactName: string;
  onBack: () => void;
}

export function OfferGiftsScreen({ category = "chocolat", contactName, onBack }: OfferGiftsScreenProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedItem = searchParams.get('item');

  const filteredPartners = partners.filter(partner => 
    partner.category === category || category === 'general'
  );

  const generateItineraryLink = (partner: Partner): string => {
    const encodedAddress = encodeURIComponent(partner.address);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  };

  const handleCall = (partner: Partner) => {
    console.log(`Calling ${partner.name}`);
    // In a real app, this would initiate a phone call
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader title={`Offrir à ${contactName}`} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold">Offrir {category}</h1>
            {preSelectedItem && (
              <p className="text-sm text-muted-foreground">
                Suggestion: {preSelectedItem}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredPartners.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Aucun partenaire trouvé pour cette catégorie
              </p>
              <p className="text-sm text-muted-foreground">
                Essayez une autre catégorie ou revenez plus tard
              </p>
            </Card>
          ) : (
            filteredPartners.map((partner) => (
              <Card key={partner.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {partner.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{partner.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{partner.address}</span>
                      <span>•</span>
                      <span>{partner.distance}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {partner.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(generateItineraryLink(partner), '_blank')}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCall(partner)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}