import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface CurrentWant {
  id: string;
  title: string;
  category: string;
}

interface CurrentWantsEditScreenProps {
  onBack: () => void;
  initialWants?: CurrentWant[];
  onSave: (wants: CurrentWant[]) => void;
}

export function CurrentWantsEditScreen({ onBack, initialWants = [], onSave }: CurrentWantsEditScreenProps) {
  const [wants, setWants] = useState<CurrentWant[]>(initialWants);
  const [newWant, setNewWant] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleAddWant = () => {
    if (newWant.trim() && newCategory.trim()) {
      const want: CurrentWant = {
        id: Date.now().toString(),
        title: newWant.trim(),
        category: newCategory.trim()
      };
      setWants([...wants, want]);
      setNewWant("");
      setNewCategory("");
    }
  };

  const handleRemoveWant = (id: string) => {
    setWants(wants.filter(want => want.id !== id));
  };

  const handleSave = () => {
    onSave(wants);
    onBack();
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Mes idées cadeaux" 
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {/* Add new want */}
        <Card className="card-soft">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-outfit font-extrabold">Ajouter une idée cadeau</h3>
            <div className="space-y-3">
              <Input
                placeholder="Titre (ex: Chocolat noir 85%)"
                value={newWant}
                onChange={(e) => setNewWant(e.target.value)}
                className="input-rounded"
              />
              <Input
                placeholder="Catégorie (ex: Gourmandises)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-rounded"
              />
              <Button
                onClick={handleAddWant}
                disabled={!newWant.trim() || !newCategory.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                AJOUTER
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current wants */}
        <div className="space-y-3">
          {wants.map((want) => (
            <Card key={want.id} className="card-soft">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate-1">{want.title}</h4>
                    <p className="text-xs text-muted-foreground truncate-1">{want.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleRemoveWant(want.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {wants.length === 0 && (
          <Card className="card-soft">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-outfit font-extrabold mb-2">Aucune idée cadeau</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajoute tes idées cadeaux pour que tes proches puissent t'offrir ce qui te fait vraiment plaisir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          className="w-full"
          size="lg"
        >
          ENREGISTRER
        </Button>
      </div>
    </div>
  );
}