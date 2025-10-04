import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import pliiizLogoWhite from "@/assets/branding/pliiiz-logo-white-final.svg";
import bgScreens from "@/assets/bg-screens.webp";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    // Basic SEO
    document.title = "Réinitialiser le mot de passe | Pliiiz";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Réinitialisez votre mot de passe Pliiiz en toute sécurité.");

    // Detect recovery session from URL hash and Supabase
    const urlHasRecovery = window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery");

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || !!session) {
        setHasRecoverySession(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session || urlHasRecovery) setHasRecoverySession(true);
    });

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRecoverySession) {
      toast.error("Lien invalide ou expiré. Relancez 'Mot de passe oublié'.");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Mot de passe mis à jour. Vous êtes connecté(e).", { duration: 2500 });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error("Impossible de mettre à jour le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            src={pliiizLogoWhite}
            alt="PLIIIZ"
            className="h-16 w-auto mx-auto mb-8 filter drop-shadow-lg"
          />
        </div>

        <Card className="bg-white/15 backdrop-blur-xl border-white/30 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Réinitialiser le mot de passe</h1>
              <p className="text-white/90 text-base">
                Définissez votre nouveau mot de passe
              </p>
            </div>
            
            {!hasRecoverySession && (
              <p className="text-sm text-white/90">
                Ouvrez le lien depuis l'email de réinitialisation pour définir un nouveau mot de passe.
              </p>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-white font-medium text-sm">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  autoFocus
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/50 h-12 rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-white font-medium text-sm">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="********"
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/50 h-12 rounded-lg"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-14 text-base font-bold rounded-full bg-gradient-to-r from-[#ff9c6b] to-[#ff7cab] hover:opacity-90 transition-opacity shadow-lg"
                  disabled={loading}
                >
                  {loading ? "Mise à jour…" : "Mettre à jour"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => navigate("/")} 
                  className="flex-1 h-14 text-base font-semibold rounded-full bg-white/20 border-white/30 text-white hover:bg-white/25"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ResetPassword;