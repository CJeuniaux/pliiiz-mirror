import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function KitOnboardingScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background px-4">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center py-8">
        {/* Content blocks - simulating the wireframe text blocks */}
        <div className="space-y-6 mb-12">
          <div className="space-y-4">
            <div className="h-4 bg-primary rounded-full"></div>
            <div className="h-4 bg-primary rounded-full w-3/4"></div>
            <div className="h-4 bg-primary rounded-full w-1/2"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-full"></div>
            <div className="h-3 bg-muted rounded-full w-1/4"></div>
          </div>
        </div>

        {/* Actual onboarding content */}
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-[#2F4B4E] mb-4">
              Bienvenue sur Pliiiz
            </h1>
            <p className="text-muted-foreground mb-6">
              Découvrez une nouvelle façon de partager et de recevoir des cadeaux parfaits pour chaque occasion.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Créez votre profil personnalisé</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Partagez vos préférences</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Recevez des suggestions parfaites</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA Button */}
      <div className="pb-8">
        <Button 
          variant="kit" 
          size="lg" 
          className="w-full h-14 text-white"
          onClick={() => navigate('/onboarding/preferences')}
        >
          Commencer
        </Button>
      </div>

      {/* Bottom indicator */}
      <div className="pb-4 flex justify-center">
        <div className="h-1 w-12 bg-muted rounded-full"></div>
      </div>
    </div>
  );
}