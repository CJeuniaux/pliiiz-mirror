import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PliiizHeaderFixed } from '@/components/ui/pliiiz-header-fixed';
import { usePublicProfileEnhanced } from '@/hooks/use-public-profile-enhanced';
import { ArrowLeft, User, Gift, Check, X, Ruler } from 'lucide-react';
import { HFGiftImage } from '@/components/ui/hf-gift-image';
import { openMapsSearch } from '@/utils/maps-unified';
import ExternalLink from '@/components/ui/external-link';

// Import gift images
import chocolateDark from '@/assets/generated/gifts/chocolate-dark.jpg';
import winePremium from '@/assets/generated/gifts/wine-premium.jpg';
import perfumeLuxury from '@/assets/generated/gifts/perfume-luxury.jpg';
import plantsSucculents from '@/assets/generated/gifts/plants-succulents.jpg';
import coffeeArtisan from '@/assets/generated/gifts/coffee-artisan.jpg';
import paintingSupplies from '@/assets/generated/gifts/painting-supplies.jpg';

// Import event images
import dinnerImage from '@/assets/generated/events/dinner.jpg';
import brunchImage from '@/assets/generated/events/brunch.jpg';
import birthdayImage from '@/assets/generated/events/birthday.jpg';
import housewarmingImage from '@/assets/generated/events/housewarming.jpg';
function calculateAge(birthday: string): number | null {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
    return age - 1;
  }
  return age;
}
// Keep the getGiftImage function as fallback for the hook
const getGiftImage = (giftName: string): string => {
  const s = giftName.toLowerCase();
  // Painting / art supplies
  if (/(peinture|peindre|peintures|pinceau|pinceaux|toile|acrylique|gouache|matos|matériel\s+de\s+peinture|art|painting|paint)/.test(s)) return paintingSupplies;
  // Food & treats
  if (/(chocolat|truffe|pralin|cacao|chocolate)/.test(s)) return chocolateDark;
  // Drinks
  if (/(vin|wine|bordeaux|bourgogne|bottle)/.test(s)) return winePremium;
  // Fragrances / cosmetics
  if (/(parfum|perfume|eau de parfum|fragrance)/.test(s)) return perfumeLuxury;
  // Plants
  if (/(plante|succulent|cactus|monstera|plant)/.test(s)) return plantsSucculents;
  // Coffee
  if (/(café|coffee|espresso|arabica)/.test(s)) return coffeeArtisan;
  // Default fallback
  return chocolateDark;
};

function ChipsWithCTA({
  items,
  userId,
  onItemClick
}: {
  items: string[];
  userId: string;
  onItemClick: (userId: string, item: string) => void;
}) {
  if (!items?.length) {
    return <div className="text-center py-6">
        <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Pas encore d'idées cadeaux publiées</p>
      </div>;
  }
  
  return <div className="grid grid-cols-2 gap-4 mt-[10px]">
      {items.map((item, index) => (
        <Card key={index} className="p-3 flex flex-col items-center space-y-3" data-gift-label={item}>
          <div className="relative w-full aspect-square rounded-lg overflow-hidden">
            <HFGiftImage 
              label={item}
              canonical={item}
              alt={item}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-sm text-center text-foreground font-medium line-clamp-2 min-h-[2.5rem]">{item}</p>
            <Button
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-white font-semibold bg-[#2f4b4e] hover:opacity-90 rounded-lg transition-opacity"
              aria-label={`Offrir ${item}`}
              disabled={!item?.trim()}
              data-offer-label={item}
            >
              OFFRIR ÇA !
            </Button>
        </Card>
      ))}
    </div>;
}
function labelOccasion(key: string): string {
  const labels: Record<string, string> = {
    brunch: 'Brunch',
    diner_entre_amis: 'Dîner entre amis',
    anniversaire: 'Anniversaire',
    cremaillere: 'Crémaillère'
  };
  return labels[key] || key;
}
export function ContactProfileViewFinal() {
  const {
    userId
  } = useParams();
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error
  } = usePublicProfileEnhanced(userId!);
  if (loading) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 bg-muted rounded-full" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded-lg" />
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>;
  }
  if (error || !profile) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profil non accessible</h3>
            <p className="text-muted-foreground">
              Ce profil n'est pas disponible ou vous n'avez pas les permissions pour le consulter.
            </p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Retour
            </Button>
          </div>
        </div>
      </div>;
  }
  const age = profile.birthday ? calculateAge(profile.birthday) : null;
  const firstName = profile.display_name.split(' ')[0];

  // Handler functions that use navigate
  const handleItemClick = (userId: string, item: string) => {
    navigate(`/offrir/${userId}?item=${encodeURIComponent(item)}`);
  };
  const handleOccasionClick = (userId: string, occasion: string) => {
    // For now, just navigate to the profile - occasions are embedded in the main profile
    navigate(`/p/${userId}`);
  };

  // Helper function to get event image
  const getEventImage = (occasion: string): string => {
    switch (occasion) {
      case 'diner_entre_amis': return dinnerImage;
      case 'brunch': return brunchImage;
      case 'anniversaire': return birthdayImage;
      case 'cremaillere': return housewarmingImage;
      default: return dinnerImage;
    }
  };

  // Helper function to render occasions
  const renderOccasions = (occasionPrefs: any, userId: string) => {
    const order = ['brunch', 'diner_entre_amis', 'anniversaire', 'cremaillere'];
    if (!occasionPrefs || Object.keys(occasionPrefs).length === 0) {
      return <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">Aucune préférence par occasion</p>
        </div>;
    }
    return <div className="grid grid-cols-2 gap-4 mt-[10px]">
        {order.filter(key => occasionPrefs[key]).map(key => (
          <Card key={key} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOccasionClick(userId, key)}>
            <div className="relative aspect-video">
              <img 
                src={getEventImage(key)} 
                alt={labelOccasion(key)}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm text-foreground">{labelOccasion(key)}</h4>
            </div>
          </Card>
        ))}
      </div>;
  };
   return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">{profile.display_name}</h1>
              
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                {age && <span>{age} ans</span>}
                {profile.city && profile.country && <span>{profile.city}, {profile.country}</span>}
              </div>
              
              {profile.regift_enabled && <div className="badge-regift mt-2">Regift accepté ♻️</div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Idées cadeaux */}
          <div>
            <h2 className="text-xl font-bold mb-4">Idées cadeaux</h2>
            <ChipsWithCTA items={(profile.wishlist ?? []).slice(0, 6)} userId={profile.user_id} onItemClick={handleItemClick} />
          </div>

          {/* 2. Personal Preferences Section */}
          <div className="space-y-4">
            {/* Ce que [user] aime */}
            {profile.style_prefs && profile.style_prefs.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-600">Ce que {firstName} aime</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.style_prefs.map((item, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
            {/* À éviter */}
            {profile.dislikes && profile.dislikes.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <X className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-600">À éviter</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.dislikes.map((item, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Allergies */}
            {profile.food_prefs && profile.food_prefs.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <X className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-600">Allergies</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.food_prefs.map((allergy, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Tailles */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-600">Tailles</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Haut</p>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="font-medium text-gray-600">M</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Pantalon</p>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="font-medium text-gray-600">32</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Pointure</p>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="font-medium text-gray-600">42</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 3. Préférences par occasion */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Préférences par occasion</h3>
            {renderOccasions(profile.occasion_prefs, profile.user_id)}
          </Card>
        </div>
      </div>
    </div>;
}