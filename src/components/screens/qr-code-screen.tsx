import { useEffect, useRef } from 'react';
import { CommonHeader } from '@/components/ui/common-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy } from 'lucide-react';
import { useShareLink } from '@/hooks/use-share-link';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface QrCodeScreenProps {
  onBack: () => void;
}

export function QrCodeScreen({ onBack }: QrCodeScreenProps) {
  const { shareLink, getShareUrl } = useShareLink();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const profileUrl = getShareUrl();
  const isDevelopment = window.location.hostname.includes('lovableproject.com') || 
                       window.location.hostname === 'localhost';

  useEffect(() => {
    if (profileUrl && canvasRef.current && shareLink?.is_active) {
      generateQRCode();
    }
  }, [profileUrl, shareLink?.is_active]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !profileUrl) return;

    try {
      await QRCode.toCanvas(canvasRef.current, profileUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#8B5CF6',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Erreur lors de la génération du QR code');
    }
  };

  const handleCopyUrl = async () => {
    if (!profileUrl) return;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Lien copié dans le presse-papier');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = 'mon-profil-pliiiz-qr.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
    toast.success('QR code téléchargé');
  };

  const handleShare = async () => {
    if (!profileUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon profil PLIIIZ',
          text: 'Découvrez mon profil PLIIIZ pour mieux me connaître !',
          url: profileUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyUrl();
    }
  };

  if (!shareLink) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CommonHeader title="QR Code" onBack={onBack} />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Aucun lien de partage disponible</p>
        </div>
      </div>
    );
  }

  if (!shareLink.is_active) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CommonHeader title="QR Code" onBack={onBack} />
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">Votre lien de partage est désactivé</p>
          <p className="text-sm text-muted-foreground">
            Activez le partage de votre profil dans les paramètres pour générer un QR code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CommonHeader title="QR Code de mon profil" onBack={onBack} />
      
      <div className="p-6 space-y-6">
        {/* QR Code Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <CardContent className="p-8 text-center space-y-6 bg-card flex flex-col items-center justify-center">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <canvas 
                  ref={canvasRef}
                  className="block mx-auto"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Mon profil PLIIIZ</h2>
              <p className="text-sm text-muted-foreground">
                Scannez ce QR code pour accéder à mon profil
              </p>
            </div>
            
            {isDevelopment && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Mode développement :</strong> Ce QR code ne fonctionnera qu'après publication de votre application. 
                  Cliquez sur "Publish" en haut à droite pour rendre votre profil accessible.
                </p>
              </div>
            )}

            <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground break-all">
              {profileUrl}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="default" 
            className="w-full"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partager le lien
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleCopyUrl}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copier le lien
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleDownloadQR}
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger le QR code
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Comment utiliser ce QR code ?</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Partagez ce QR code avec vos proches
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Ils peuvent le scanner avec leur appareil photo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Ils accèdent directement à votre profil
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">4.</span>
                Plus besoin de chercher vos préférences !
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}