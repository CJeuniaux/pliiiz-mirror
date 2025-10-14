import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final.svg";

interface LoginScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LoginScreen({ onLogin, onRegister }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    // Don't call onLogin() here - let the auth hook handle navigation
  };


  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(email);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return;
    
    setIsResetting(true);
    const { error } = await resetPassword(resetEmail);
    setIsResetting(false);
    
    if (!error) {
      setShowForgotPassword(false);
      setResetEmail("");
    }
  };

  if (showForgotPassword) {
    return (
      <ScreenFixedBG isAuth={false} topGap={50} padH={24} padB={24}>
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <img 
            src={pliiizLogoWhite}
            alt="PLIIIZ"
            className="h-28 w-auto"
          />
        </div>

        {/* Reset Form */}
        <Card className="w-full max-w-md bg-white">
          <CardContent className="p-8 space-y-6">
            <div className="text-center mb-8">
              <h1 className="title-brand" style={{ color: '#4B5563' }}>Mot de passe oublié</h1>
              <p className="mt-3 text-base" style={{ color: '#4B5563' }}>
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="resetEmail" className="font-inter font-medium" style={{ color: '#4B5563' }}>Email</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="votre@email.com"
                disabled={isResetting}
              />
            </div>

            <Button 
              className="w-full mt-6 bg-gradient-to-r from-[#5A7A7E] to-[#405F62] hover:opacity-90 text-white font-semibold"
              onClick={handlePasswordReset}
              disabled={isResetting || !resetEmail}
            >
              {isResetting ? "Envoi..." : "Envoyer le lien"}
            </Button>

            <div className="text-center pt-6">
              <button 
                onClick={() => setShowForgotPassword(false)}
                className="text-primary hover:underline font-medium transition-colors duration-200"
                disabled={isResetting}
              >
                Retour à la connexion
              </button>
            </div>
          </CardContent>
        </Card>
      </ScreenFixedBG>
    );
  }

  return (
    <ScreenFixedBG isAuth={false} topGap={50} padH={24} padB={24}>
      {/* Logo */}
      <div className="mb-12 flex justify-center">
        <img 
          src={pliiizLogoWhite}
          alt="PLIIIZ"
          className="h-28 w-auto"
        />
      </div>

      {/* Login Form */}
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-8 space-y-6">
          <div className="text-center mb-8">
            <h1 className="title-brand" style={{ color: '#4B5563' }}>Connexion</h1>
            <p className="mt-3 text-base" style={{ color: '#4B5563' }}>
              Connectez-vous à votre compte PLIIIZ
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="email" className="font-inter font-medium" style={{ color: '#4B5563' }}>Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="font-inter font-medium" style={{ color: '#4B5563' }}>Mot de passe</Label>
              <button 
                type="button"
                onClick={() => handleForgotPassword()}
                className="text-sm text-primary hover:underline font-inter"
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={isLoading}
            />
          </div>

          <Button 
            className="w-full mt-6 bg-gradient-to-r from-[#5A7A7E] to-[#405F62] hover:opacity-90 text-white font-semibold" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>


          <div className="text-center pt-6">
            <p className="text-base font-inter" style={{ color: '#4B5563' }}>
              Pas encore de compte ?{" "}
              <button 
                onClick={onRegister}
                className="text-primary hover:underline font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                Créer un compte
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

    </ScreenFixedBG>
  );
}