import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final.svg";
import gHome from "@/assets/g-home.webp";

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
  onResendEmail: () => void;
}

export function EmailConfirmationScreen({ email, onBack, onResendEmail }: EmailConfirmationScreenProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const handleResend = async () => {
    if (cooldownTime > 0) return;
    
    setIsResending(true);
    await onResendEmail();
    setIsResending(false);
    
    // Start 60-second cooldown
    setCooldownTime(60);
    const interval = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6" style={{ backgroundImage: `url(${gHome})` }}>
      {/* Logo */}
      <div className="mb-8">
        <img 
          src={pliiizLogoWhite}
          alt="PLIIIZ"
          className="h-28 w-auto"
        />
      </div>

      {/* Confirmation Card */}
      <Card className="w-full max-w-md bg-white">
        <CardContent className="p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Vérifiez votre email</h1>
            <p className="text-muted-foreground">
              Nous avons envoyé un lien de confirmation à :
            </p>
            <p className="font-medium text-foreground">{email}</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cliquez sur le lien dans l'email pour activer votre compte et continuer la configuration de votre profil.
            </p>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResend}
                disabled={isResending || cooldownTime > 0}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : cooldownTime > 0 ? (
                  `Renvoyer dans ${cooldownTime}s`
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Renvoyer l'email
                  </>
                )}
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={onBack}
              >
                Retour à la connexion
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>
              Vous ne recevez pas l'email ? Vérifiez vos spams ou contactez le support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}