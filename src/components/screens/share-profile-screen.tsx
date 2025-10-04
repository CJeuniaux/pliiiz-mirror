import React, { useState } from "react";
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
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
  const { user } = useAuth();
  const { data: meData, loading } = useMe();
  
  const shareUrl = meData?.shareUrl || "https://app.pliiiz.com/p/loading";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié dans le presse-papiers");
    } catch (err) {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleShareVia = (method: string) => {
    const message = encodeURIComponent(`Voici mon profil PLIIIZ : ${shareUrl}`);
    switch (method) {
      case "sms":
        window.open(`sms:?body=${message}`);
        break;
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent("Mon profil PLIIIZ")}&body=${message}`);
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${message}`);
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: "Mon profil PLIIIZ",
            text: "Découvre mes préférences cadeaux",
            url: shareUrl,
          });
        }
    }
  };

  const handleGenerateQR = () => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'mon-profil-pliiiz-qr.png';
    link.click();
    toast.success("QR code téléchargé !");
  };

  if (loading) {
    return (
      <ScreenFixedBG isAuth={true} topGap={0} padH={0} padB={24}>
        <div className="plz-appbar">
          <button onClick={onBack} className="plz-iconbtn">
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
          <button onClick={onBack} className="plz-iconbtn">
            <ArrowLeft size={20} />
          </button>
          <h1 className="plz-page-title">Partage désactivé</h1>
        </div>
        <div className="plz-content">
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
        <button onClick={onBack} className="plz-iconbtn">
          <ArrowLeft size={20} />
        </button>
        <h1 className="plz-page-title">Partager mon profil</h1>
      </div>
      
      <div className="plz-content space-y-4 overflow-y-auto pb-24">
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
                className="w-full bg-gradient-to-r from-[#ff9c6b] to-[#ff7cab] hover:opacity-90 text-white"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="pliiz-card">
          <CardContent>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerateQR}
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