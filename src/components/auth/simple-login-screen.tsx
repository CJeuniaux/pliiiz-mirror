import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Smartphone } from "lucide-react";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final.svg";
import gHome from "@/assets/g-home.webp";
import { InstallHelpModal } from "@/components/modals/install-help-modal";

export function SimpleLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
    // Navigation is handled by the useEffect in Login.tsx
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
      <div className="min-h-screen flex items-center justify-center px-[var(--plz-outer-margin)]">
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
                <h1 className="text-3xl font-bold text-white">Mot de passe oublié</h1>
                <p className="text-white text-base">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="resetEmail" className="text-white font-medium text-sm block">Email</label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  disabled={isResetting}
                  className="h-12"
                />
                </div>

                <Button 
          className="btn-orange w-full h-14"
                  onClick={handlePasswordReset}
                  disabled={isResetting || !resetEmail}
                >
                  {isResetting ? "Envoi..." : "Envoyer le lien"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <button 
              onClick={() => setShowForgotPassword(false)}
              className="text-white hover:opacity-80 transition-colors"
              disabled={isResetting}
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-[var(--plz-outer-margin)]">
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
              <h1 className="text-3xl font-bold text-white">Connexion</h1>
              <p className="text-white text-base">
                Connectez-vous à votre compte PLIIIZ
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-white font-medium text-sm block">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="charlotte.j@kikk.be"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-white font-medium text-sm block">Mot de passe</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="h-12"
                />
                <div className="text-right">
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-white text-sm hover:opacity-80 transition-colors"
                    disabled={isLoading}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>

              <Button 
                className="btn-orange w-full h-14" 
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-white">
            Pas encore de compte ?{" "}
            <button 
              onClick={() => navigate('/register')}
              className="text-white font-semibold hover:underline"
              disabled={isLoading}
            >
              Créer un compte
            </button>
          </p>

          <button
            onClick={() => setShowInstallHelp(true)}
            className="btn-orange inline-flex items-center justify-center gap-2 px-6 py-3"
            disabled={isLoading}
          >
            <Smartphone className="h-5 w-5" />
            Comment installer l'app ?
          </button>
        </div>

        <InstallHelpModal 
          open={showInstallHelp} 
          onClose={() => setShowInstallHelp(false)} 
        />

      </div>
    </div>
  );
}
