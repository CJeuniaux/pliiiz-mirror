import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePublicProfileEnhanced } from '@/hooks/use-public-profile-enhanced';
import { usePublicProfileBySlug } from '@/hooks/use-public-profile-by-slug';
import { User, Heart, X, Gift, Ruler, Tag, UserPlus, Recycle } from 'lucide-react';
import { HFGiftImage } from '@/components/ui/hf-gift-image';
import { getInitials } from '@/hooks/use-enhanced-avatar';
import { calculateAge } from '@/utils/age';
import { PublicProfileAvatar } from '@/components/ui/public-profile-avatar';
import { RegiftBadge } from '@/components/ui/regift-badge';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Ensure types for profile used in target DOM injection
import type { PublicProfileEnhanced } from '@/hooks/use-public-profile-enhanced';


interface PreferenceCardProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  emptyMessage: string;
  variant: 'likes' | 'avoid' | 'gifts' | 'sizes' | 'brands';
  userId?: string;
}

function PreferenceCard({ title, icon, items, emptyMessage, variant, userId }: PreferenceCardProps) {
  const isEmpty = !items || items.length === 0;
  
  const getCardColors = () => {
    switch (variant) {
      case 'likes':
        return 'card-like border-0';
      case 'avoid':
        return 'card-avoid border-0';
      case 'gifts':
        return 'card-ideas border-0';
      case 'sizes':
        return 'card-sizes border-0';
      case 'brands':
        return 'card-brands border-0';
      default:
        return 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50';
    }
  };

  const getBadgeColors = () => {
    switch (variant) {
      case 'likes':
        return 'bg-white/16 border border-white/28 text-white';
      case 'avoid':
        return 'chip-avoid border border-white';
      case 'gifts':
        return 'chip-idea border border-white';
      case 'sizes':
        return 'bg-white/16 border border-white/28 text-white';
      case 'brands':
        return 'chip-brand border border-white';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isEmpty) {
    return (
      <Card className={`p-4 ${getCardColors()}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-5 h-5">{icon}</div>
          <h3 className="font-semibold text-lg card-title leading-5">{title}</h3>
        </div>
        <p className="text-sm italic card-title">{emptyMessage}</p>
      </Card>
    );
  }

  if (variant === 'gifts') {
    return (
      <Card className={`p-4 ${getCardColors()}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-5 h-5">{icon}</div>
          <h3 className="font-semibold text-lg card-title leading-5">{title}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
              <p className="text-sm text-center text-foreground font-medium line-clamp-2 min-h-[2.5rem]">
                {item}
              </p>
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
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${getCardColors()}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-5 h-5">{icon}</div>
        <h3 className={`font-semibold text-lg card-title leading-5 ${
          variant === 'likes' || variant === 'sizes' ? 'card-title' : 'card-title'
        }`}>{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="outline" className={getBadgeColors()}>
            {item}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

export function PublicProfileView() {
  const { slug: rawSlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isContact, setIsContact] = React.useState(false);
  const [checkingContact, setCheckingContact] = React.useState(true);
  const [requestSent, setRequestSent] = React.useState(false);

  // Force scroll to top when profile loads
  React.useEffect(() => {
    const scroller = document.querySelector('.app-scroll') as HTMLElement | null;
    if (scroller) scroller.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    // Ensure after layout
    setTimeout(() => {
      const s = document.querySelector('.app-scroll') as HTMLElement | null;
      if (s) s.scrollTop = 0;
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 0);
  }, [rawSlug]);

  // Renseigner les infos target dans le DOM pour GlobalOfferCapture
  React.useEffect(() => {
    // We need user_id and display name; load via hooks below when available
    // The effect will be updated later once profile data is available
  }, []);
  
  const slugOrId = rawSlug || '';
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(slugOrId);
  
  // If URL param looks like a UUID, fetch by userId, otherwise by slug
  const { profile: profileBySlug, loading: loadingBySlug, error: errorBySlug } = usePublicProfileBySlug(isUuid ? '' : slugOrId);
  const { profile: profileById, loading: loadingById, error: errorById } = usePublicProfileEnhanced(isUuid ? slugOrId : '');
  
  const profile = isUuid ? profileById : profileBySlug;
  const loading = isUuid ? loadingById : loadingBySlug;
  const error = isUuid ? errorById : errorBySlug;

  // Inject target info in DOM when profile loaded
  React.useEffect(() => {
    if (profile?.user_id) {
      document.body.setAttribute('data-target-id', profile.user_id);
      document.body.setAttribute('data-target-name', profile.display_name || '');
      if ((profile as any).avatar_url_public) {
        document.body.setAttribute('data-target-avatar', (profile as any).avatar_url_public);
      }
    }
    return () => {
      document.body.removeAttribute('data-target-id');
      document.body.removeAttribute('data-target-name');
      document.body.removeAttribute('data-target-avatar');
    };
  }, [profile?.user_id, (profile as any)?.display_name, (profile as any)?.avatar_url_public]);

  // Check if profile owner is a contact
  React.useEffect(() => {
    const checkIfContact = async () => {
      if (!user || !profile?.user_id) {
        console.log('[Contact Check] No user or profile.user_id', { user: !!user, profile_user_id: profile?.user_id });
        setCheckingContact(false);
        return;
      }

      // Don't check if viewing own profile
      if (user.id === profile.user_id) {
        console.log('[Contact Check] Viewing own profile');
        setIsContact(true);
        setCheckingContact(false);
        return;
      }

      try {
        console.log('[Contact Check] Checking contact status', { 
          contact_user_id: profile.user_id 
        });
        
        // Use RPC function to bypass RLS issues
        const { data, error } = await supabase
          .rpc('check_contact_relationship', { 
            contact_user_id: profile.user_id 
          });

        console.log('[Contact Check] Result', { 
          isContact: data, 
          error: error?.message
        });

        if (error) {
          console.error('[Contact Check] Error checking contact:', error);
          setIsContact(false);
        } else {
          setIsContact(data === true);
        }
      } catch (err) {
        console.error('[Contact Check] Error:', err);
      } finally {
        setCheckingContact(false);
      }
    };

    checkIfContact();
  }, [user, profile?.user_id]);

  const handleSendRequest = async () => {
    if (!user || !profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          from_user_id: user.id,
          to_user_id: profile.user_id,
          status: 'pending',
          message: 'Souhaite se connecter avec vous'
        });

      if (error) throw error;

      toast.success('Demande envoyée !');
      setRequestSent(true);
    } catch (err: any) {
      console.error('Error sending request:', err);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  if (loading) {
    return (
      <div className="pb-6">{/* Loading state */}
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6 py-6">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 bg-white/20 rounded-full" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-white/20 rounded" />
                <div className="h-4 w-24 bg-white/20 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-white/20 rounded-lg" />
              <div className="h-48 bg-white/20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="pb-6">{/* Error state */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-white/90 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">Profil non accessible</h3>
            <p className="text-white/85 mb-6">
              Ce profil n'est pas disponible ou vous n'avez pas les permissions pour le consulter.
            </p>
            {!user ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <Button onClick={() => navigate('/login')} className="w-full">Se connecter</Button>
                <Button onClick={() => navigate('/register')} variant="outline" className="w-full">Créer un compte</Button>
              </div>
            ) : (
              <Button onClick={() => navigate(-1)} className="btn-orange mt-4">
                Retour
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const age = profile.birthday ? calculateAge(profile.birthday) : null;
  const city = profile.city;
  const metaInfo = [city, age ? `${age} ans` : null].filter(Boolean).join(' · ');

  // Extract preferences from global_preferences and convert to strings
  const likes = (profile.global_preferences?.likes || []).map(item => 
    typeof item === 'object' && item && 'label' in item ? item.label : String(item)
  );
  const avoid = (profile.global_preferences?.avoid || []).map(item => 
    (typeof item === 'object' && item && 'label' in item) ? (item as any).label : String(item)
  );
  const giftIdeas = (profile.global_preferences?.giftIdeas || []).map(item => 
    typeof item === 'object' && item && 'label' in item ? item.label : String(item)
  );
  const sizes = profile.global_preferences?.sizes || {};
  // Extract brands from global_preferences  
  const brands = (profile.global_preferences?.brands || []).map(item => 
    (typeof item === 'object' && item && 'label' in item) ? (item as any).label : String(item)
  );

  // Format sizes for display
  const sizesArray = Object.entries(sizes)
    .filter(([_, value]) => value && value.toString().trim())
    .map(([key, value]) => {
      const labels: Record<string, string> = {
        top: 'Haut',
        bottom: 'Bas',
        shoes: 'Chaussures',
        ring: 'Bague',
        other: 'Autres'
      };
      return `${labels[key] || key}: ${value}`;
    });

  // Show preview mode if not logged in or not a contact
  const isPreviewMode = !user || (!isContact && !checkingContact);
  const showRequestButton = user && !isContact && !checkingContact && profile.user_id !== user.id;

  // Mode privé pour utilisateurs non connectés
  if (!user) {
    return (
      <div className="pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header - même style que profils connectés */}
          <header className="text-center mb-6 mt-0">
            <div className="relative inline-block mb-2">
              <PublicProfileAvatar 
                profile={profile}
                size="xl"
              />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {profile.display_name}
            </h1>
            
            {metaInfo && (
              <div className="text-white/90 text-lg mb-4">
                {metaInfo}
              </div>
            )}
            
            {/* Carte avec message et bouton */}
            <div className="bg-gradient-to-br from-primary/95 to-primary/90 backdrop-blur-md p-6 max-w-sm mx-auto space-y-4 shadow-2xl border-2 border-white/40 rounded-[24px] mt-6">
              <p className="text-white text-sm leading-relaxed font-medium">
                Connectez-vous pour voir le profil complet et envoyer une demande de contact
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="btn-orange w-full"
              >
                SE CONNECTER
              </Button>
            </div>
          </header>
        </div>
      </div>
    );
  }

  // Mode aperçu pour utilisateurs connectés mais non contacts
  if (user && !isContact && !checkingContact && profile.user_id !== user.id) {
    return (
      <div className="pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header - même style que profils connectés */}
          <header className="text-center mb-6 mt-0">
            <div className="relative inline-block mb-2">
              <PublicProfileAvatar 
                profile={profile}
                size="xl"
              />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {profile.display_name}
            </h1>
            
            {metaInfo && (
              <div className="text-white/90 text-lg mb-4">
                {metaInfo}
              </div>
            )}
            
            {/* Carte avec message et bouton */}
            <div className="bg-gradient-to-br from-primary/95 to-primary/90 backdrop-blur-md p-6 max-w-sm mx-auto space-y-4 shadow-2xl border-2 border-white/40 rounded-[24px] mt-6">
              <p className="text-white text-sm leading-relaxed font-medium">
                Envoyez une demande de contact pour voir le profil complet
              </p>
              <Button 
                onClick={handleSendRequest}
                disabled={requestSent}
                className="btn-orange w-full"
              >
                {requestSent ? "DEMANDE ENVOYÉE" : "DEMANDER À SE CONNECTER"}
              </Button>
            </div>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">{/* PLUS de px-4 - géré par .plz-content */}
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <header className="text-center mb-2 mt-0">
          <div className="relative inline-block mb-2">
            <PublicProfileAvatar 
              profile={profile}
              size="xl"
            />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {profile.display_name}
          </h1>
          
          {(city || age) && (
            <div className="text-white/90 text-lg mb-3">
              {metaInfo}
            </div>
          )}

          {/* Regift Badge */}
          <div className="pliiz-badge mx-4 mb-6">
            <Recycle className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {profile.regift_enabled ? "Apprécie le regift" : "Préfère les cadeaux neufs"}
            </span>
          </div>
        </header>
        {!isPreviewMode && giftIdeas && giftIdeas.length > 0 && (
          <div className="mb-8 -mx-[15px] px-[15px] mt-[10px]">{/* Grid alignée sur VERTES */}
            <div className="grid grid-cols-2 gap-3 mt-[10px]">
              {giftIdeas.map((item, index) => (
                <Card key={index} className="p-[10px] flex flex-col items-center space-y-3 rounded-[24px]" data-gift-label={item}>
                  <div className="relative w-full aspect-square rounded-[24px] overflow-hidden">
                    <HFGiftImage 
                      label={item}
                      canonical={item}
                      alt={item}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-center text-foreground font-medium line-clamp-2 min-h-[2.5rem]">
                    {item}
                  </p>
                   <button
                     className="btn-orange w-full"
                     aria-label={`Offrir ${item}`}
                     disabled={!item?.trim()}
                     data-offer-label={item}
                   >
                     OFFRIR ÇA
                   </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Cards */}
        {!isPreviewMode && (
        <div className="space-y-6 -mx-[15px] px-[15px]">{/* Cards alignées sur VERTES */}
          <h2 className="text-xl font-semibold mb-4">Ses préférences</h2>
          
          <PreferenceCard
            title="J'aime"
            icon={<Heart className="h-5 w-5 text-white" fill="white" />}
            items={likes}
            emptyMessage="Non renseigné"
            variant="likes"
            userId={profile?.user_id}
          />

          <PreferenceCard
            title="A éviter / Allergies"
            icon={<X className="h-5 w-5 text-white" />}
            items={avoid}
            emptyMessage="Non renseigné"
            variant="avoid"
            userId={profile?.user_id}
          />


          <PreferenceCard
            title="Tailles & pointures"
            icon={<Ruler className="h-5 w-5 text-white" />}
            items={sizesArray}
            emptyMessage="Non renseigné"
            variant="sizes"
            userId={profile?.user_id}
          />

          <PreferenceCard
            title="Marques préférées"
            icon={<Tag className="h-5 w-5 text-white" />}
            items={brands}
            emptyMessage="Non renseigné"
            variant="brands"
            userId={profile?.user_id}
          />
        </div>
        )}
      </div>
    </div>
  );
}