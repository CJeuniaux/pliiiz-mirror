import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { CurrentWant } from "@/types/pliiiz";
import gHome from "@/assets/g-home.webp";

interface CurrentWantsScreenProps {
  onNext: (currentWants: CurrentWant[]) => void;
  onBack: () => void;
}

export function CurrentWantsScreen({ onNext, onBack }: CurrentWantsScreenProps) {
  const [currentWants, setCurrentWants] = useState<CurrentWant[]>([]);
  const [newWantTitle, setNewWantTitle] = useState('');
  const [newWantNote, setNewWantNote] = useState('');
  const [newWantPriority, setNewWantPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const addCurrentWant = () => {
    if (newWantTitle.trim()) {
      const newWant: CurrentWant = {
        id: Date.now().toString(),
        title: newWantTitle.trim(),
        note: newWantNote.trim() || undefined,
        priority: newWantPriority
      };
      setCurrentWants(prev => [...prev, newWant]);
      setNewWantTitle('');
      setNewWantNote('');
      setNewWantPriority('medium');
    }
  };

  const removeCurrentWant = (id: string) => {
    setCurrentWants(prev => prev.filter(want => want.id !== id));
  };

  const handleSubmit = () => {
    onNext(currentWants);
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'Priorité';
      case 'medium': return 'Normal';
      case 'low': return 'Si l\'occasion se présente';
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${gHome})` }}>
      <div className="flex items-center justify-between px-[var(--plz-green-gutter)] pt-4">
        <PageHeader 
          title="Idées cadeaux" 
          subtitle="Étape 3/4"
          onBack={onBack}
        />
        <Button variant="ghost" onClick={() => onNext(currentWants)} className="text-white hover:bg-white/10">Passer</Button>
      </div>
      
      <div className="px-[var(--plz-green-gutter)] space-y-6">
        <SectionCard 
          title="Vos idées cadeaux"
          description="0 à 5 choses qui vous feraient vraiment plaisir en ce moment"
        >
          <div className="space-y-4">
            {/* Current wants list */}
            {currentWants.length > 0 && (
              <div className="space-y-3">
                {currentWants.map((want) => (
                  <div key={want.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{want.title}</p>
                          <Badge variant={getPriorityColor(want.priority)} className="text-xs">
                            {getPriorityLabel(want.priority)}
                          </Badge>
                        </div>
                        {want.note && (
                          <p className="text-xs text-muted-foreground">{want.note}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCurrentWant(want.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new want form */}
            {currentWants.length < 5 && (
              <div className="space-y-3 p-3 border-dashed border-2 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="wantTitle">Nouvelle idée cadeau</Label>
                  <Input
                    id="wantTitle"
                    placeholder="Ex: carnet pointillé A5, roman de Becky Chambers..."
                    value={newWantTitle}
                    onChange={(e) => setNewWantTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wantNote">Note (optionnel)</Label>
                  <Input
                    id="wantNote"
                    placeholder="Précisions, marque, couleur..."
                    value={newWantNote}
                    onChange={(e) => setNewWantNote(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={newWantPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewWantPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Priorité (urgent/très envie)</SelectItem>
                      <SelectItem value="medium">Normal</SelectItem>
                      <SelectItem value="low">Si l'occasion se présente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addCurrentWant}
                  disabled={!newWantTitle.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter cette idée
                </Button>
              </div>
            )}

            {currentWants.length === 5 && (
              <p className="text-xs text-muted-foreground text-center">
                Maximum 5 idées cadeaux
              </p>
            )}
          </div>
        </SectionCard>

        <div className="text-center text-xs text-muted-foreground">
          {currentWants.length === 0 && (
            <p>Vous pouvez aussi passer cette étape et ajouter vos idées cadeaux plus tard</p>
          )}
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}