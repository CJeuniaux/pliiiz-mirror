import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { TagInput } from "@/components/ui/tag-input";
import { Checkbox } from "@/components/ui/checkbox";
import { BUDGET_RANGES } from "@/types/pliiiz";
import gHome from "@/assets/g-home.webp";

interface PreferencesData {
  safeBets: string[];
  noGos: string[];
  alcoholAllowed: boolean;
  isVegetarian: boolean;
  budgetRanges: string[];
}

interface PreferencesScreenProps {
  onNext: (preferences: PreferencesData) => void;
  onBack: () => void;
}

export function PreferencesScreen({ onNext, onBack }: PreferencesScreenProps) {
  const [safeBets, setSafeBets] = useState<string[]>([]);
  const [noGos, setNoGos] = useState<string[]>([]);
  const [alcoholAllowed, setAlcoholAllowed] = useState(true);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [budgetRanges, setBudgetRanges] = useState<string[]>([]);

  const handleBudgetToggle = (budgetLabel: string) => {
    setBudgetRanges(prev =>
      prev.includes(budgetLabel)
        ? prev.filter(b => b !== budgetLabel)
        : [...prev, budgetLabel]
    );
  };

  const handleSubmit = () => {
    onNext({
      safeBets,
      noGos,
      alcoholAllowed,
      isVegetarian,
      budgetRanges
    });
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${gHome})` }}>
      <div className="flex items-center justify-between px-[var(--plz-green-gutter)] pt-4">
        <PageHeader 
          title="Préférences essentielles" 
          subtitle="Étape 2/4"
          onBack={onBack}
        />
        <Button variant="ghost" onClick={() => onNext({ safeBets, noGos, alcoholAllowed, isVegetarian, budgetRanges })} className="text-white hover:bg-white/10">Passer</Button>
      </div>
      
      <div className="p-4 space-y-6">
        <SectionCard 
          title="Safe bets (valeurs sûres)"
          description="3-5 choses que vous aimez à coup sûr"
        >
          <TagInput
            tags={safeBets}
            onTagsChange={setSafeBets}
            placeholder="Ex: chocolat noir, plantes vertes, livres..."
          />
        </SectionCard>

        <SectionCard 
          title="À éviter absolument"
          description="Les no-go à ne jamais offrir"
        >
          <TagInput
            tags={noGos}
            onTagsChange={setNoGos}
            placeholder="Ex: parfum fort, objets encombrants..."
          />
        </SectionCard>

        <SectionCard title="Contraintes alimentaires">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="vegetarian"
                checked={isVegetarian}
                onCheckedChange={(checked) => setIsVegetarian(checked === true)}
              />
              <label htmlFor="vegetarian" className="text-sm cursor-pointer">
                Régime végétarien
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="alcohol"
                checked={alcoholAllowed}
                onCheckedChange={(checked) => setAlcoholAllowed(checked === true)}
              />
              <label htmlFor="alcohol" className="text-sm cursor-pointer">
                Alcool autorisé
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title="Tranches de budget confortables"
          description="Dans quelles gammes de prix êtes-vous à l'aise ?"
        >
          <div className="space-y-3">
            {BUDGET_RANGES.map((range) => (
              <div key={range.label} className="flex items-center space-x-3">
                <Checkbox
                  id={range.label}
                  checked={budgetRanges.includes(range.label)}
                  onCheckedChange={() => handleBudgetToggle(range.label)}
                />
                <label htmlFor={range.label} className="text-sm cursor-pointer">
                  {range.label}
                </label>
              </div>
            ))}
          </div>
        </SectionCard>

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