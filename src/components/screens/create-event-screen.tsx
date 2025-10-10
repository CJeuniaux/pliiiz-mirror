import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvents } from "@/hooks/use-events-enhanced";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

// Import event images
import birthdayImg from "@/assets/generated/events/birthday-elegant.jpg";
import dinnerImg from "@/assets/generated/events/dinner-elegant.jpg";
import brunchImg from "@/assets/generated/events/brunch.jpg";
import housewarmingImg from "@/assets/generated/events/housewarming.jpg";
import secretSantaImg from "@/assets/generated/events/secret-santa.jpg";

interface CreateEventScreenProps {
  onBack: () => void;
  onEventCreated?: (eventData: EventData) => void;
}

interface EventData {
  title: string;
  type: string;
  date: string;
  location?: string;
  description?: string;
  shareLink: string;
}

const eventTypes = [
  { value: "birthday", label: "Anniversaire", image: birthdayImg },
  { value: "dinner", label: "Dîner", image: dinnerImg },
  { value: "brunch", label: "Brunch", image: brunchImg },
  { value: "housewarming", label: "Crémaillère", image: housewarmingImg },
  { value: "secret-santa", label: "Secret Santa", image: secretSantaImg },
];

export function CreateEventScreen({ onBack, onEventCreated }: CreateEventScreenProps) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isCreated, setIsCreated] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !eventType || !date) return;

    // Generate a unique share link
    const eventId = Math.random().toString(36).substring(2, 15);
    const generatedLink = `${window.location.origin}/event/${eventId}`;
    
    const eventData: EventData = {
      title,
      type: eventType,
      date,
      location,
      description,
      shareLink: generatedLink
    };

    setShareLink(generatedLink);
    setIsCreated(true);
    
    toast.success("Événement créé avec succès !");
    onEventCreated?.(eventData);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Lien copié !");
    } catch (error) {
      toast.error("Erreur lors de la copie du lien");
    }
  };

  const generateQR = () => {
    // Create a simple QR code URL (using a free service)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`;
    
    // Create a download link
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-code-${title}.png`;
    link.click();
    
    toast.success("QR Code téléchargé !");
  };

  if (isCreated) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader 
          title="Événement créé !"
          onBack={onBack}
        />
        
        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Share2 className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">{title}</h2>
                <p className="text-muted-foreground mb-4">
                  Partage ce lien avec tes invités pour qu'ils puissent te faire des demandes d'accès à ton profil
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <input 
                    type="text" 
                    value={shareLink} 
                    readOnly 
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyLink} className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Copier le lien
                  </Button>
                  <Button onClick={generateQR} variant="outline">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={onBack} variant="outline" className="w-full">
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Créer un événement"
        onBack={onBack}
      />
      
      <div className="p-4 pb-20 overflow-y-auto" style={{ height: 'calc(100vh - 88px)' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'événement *</Label>
            <Input
              id="title"
              placeholder="Ex: Mon anniversaire"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Type d'événement *</Label>
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map((event) => (
                <button
                  key={event.value}
                  type="button"
                  onClick={() => setEventType(event.value)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                    eventType === event.value ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img 
                    src={event.image} 
                    alt={event.label}
                    className="w-full h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{event.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date de l'événement *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Lieu (optionnel)</Label>
            <Input
              id="location"
              placeholder="Ex: Chez moi, Restaurant..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Détails sur l'événement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button - Bouton "Créer" = mauve selon brief §4.9 */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--btn-mauve-hover))] text-white"
              disabled={!title || !eventType || !date}
            >
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}