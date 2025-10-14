import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { Gift, Users, Share } from "lucide-react";
import gHome from "@/assets/g-home.webp";

interface WelcomeScreenProps {
  onNext: (userData: { firstName: string; email: string; birthDate: string; country: string; city: string }) => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && email.trim() && birthDate && country.trim() && city.trim()) {
      onNext({ 
        firstName: firstName.trim(), 
        email: email.trim(),
        birthDate,
        country: country.trim(),
        city: city.trim()
      });
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${gHome})` }}>
      {/* Header with Skip aligned to green gutter */}
      <div className="flex justify-end items-center px-[var(--plz-green-gutter)] pt-4">
        <Button variant="ghost" onClick={() => onNext({ firstName: '', email: '', birthDate: '', country: '', city: '' })} className="text-white hover:bg-white/10">
          Passer
        </Button>
      </div>
      <PageHeader title="Bienvenue sur PLIIIZ" />
      
      <div className="px-[var(--plz-green-gutter)] space-y-6">
        {/* App explanation */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-[#2F4B4E] mb-2">
            Bienvenue sur Pliiiz
          </h1>
          <h2 className="text-xl font-semibold text-[#2F4B4E] mb-2">
            Partagez vos préférences cadeaux
          </h2>
          <p className="text-[#2F4B4E]/80 text-sm leading-relaxed">
            Créez votre profil de préférences pour aider vos proches à choisir 
            le cadeau parfait selon l'occasion.
          </p>
        </div>


        {/* Sign up form */}
        <SectionCard title="Création de compte">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance *</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Input
                id="country"
                type="text"
                placeholder="France"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                type="text"
                placeholder="Paris"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <p className="text-xs text-[#2F4B4E]/70">
              En créant un compte, vous acceptez nos conditions d'utilisation 
              et notre politique de confidentialité (RGPD).
            </p>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#375558] to-[#618185] text-white hover:opacity-90"
              disabled={!firstName.trim() || !email.trim() || !birthDate || !country.trim() || !city.trim()}
            >
              Créer mon profil PLIIIZ
            </Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}