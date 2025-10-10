import React, { useState, useEffect } from "react";
import QRCode from 'qrcode';
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
import { canonicalProfileUrl } from "@/lib/share";
import { launchEmail } from "@/lib/email-launcher";
import { useUniversalBack } from "@/hooks/use-universal-back";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  QrCode, 
  Copy, 
  MessageSquare, 
  Mail, 
  Share2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useMe } from "@/hooks/use-me";

interface ShareProfileScreenProps {
  onBack: () => void;
}

export function ShareProfileScreen({ onBack }: ShareProfileScreenProps) {
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;
  
  const { user } = useAuth();
  const { data: meData, loading } = useMe();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const slug = meData?.shareLink?.slug || (meData as any)?.shareSlug || (meData as any)?.slug;
  const shareUrl = slug ? canonicalProfileUrl(slug) : "https://pliiiz.app/p/loading";

  // Generate QR code whenever shareUrl changes
  useEffect(() => {
    if (shareUrl && shareUrl !== "https://pliiiz.app/p/loading") {
      QRCode.toDataURL(shareUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then(setQrDataUrl)
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [shareUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié dans le presse-papiers");
    } catch (err) {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleShareVia = async (method: string) => {
    const text = `Voici mon profil PLIIIZ : ${shareUrl}`;
    const message = encodeURIComponent(text);
    try {
      switch (method) {
        case "sms": {
          const a = document.createElement('a');
          a.href = `sms:?&body=${message}`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
          break;
        }
        case "email": {
          await launchEmail({ to: "", subject: "Mon profil PLIIIZ", body: text });
          break;
        }
        case "whatsapp": {
          const a = document.createElement('a');
          a.href = `https://wa.me/?text=${message}`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
          break;
        }
        default: {
          if (window.top === window.self && navigator.share) {
            await navigator.share({
              title: "Mon profil PLIIIZ",
              text: "Découvre mes préférences cadeaux",
              url: shareUrl,
            });
          } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Lien copié dans le presse-papiers");
          }
        }
      }
    } catch (err) {
      console.error(err);
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Lien copié dans le presse-papiers");
      } catch (e) {
        toast.error("Impossible de partager le lien");
      }
    }
  };

  const handleGenerateQR = () => {
    if (!qrDataUrl) {
      toast.error("QR code en cours de génération...");
      return;
    }
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'mon-profil-pliiiz-qr.png';
    link.click();
    toast.success("QR code téléchargé !");
  };

  if (loading) {
    return (
      <ScreenFixedBG isAuth={true} topGap={0} padH={0} padB={24}>
        <div className="plz-appbar">
          <button onClick={handleBack} className="plz-iconbtn">
            <ArrowLeft size={20} />
          </button>
          <h1 className="plz-page-title">Chargement...</h1>
        </div>
      </ScreenFixedBG>
    );
  }

  if (!meData?.shareLink?.is_active) {
    return (
      <ScreenFixedBG isAuth={true} topGap={0} padH={0} padB={24}>
        <div className="plz-appbar">
          <button onClick={handleBack} className="plz-iconbtn">
            <ArrowLeft size={20} />
          </button>
          <h1 className="plz-page-title">Partage désactivé</h1>
        </div>
        <div>
          <Card className="pliiz-card">
            <CardContent>
              <p className="text-white">Votre lien de partage n'est pas actif. Activez-le dans les paramètres.</p>
            </CardContent>
          </Card>
        </div>
      </ScreenFixedBG>
    );
  }

  return (
    <ScreenFixedBG isAuth={true} topGap={0} padH={0} padB={24}>
      <div className="plz-appbar">
        <button onClick={handleBack} className="plz-iconbtn">
          <ArrowLeft size={20} />
        </button>
        <h1 className="plz-page-title">Partager mon profil</h1>
      </div>
      
      <div className="space-y-4 overflow-y-auto pb-24">
        {/* Lien de partage */}
        <Card className="pliiz-card">
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Ton lien de partage</h2>
              <p className="text-sm text-white/80">Partage ce lien pour que tes proches accèdent à tes préférences</p>
            </div>
            
            <div className="space-y-3">
              <Input
                value={shareUrl}
                readOnly
                className="w-full text-sm text-white bg-white/20 border-white/30"
              />
              
              <Button
                className="btn-orange w-full"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="pliiz-card share-profile-card">
          <CardContent className="space-y-4">
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR Code profil Pliiiz" className="w-48 h-48" />
              </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerateQR}
              disabled={!qrDataUrl}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Télécharger le QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Partager via */}
        <Card className="pliiz-card">
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Partager via</h2>
              <p className="text-sm text-white/80">Choisis comment envoyer ton lien</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center gap-1"
                onClick={() => handleShareVia("sms")}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">SMS</span>
              </Button>
              
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center gap-1"
                onClick={() => handleShareVia("email")}
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Email</span>
              </Button>
              
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center gap-1"
                onClick={() => handleShareVia("whatsapp")}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center justify-center gap-1"
                onClick={() => handleShareVia("native")}
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Partager</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conseils */}
        <Card className="pliiz-card">
          <CardContent>
            <h3 className="font-medium mb-2 text-white">💡 Conseils</h3>
            <ul className="text-sm text-white/90 space-y-1">
              <li>• Partage ton lien avant un événement</li>
              <li>• Mets à jour tes préférences régulièrement</li>
              <li>• Le lien reste actif en permanence</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ScreenFixedBG>
  );
}