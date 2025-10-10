import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recycle, Calendar, User, Gift } from "lucide-react";

interface MyRegiftScreenProps {
  onBack: () => void;
}

export function MyRegiftScreen({ onBack }: MyRegiftScreenProps) {
  const regiftItems = [
    {
      id: "1",
      title: "Livre d'architecture moderne",
      from: "Thomas L.",
      receivedDate: "2024-01-15",
      status: "available",
      category: "Livres"
    },
    {
      id: "2", 
      title: "Plante pothos",
      from: "Zoé D.",
      receivedDate: "2024-02-20",
      status: "offered",
      category: "Plantes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Mon Regift" 
        count={regiftItems.length}
        onBack={onBack}
      />
      
      <div className="p-4 space-y-4 overflow-y-auto pb-20" style={{ height: 'calc(100vh - 68px - 64px)' }}>
        {/* Regift Info */}
        <Card>
          <CardContent className="p-4 text-center space-y-2">
            <Recycle className="h-8 w-8 mx-auto text-[#1DB954]" />
            <p className="text-sm text-muted-foreground">
              Donne une seconde vie aux cadeaux que tu n'utilises pas
            </p>
          </CardContent>
        </Card>

        {/* Regift Items */}
        <div className="space-y-3">
          {regiftItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      <span>Reçu de {item.from}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.receivedDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={item.status === 'available' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {item.status === 'available' ? 'Disponible' : 'Offert'}
                  </Badge>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Gift className="h-3 w-3 mr-1" />
                    Offrir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                  >
                    Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {regiftItems.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Recycle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun objet en regift pour le moment
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}