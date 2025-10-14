import React, { useState } from "react";
import { HeroHeader } from "@/components/ui/hero-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Lightbulb, User, Plus, Settings, Share } from "lucide-react";
import { useProfile } from "@/hooks/use-profile-enhanced";
import { usePreferences } from "@/hooks/use-preferences-enhanced";
import { useContacts } from "@/hooks/use-contacts-real";
import { getDayOfYear } from "date-fns";


interface HomeScreenProps {
  onOfferGift?: (giftTitle: string, contactName: string) => void;
  onViewContactProfile?: (contactId: string) => void;
  onNavigateToPreferences?: () => void;
  onNavigateToContacts?: () => void;
  onNavigateToShare?: () => void;
  onNavigateToCreateEvent?: () => void;
  onNavigateToReceivedRequests?: () => void;
  onNavigateToSentRequests?: () => void;
  onNavigateToCalendar?: () => void;
}

const tips = [
  "Pense à la wishlist : demande discrètement la liste de souhaits pour éviter les doublons et les faux pas.",
  "Misez sur le gourmand : chocolats, biscuits maison ou bonne bouteille, ça fait toujours plaisir et ça ne traîne jamais.",
  "Fixe ton budget avant de flâner, tu profiteras plus de la recherche sans stress.",
  "Et si tu offrais un souvenir ? Une expérience (atelier, concert, massage…) marque souvent plus qu’un objet matériel.",
  "Soigne l’emballage : papier coloré, ruban, petit mot… la magie est aussi dans le détail.",
  "Allergies et interdits : n’oublie pas de respecter la santé et les convictions de l’autre.",
  "Seconde main, mais première intention : un bel objet chiné est unique, écolo et personnel.",
  "Vérifie les tailles et préférences : rien de plus gênant qu’un vêtement trop petit ou une déco qui ne colle pas.",
  "Petit plus malin : un accessoire utile au quotidien vaut mieux qu’un gadget qui prend la poussière.",
  "Cadeau à son image, pas à la tienne : choisis selon ses goûts, même si toi tu ne l’aurais jamais acheté.",
  "Le timing, c’est clé : un cadeau à l’heure, même simple, fait plus plaisir qu’une merveille en retard.",
  "Carte cadeau ? Oui, mais bien ciblée : dans son magasin préféré, c’est un coup sûr, ailleurs ça peut tomber à plat.",
  "Fais simple : un petit geste pensé vaut mieux qu’un gros cadeau impersonnel.",
  "Ajoute une touche maison : un dessin, une carte ou un emballage DIY changent tout.",
  "Un cadeau utile, c’est souvent le plus apprécié : pense à ce qui facilite sa vie.",
  "Tu hésites ? Demande conseil à un proche de la personne, c’est rarement une mauvaise idée.",
  "Un abonnement (musique, magazine, box mensuelle) prolonge le plaisir bien après la fête.",
  "Le cadeau groupé entre amis ou famille peut permettre un vrai coup de cœur que chacun n’aurait pas pu offrir seul.",
  "Ne néglige pas la présentation : une mise en scène, un petit jeu ou une devinette rendent l’ouverture plus fun.",
  "Un cadeau surprise de « non-anniversaire » fait aussi plaisir : l’effet inattendu compte beaucoup.",
  "Évite les clichés : offre en fonction de sa personnalité, pas de son genre ou de son âge.",
  "Un cadeau immatériel (playlist, album photo, vidéo souvenir) touche droit au cœur.",
  "Prends le temps d’écouter : souvent, la personne a déjà laissé échapper des indices sans s’en rendre compte.",
  "Ne te mets pas la pression : l’intention et l’attention comptent toujours plus que le prix."
];

const tip = tips[getDayOfYear(new Date()) % tips.length];

export function HomeScreen({ 
  onOfferGift, 
  onViewContactProfile, 
  onNavigateToPreferences, 
  onNavigateToContacts, 
  onNavigateToShare,
  onNavigateToCreateEvent,
  onNavigateToReceivedRequests,
  onNavigateToSentRequests,
  onNavigateToCalendar
}: HomeScreenProps) {
  const { profile } = useProfile();
  const { preferences } = usePreferences();
  const { contacts } = useContacts();
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  const firstName = profile?.first_name || '';
  
  // Check if user has empty states
  const hasContacts = contacts && contacts.length > 0;
  const hasPreferences = preferences && (
    preferences.likes.length > 0 || 
    preferences.current_wants.length > 0 || 
    preferences.allergies.length > 0 ||
    preferences.dislikes.length > 0
  );

  return (
    <div className="bg-background">
      <HeroHeader 
        title="Accueil" 
        subtitle="Trouvons ensemble le cadeau parfait pour tes proches"
      />
      
      <div className="p-4 space-y-6 pb-20">
        {/* Welcome */}
        <div className="text-center py-6">
          <h1 className="title-brand mb-3">
            Bonjour{firstName ? ` ${firstName}` : ''} ! 👋
          </h1>
          <p className="text-muted-foreground text-base font-inter">
            Trouvons ensemble le cadeau parfait pour tes proches
          </p>
        </div>

        {/* Daily Tip - After welcome section */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl p-4 shadow-lg">
          <div>
            <h3 className="font-bold mb-2 text-white">Conseils du jour</h3>
            <p className="text-white/90 text-sm leading-relaxed">{randomTip}</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Create Event Card */}

          {/* Access Requests Received */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Demandes reçues</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Consulte les demandes d'accès à ton profil pour tes événements
                  </p>
                  <Button onClick={onNavigateToReceivedRequests} variant="outline">
                    Voir les demandes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Requests Sent */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Share className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Mes demandes envoyées</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Suis tes demandes d'accès aux profils d'autres personnes
                  </p>
                  <Button onClick={onNavigateToSentRequests} variant="outline">
                    Voir mes demandes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!hasPreferences && (
            <Card className="border-2 border-dashed border-muted text-center p-8">
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Mes idées cadeaux</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Renseigne tes goûts pour aider tes proches à te faire plaisir
                  </p>
                  <Button onClick={onNavigateToPreferences}>
                    <Settings className="h-4 w-4 mr-2" />
                    Mes idées cadeaux
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* No mock events - only show if real events exist */}

      </div>
    </div>
  );
}