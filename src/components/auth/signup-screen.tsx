import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final.svg";
import gHome from "@/assets/g-home.webp";

interface SignupScreenProps {
  onBack: () => void;
  onSignupSuccess: (email: string, needsConfirmation: boolean) => void;
}

export function SignupScreen({ onBack, onSignupSuccess }: SignupScreenProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!firstName || !email || !password || !confirmPassword || !acceptTerms) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    setIsLoading(true);
    
    const { error, needsConfirmation } = await signUp(email, password, firstName, lastName, birthday, city, country);
    
    setIsLoading(false);
    
    if (!error) {
      onSignupSuccess(email, needsConfirmation);
    }
  };

  const isFormValid = firstName && email && password && confirmPassword && password === confirmPassword && acceptTerms;

  return (
    <div className="min-h-screen flex items-center justify-center overflow-y-auto py-12 px-[var(--plz-outer-margin)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            src={pliiizLogoWhite}
            alt="PLIIIZ"
            className="h-16 w-auto mx-auto mb-8 filter drop-shadow-lg"
          />
        </div>

        <Card className="bg-white shadow-2xl"> 
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
              <p className="text-white text-sm">
                Vos préférences cadeaux vous attendent, prêtes à sauver vos proches des faux pas !
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white font-medium">Prénom *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white font-medium">Nom (optionnel)</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  disabled={isLoading}
                  className="h-12"
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-white mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-white font-medium">Date de naissance</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-white font-medium">Ville</Label>
                <Input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Votre ville"
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-white font-medium">Pays</Label>
                <Input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Votre pays"
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor="terms" 
                  className="text-sm leading-relaxed cursor-pointer text-white"
                >
                  J'accepte les conditions générales d'utilisation
                </Label>
              </div>

              <Button 
                className="btn-orange w-full h-14 mt-6" 
                onClick={handleSignup}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "CRÉATION..." : "CRÉER UN COMPTE"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-white">
            Déjà un compte ?{" "}
            <button 
              onClick={onBack}
              className="text-white font-semibold hover:underline"
              disabled={isLoading}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}