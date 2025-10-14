import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Copy, 
  RefreshCw, 
  QrCode, 
  ExternalLink,
  Eye,
  EyeOff,
  Smartphone
} from 'lucide-react';
import { useShareLink } from '@/hooks/use-share-link';
import { ProfileQRGenerator } from '@/components/ui/profile-qr-generator';
import { toast } from 'sonner';

export function ShareProfileEnhancedScreen() {
  const { 
    shareLink, 
    loading, 
    toggleShareLink, 
    getShareUrl, 
    regenerateSlug 
  } = useShareLink();

  const handleCopyUrl = async () => {
    const url = getShareUrl();
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copiée dans le presse-papier');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleOpenProfile = () => {
    const url = getShareUrl();
    if (!url) return;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon profil Pliiiz',
          text: 'Découvrez mon profil Pliiiz',
          url: url
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const shareUrl = getShareUrl();
  const isActive = shareLink?.is_active || false;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Partage de profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez la visibilité et le partage de votre profil public
        </p>
      </div>

      {/* Status & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Paramètres de partage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium">
                  Profil {isActive ? 'public' : 'privé'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isActive 
                  ? 'Votre profil est accessible via le lien de partage'
                  : 'Votre profil n\'est pas accessible publiquement'
                }
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={toggleShareLink}
            />
          </div>

          {shareLink && (
            <>
              <Separator />
              
              {/* URL Section */}
              <div className="space-y-3">
                <h3 className="font-medium">Lien de partage</h3>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {shareUrl || 'Lien inactif'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    disabled={!isActive}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleOpenProfile}
                    disabled={!isActive}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    disabled={!isActive}
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                  <Button
                    variant="outline"
                    onClick={regenerateSlug}
                    disabled={!shareLink}
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Slug Info */}
              <div className="space-y-2">
                <h3 className="font-medium">Identifiant unique</h3>
                <div className="text-sm text-muted-foreground">
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {shareLink.slug}
                  </span>
                  <p className="mt-1">
                    Cet identifiant fait partie de votre URL de partage. 
                    Vous pouvez le régénérer si nécessaire.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* QR Code */}
      {isActive && (
        <div className="grid md:grid-cols-2 gap-6">
          <ProfileQRGenerator />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Comment utiliser le QR code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">1</div>
                <div>
                  <strong>Partagez le QR code</strong> avec vos contacts en l'envoyant par message ou en l'imprimant
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">2</div>
                <div>
                  <strong>Scanner le code</strong> avec l'appareil photo d'un smartphone ouvre directement votre profil
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5">3</div>
                <div>
                  <strong>Vos contacts peuvent voir</strong> vos préférences et souhaits pour mieux choisir leurs cadeaux
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils d'utilisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Profil public :</strong> Activez le partage pour que vos contacts puissent voir vos préférences et souhaits
          </div>
          <div>
            <strong>QR Code :</strong> Partagez facilement votre profil en personne ou sur les réseaux sociaux
          </div>
          <div>
            <strong>Régénération :</strong> Changez votre identifiant à tout moment si vous souhaitez un nouveau lien
          </div>
          <div>
            <strong>Sécurité :</strong> Désactivez le partage si vous ne souhaitez plus que votre profil soit accessible
          </div>
        </CardContent>
      </Card>
    </div>
  );
}