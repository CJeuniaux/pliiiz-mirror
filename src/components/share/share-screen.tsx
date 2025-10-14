import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { Share, Copy, QrCode, Mail, MessageCircle } from "lucide-react";
import { useMockStore } from "@/hooks/use-storage";

interface ShareScreenProps {
  onBack: () => void;
}

export function ShareScreen({ onBack }: ShareScreenProps) {
  const { currentUser } = useMockStore();
  const [customMessage, setCustomMessage] = useState('');
  
  if (!currentUser) return null;

  const shareUrl = `https://app.pliiiz.com/p/${currentUser.id}`;
  const defaultMessage = `Salut ! J'ai créé mon profil PLIIIZ pour t'aider à choisir le cadeau parfait selon l'occasion 🎁\n\nRegarde : ${shareUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Show toast in real app
      console.log('Lien copié !');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const shareVia = (method: string) => {
    const message = customMessage || defaultMessage;
    
    switch (method) {
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('Mon profil PLIIIZ')}&body=${encodeURIComponent(message)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: 'Mon profil PLIIIZ',
            text: message,
            url: shareUrl
          });
        } else {
          copyLink();
        }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Partager mon profil" 
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6">
        <SectionCard 
          title="Lien de partage"
          description="Copiez ce lien pour le partager facilement"
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1 bg-muted"
              />
              <Button variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => shareVia('qr')}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Générer un QR Code
            </Button>
          </div>
        </SectionCard>

        <SectionCard 
          title="Message personnalisé"
          description="Modifiez le message qui accompagnera votre lien"
        >
          <div className="space-y-3">
            <textarea
              className="w-full p-3 border rounded-lg text-sm min-h-[120px] bg-background"
              placeholder={defaultMessage}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser le message par défaut
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Partager via">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => shareVia('sms')}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">SMS</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => shareVia('email')}
            >
              <Mail className="h-5 w-5" />
              <span className="text-sm">Email</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => shareVia('whatsapp')}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">WhatsApp</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => shareVia('native')}
            >
              <Share className="h-5 w-5" />
              <span className="text-sm">Autre</span>
            </Button>
          </div>
        </SectionCard>

        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">💡 Conseil</h4>
          <p className="text-xs text-muted-foreground">
            Partagez votre lien dans vos stories Instagram, par email familial, 
            ou ajoutez-le dans votre signature d'email. Plus vos proches connaissent 
            votre profil, meilleurs seront vos cadeaux !
          </p>
        </div>
      </div>
    </div>
  );
}