import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CommonHeader } from "@/components/ui/common-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Star, ExternalLink, RefreshCw, Navigation, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUniversalBack } from "@/hooks/use-universal-back";

import { useGooglePlaces, type GooglePlace } from "@/hooks/use-google-places";
import { useRobustGeolocation, type UserLocation } from "@/hooks/use-robust-geolocation";
import { getCategoryFromGiftType } from "@/gifts/category-to-osm";
import partnersData from "@/data/partners.json";
import { GoogleMapComponent } from "@/components/maps/google-map-component";

interface Partner {
  name: string;
  logo: string;
  url: string;
}


interface OfferGiftsScreenV2Props {
  contactName: string;
  onBack: () => void;
}

const GIFT_ADVICE_DATA: Record<string, string[]> = {
  chocolat: [
    "Privilégiez le chocolat noir 70% minimum pour les amateurs",
    "Vérifiez les allergies (noix, gluten) avant d'acheter",
    "Les chocolats artisanaux locaux sont toujours appréciés",
    "Évitez les chocolats trop sucrés pour les connaisseurs"
  ],
  café: [
    "Demandez le type de mouture préféré (expresso, filtre)",
    "Les cafés de spécialité sont parfaits pour les amateurs",
    "Vérifiez s'ils préfèrent les grains ou moulu",
    "Optez pour des origines uniques pour surprendre"
  ],
  livre: [
    "Renseignez-vous discrètement sur leurs genres préférés",
    "Les éditions collector font toujours plaisir",
    "Évitez les livres qu'ils possèdent déjà",
    "Les beaux-livres sont des valeurs sûres"
  ],
  fleurs: [
    "Vérifiez les allergies au pollen",
    "Privilégiez les fleurs de saison",
    "Demandez conseil sur l'entretien",
    "Les compositions durables sont appréciées"
  ],
  thé: [
    "Renseignez-vous sur leurs préférences (vert, noir, blanc)",
    "Les thés rares ou d'origine sont des cadeaux précieux",
    "Vérifiez s'ils ont déjà une théière adaptée",
    "Les coffrets découverte sont parfaits pour débuter"
  ],
  sport: [
    "Renseignez-vous sur leurs sports préférés",
    "Vérifiez la taille et les spécifications techniques",
    "Privilégiez les marques reconnues pour la qualité",
    "Demandez discrètement s'ils ont des besoins spécifiques"
  ],
  équipement: [
    "Assurez-vous de la compatibilité avec leur matériel existant",
    "Vérifiez les normes de sécurité pour l'équipement",
    "Privilégiez la qualité pour les produits d'usage fréquent",
    "Demandez conseil aux vendeurs spécialisés"
  ],
  art: [
    "Informez-vous sur leurs styles artistiques préférés",
    "Privilégiez les œuvres d'artistes locaux ou émergents",
    "Vérifiez l'espace disponible pour l'exposition",
    "Les matériaux de création sont toujours utiles"
  ],
  voyage: [
    "Choisissez des accessoires pratiques et légers",
    "Vérifiez les restrictions de bagages pour les voyages",
    "Privilégiez la durabilité pour les équipements de voyage",
    "Les guides et cartes locales sont appréciés"
  ],
  technologie: [
    "Vérifiez la compatibilité avec leurs appareils",
    "Regardez les dernières innovations dans le domaine",
    "Privilégiez les marques réputées pour la fiabilité",
    "Vérifiez les garanties et services après-vente"
  ],
  maison: [
    "Respectez leur style de décoration existant",
    "Privilégiez les objets durables et de qualité",
    "Vérifiez l'espace disponible avant d'acheter",
    "Les articles personnalisables font toujours plaisir"
  ],
  musique: [
    "Renseignez-vous sur leurs genres musicaux préférés",
    "Vérifiez la compatibilité avec leur matériel audio",
    "Les vinyles collector sont parfaits pour les amateurs",
    "Demandez discrètement leur liste de souhaits"
  ]
};

export function OfferGiftsScreenV2({ contactName, onBack }: OfferGiftsScreenV2Props) {
  const [searchParams] = useSearchParams();
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;
  const preSelectedItem = searchParams.get("item") || "chocolat";
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  
  const { 
    location: userLocation, 
    loading: locationLoading, 
    error: locationError,
    permissionDenied,
    getCurrentLocation, 
    retry: retryLocation 
  } = useRobustGeolocation();
  
  const { 
    searchNearbyPlaces, 
    generateGoogleMapsLink, 
    openInNativeMaps, 
    places, 
    loading: placesLoading,
    error: placesError 
  } = useGooglePlaces();
  
  const category = getCategoryFromGiftType(preSelectedItem);
  const giftAdvice = GIFT_ADVICE_DATA[category] || GIFT_ADVICE_DATA.équipement;
  const partners: Partner[] = (partnersData as any)[category] || [];

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    if (userLocation && preSelectedItem) {
      loadNearbyPlaces();
    }
  }, [userLocation, preSelectedItem]);


  const loadNearbyPlaces = async () => {
    if (!userLocation || !preSelectedItem) {
      return;
    }

    try {
      const { data: placesData, error } = await searchNearbyPlaces(
        preSelectedItem,
        userLocation,
        100000 // 100km radius
      );

      if (error) {
        console.error('Error loading nearby places:', error);
        toast.error('Impossible de charger les magasins proches');
      }

    } catch (error) {
      console.error('Error loading nearby places:', error);
      toast.error('Erreur lors du chargement des magasins');
    }
  };

  const handleRetry = () => {
    if (userLocation) {
      loadNearbyPlaces();
    } else {
      retryLocation();
    }
  };

  const loading = locationLoading || placesLoading;

  const generateStaticMapUrl = () => {
    if (!userLocation) return '';
    
    const markers = places.slice(0, 10).map(place => 
      `&markers=color:blue%7C${place.geometry.location.lat},${place.geometry.location.lng}`
    ).join('');
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${userLocation.lat},${userLocation.lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${userLocation.lat},${userLocation.lng}${markers}&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw`;
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader 
        title={`Cadeau pour ${contactName}`}
        onBack={handleBack}
      />
      
      <div className="p-4 space-y-6 pb-20">
        {/* Suggestion de cadeau */}
        {preSelectedItem && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎁</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg capitalize">
                    {preSelectedItem}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Suggestion parfaite pour {contactName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerte permission géoloc */}
        {permissionDenied && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm text-orange-700">
                    Permission de géolocalisation refusée — Affichage des magasins populaires près de {userLocation?.city || 'Paris'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={retryLocation}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carte et magasins */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Acheter près d'ici
              </h3>
            </div>
            
            {userLocation ? (
              <div className="space-y-4">
                {/* Bouton Google Maps */}
                <Button 
                  onClick={() => {
                    const query = encodeURIComponent(`${preSelectedItem} magasins`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir sur Google Maps
                </Button>
                
                {/* Carte interactive */}
                <GoogleMapComponent
                  center={[userLocation.lat, userLocation.lng]}
                  places={places}
                  userLocation={[userLocation.lat, userLocation.lng]}
                  onPlaceClick={(place) => setSelectedPlaceId(place.place_id)}
                  selectedPlaceId={selectedPlaceId}
                  giftItem={preSelectedItem}
                />
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">Recherche de votre position...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nos partenaires */}
        {partners.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                🤝 Nos partenaires
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {partners.map((partner, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center border">
                        <img 
                          src={partner.logo} 
                          alt={partner.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling!.textContent = partner.name.charAt(0);
                          }}
                        />
                        <span className="font-semibold text-sm text-muted-foreground hidden">
                          {partner.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{partner.name}</h4>
                        <p className="text-sm text-muted-foreground">Partenaire officiel</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(partner.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acheter
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Magasins à proximité */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Magasins à proximité
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : places.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {places.slice(0, 20).map((place) => (
                  <div 
                    key={place.place_id} 
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer ${
                      selectedPlaceId === place.place_id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                    onClick={() => setSelectedPlaceId(place.place_id)}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{place.name}</h4>
                        {place.distance && (
                          <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                            {place.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {place.formatted_address}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        {place.rating && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{place.rating}</span>
                            {place.user_ratings_total && (
                              <span>({place.user_ratings_total})</span>
                            )}
                          </div>
                        )}
                        {place.opening_hours?.open_now && (
                          <Badge variant="secondary" className="text-xs">Ouvert</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInNativeMaps(place);
                        }}
                        className="h-8 px-2"
                      >
                        <Navigation className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(generateGoogleMapsLink(place, userLocation), '_blank');
                        }}
                        className="h-8 px-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucun magasin trouvé dans la zone.</p>
                <p className="text-sm">Essayez d'élargir votre recherche.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}