import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PliiizHeaderFixed } from '@/components/ui/pliiiz-header-fixed';
import { useContactStrict } from '@/hooks/use-contact-strict';
import { ArrowLeft, Recycle, Heart, X, AlertCircle, Gift } from 'lucide-react';
import { RegiftModal } from '@/components/modals/regift-modal';
import { HFGiftImage } from '@/components/ui/hf-gift-image';
import { EnhancedAvatar } from '@/components/ui/enhanced-avatar';

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

/**
 * Vue profil contact STRICTE - ZÉRO HALLUCINATION
 * Principe : affichage exact des données DB, pas d'extrapolation
 */
export function ContactProfileViewStrict() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { contact, loading, error } = useContactStrict(userId!);
  const [showRegiftModal, setShowRegiftModal] = useState(false);

  // Expose target info in DOM for GlobalOfferCapture
  if (contact) {
    // set attributes synchronously in render path might cause mismatch; use effect below
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PliiizHeaderFixed />
        <div className="p-6 text-center">
          <div className="text-muted-foreground">Chargement du profil...</div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-background">
        <PliiizHeaderFixed />
        <div className="p-6 text-center space-y-4">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive opacity-50" />
          <div>
            <h3 className="font-semibold text-lg">Profil non trouvé</h3>
            <p className="text-muted-foreground mt-2">
              {error || 'Ce contact n\'existe pas ou n\'est plus accessible'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const age = contact.birthday ? calculateAge(contact.birthday) : null;

  // Inject target info
  React.useEffect(() => {
    if (contact) {
      document.body.setAttribute('data-target-id', contact.id);
      document.body.setAttribute('data-target-name', contact.display_name || '');
      if (contact.avatar_url) document.body.setAttribute('data-target-avatar', contact.avatar_url);
    }
    return () => {
      document.body.removeAttribute('data-target-id');
      document.body.removeAttribute('data-target-name');
      document.body.removeAttribute('data-target-avatar');
    };
  }, [contact]);
  
  // Filtrage STRICT des préférences par type
  const currentWants = contact.preferences.filter(p => 
    p.category === 'current_wants' && p.sentiment === 'aime'
  );
  const likes = contact.preferences.filter(p => 
    p.category === 'likes' && p.sentiment === 'aime'
  );
  const dislikes = contact.preferences.filter(p => 
    p.sentiment === 'n_aime_pas'
  );
  const allergies = contact.preferences.filter(p => 
    p.sentiment === 'allergie'
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <PliiizHeaderFixed />
      
      <div className="p-6 space-y-6">
        {/* Bouton retour */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* Header profil - DONNÉES STRICTES */}
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <div className="relative inline-block">
              <EnhancedAvatar 
                userId={contact.id}
                avatarUrl={contact.avatar_url}
                name={contact.display_name}
                size="xl"
              />
              
              {/* Icône regift : état strict DB */}
              {contact.regift_enabled && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <Recycle className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            
            <div>
              {/* Nom : exactement comme en DB */}
              <h1 className="text-2xl font-bold text-foreground">
                {contact.display_name}
              </h1>
              
              {/* Nickname seulement si existe */}
              {contact.nickname && (
                <p className="text-lg text-muted-foreground">
                  aka {contact.nickname}
                </p>
              )}
              
              {/* Âge seulement si birthday existe */}
              {age && (
                <p className="text-muted-foreground">{age} ans</p>
              )}
            </div>

            {/* Statut regift : état strict */}
            <div className="flex justify-center">
              <Badge 
                variant={contact.regift_enabled ? "default" : "outline"}
                className={contact.regift_enabled ? "bg-green-100 text-green-800" : ""}
              >
                <Recycle className="h-3 w-3 mr-1" />
                {contact.regift_enabled ? 'Regift accepté' : 'Regift non activé'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Envies actuelles - DONNÉES STRICTES */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Idées cadeaux
            </h3>
            
            {currentWants.length > 0 ? (
              <div className="grid gap-3">
                {currentWants.map((want, index) => (
                  <div 
                    key={`current-want-${index}`}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg"
                    data-gift-label={want.value}
                  >
                    <div className="flex items-center gap-3">
                      <HFGiftImage 
                        label={want.value}
                        canonical={want.value}
                        alt={want.value}
                        className="w-12 h-12 rounded-lg"
                      />
                      <span className="font-medium">{want.value}</span>
                    </div>
                    <Button
                      className="mt-2 w-full bg-[#2f4b4e] hover:opacity-90 text-white font-semibold"
                      data-offer-label={want.value}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Offrir ça !
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune idée cadeau publiée pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goûts généraux - DONNÉES STRICTES */}
        {likes.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ce qu'il/elle aime</h3>
              <div className="flex flex-wrap gap-2">
                {likes.map((like, index) => (
                  <Badge 
                    key={`like-${index}`} 
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {like.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dislikes - DONNÉES STRICTES */}
        {dislikes.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                N'aime pas
              </h3>
              <div className="flex flex-wrap gap-2">
                {dislikes.map((dislike, index) => (
                  <Badge 
                    key={`dislike-${index}`} 
                    variant="destructive"
                    className="bg-red-100 text-red-800"
                  >
                    {dislike.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allergies - DONNÉES STRICTES */}
        {allergies.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <Badge 
                    key={`allergy-${index}`} 
                    variant="destructive"
                    className="bg-orange-100 text-orange-800 border-orange-300"
                  >
                    ⚠️ {allergy.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions regift */}
        {contact.regift_enabled && (
          <Card>
            <CardContent className="p-6 text-center">
              <Button
                onClick={() => setShowRegiftModal(true)}
                variant="outline"
                className="border-green-500 text-green-700 hover:bg-green-50"
              >
                <Recycle className="h-4 w-4 mr-2" />
                Voir les articles regift
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal regift */}
      <RegiftModal
        open={showRegiftModal}
        onClose={() => setShowRegiftModal(false)}
        firstName={contact.display_name}
      />
    </div>
  );
}