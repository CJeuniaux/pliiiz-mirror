import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Recycle, Gift, Calendar } from "lucide-react";
import { HFGiftImage } from '@/components/ui/hf-gift-image';
import { OfferThisScreen } from "@/components/screens/offer-this-screen";

// Import gift images
import agedRumImg from "@/assets/generated/gifts/aged-rum.jpg";
import architectureBookImg from "@/assets/generated/gifts/architecture-book.jpg";
import darkChocolateImg from "@/assets/generated/gifts/dark-chocolate-85.jpg";
import premiumStationeryImg from "@/assets/generated/gifts/premium-stationery.jpg";
import indoorPlantsImg from "@/assets/generated/gifts/indoor-plants-easy.jpg";
import minimalistDecorImg from "@/assets/generated/gifts/minimalist-decor.jpg";
import bikeAccessoriesImg from "@/assets/generated/gifts/bike-accessories.jpg";
import specialtyCoffeeImg from "@/assets/generated/gifts/specialty-coffee.jpg";
import fragranceFreeImg from "@/assets/generated/gifts/fragrance-free-cosmetics.jpg";
import scifiBookImg from "@/assets/generated/gifts/scifi-book.jpg";

// Import event images
import birthdayImg from "@/assets/generated/events/birthday-elegant.jpg";
import dinnerImg from "@/assets/generated/events/dinner-elegant.jpg";
import brunchImg from "@/assets/generated/events/brunch.jpg";
import housewarmingImg from "@/assets/generated/events/housewarming.jpg";
import secretSantaImg from "@/assets/generated/events/secret-santa.jpg";

interface ContactProfileScreenProps {
  contact: {
    id: string;
    name: string;
    city: string;
    avatar: string;
    acceptsRegift: boolean;
    upcomingEvents: Array<{
      type: string;
      name: string;
      daysUntil: number;
    }>;
    preferences: {
      likes: string[];
      dislikes: string[];
      allergies: string[];
      sizes: {
        top: string;
        bottom: string;
        shoes: string;
      };
    };
  };
  onBack: () => void;
  onOfferGift?: (giftTitle: string, contactName: string) => void;
}

const eventImages: Record<string, string> = {
  birthday: birthdayImg,
  dinner: dinnerImg,
  brunch: brunchImg,
  housewarming: housewarmingImg,
  "secret-santa": secretSantaImg,
};

const giftSuggestions: Record<string, Array<{ title: string; image: string; description: string }>> = {
  "thomas-l": [
    { title: "Rhum vieux premium", image: agedRumImg, description: "Rhum des Antilles, 15 ans d'âge" },
    { title: "Livre d'architecture", image: architectureBookImg, description: "Architecture contemporaine française" },
    { title: "Café de spécialité", image: specialtyCoffeeImg, description: "Mélange single origin du Guatemala" },
  ],
  "alex-m": [
    { title: "Chocolat noir 85%", image: darkChocolateImg, description: "Chocolat bio équitable, origine Madagascar" },
    { title: "Papeterie premium", image: premiumStationeryImg, description: "Carnet cuir et stylo plume" },
    { title: "Livre SF francophone", image: scifiBookImg, description: "Dernière nouveauté de Becky Chambers" },
  ],
  "zoe-d": [
    { title: "Plantes faciles", image: indoorPlantsImg, description: "Pothos doré avec cache-pot" },
    { title: "Déco minimaliste", image: minimalistDecorImg, description: "Vase céramique artisanal" },
    { title: "Café de spécialité", image: specialtyCoffeeImg, description: "Thé en vrac bio premium" },
  ],
  "samir-k": [
    { title: "Accessoires vélo", image: bikeAccessoriesImg, description: "Support téléphone étanche" },
    { title: "Café de spécialité", image: specialtyCoffeeImg, description: "Grains torréfiés artisanalement" },
    { title: "Livre technique", image: architectureBookImg, description: "Guide du développement durable" },
  ],
  "lila-r": [
    { title: "Cosmétiques sans parfum", image: fragranceFreeImg, description: "Soins naturels hypoallergéniques" },
    { title: "Livre SF", image: scifiBookImg, description: "Roman de science-fiction récent" },
    { title: "Tisanes bio", image: specialtyCoffeeImg, description: "Assortiment de tisanes premium" },
  ],
};

export function ContactProfileScreen({ contact, onBack }: ContactProfileScreenProps) {
  const [selectedEventFilter, setSelectedEventFilter] = useState<string | null>(null);
  const [showOfferScreen, setShowOfferScreen] = useState<{ title: string; image: string; description: string } | null>(null);

  const suggestions = giftSuggestions[contact.id] || [];

  if (showOfferScreen) {
    return (
      <OfferThisScreen 
        gift={showOfferScreen}
        contactName={contact.name}
        onBack={() => setShowOfferScreen(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title={contact.name}
        subtitle={`Profil de ${contact.name.split(' ')[0]}`}
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Avatar className="h-20 w-20 mx-auto">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-xl font-semibold">{contact.name}</h2>
              <p className="text-muted-foreground">{contact.city}</p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Recycle className={`h-5 w-5 ${contact.acceptsRegift ? 'text-[#1DB954]' : 'text-[#B0B7C3]'}`} />
              <span className="text-sm text-muted-foreground">
                {contact.acceptsRegift ? "Accepte le regift" : "N'accepte pas le regift"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        {contact.upcomingEvents.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Événements à venir
              </h3>
              <div className="flex flex-wrap gap-2">
                 {contact.upcomingEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <img 
                        src={eventImages[event.type]} 
                        alt={event.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.name}</h4>
                        <p className="text-xs text-muted-foreground">Dans {event.daysUntil} jours</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gift Suggestions */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Idées cadeaux pour {contact.name.split(' ')[0]}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <HFGiftImage 
                        label={suggestion.title}
                        canonical={suggestion.title}
                        alt={suggestion.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 h-7 text-xs"
                          onClick={() => setShowOfferScreen(suggestion)}
                        >
                          Offrir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <div className="space-y-4">
          {/* Likes */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-green-600">✓ J'aime</h3>
              <div className="flex flex-wrap gap-2">
                {contact.preferences.likes.map((like, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    {like}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dislikes */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-red-600">✗ À éviter</h3>
              <div className="flex flex-wrap gap-2">
                {contact.preferences.dislikes.map((dislike, index) => (
                  <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    {dislike}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          {contact.preferences.allergies.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-orange-600">⚠️ Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.preferences.allergies.map((allergy, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sizes */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-blue-600">📏 Tailles</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Haut</p>
                  <Badge variant="outline">{contact.preferences.sizes.top}</Badge>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Bas</p>
                  <Badge variant="outline">{contact.preferences.sizes.bottom}</Badge>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Chaussures</p>
                  <Badge variant="outline">{contact.preferences.sizes.shoes}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}