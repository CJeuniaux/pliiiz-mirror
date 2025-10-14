import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { EventType, EVENT_TYPE_LABELS } from "@/types/pliiiz";
import gHome from "@/assets/g-home.webp";

interface EventTypesScreenProps {
  onNext: (selectedEventTypes: EventType[]) => void;
  onBack: () => void;
}

export function EventTypesScreen({ onNext, onBack }: EventTypesScreenProps) {
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);

  const handleEventTypeToggle = (eventType: EventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(eventType)
        ? prev.filter(t => t !== eventType)
        : [...prev, eventType]
    );
  };

  const handleSubmit = () => {
    onNext(selectedEventTypes);
  };

  const eventTypesList = Object.entries(EVENT_TYPE_LABELS) as [EventType, string][];

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat text-white" style={{ backgroundImage: `url(${gHome})` }}>
      <div className="flex items-center justify-between p-4">
        <PageHeader 
          title="Types d'événements" 
          subtitle="Étape 1/4"
          onBack={onBack}
        />
        <Button variant="ghost" onClick={() => onNext([])} className="text-white hover:bg-white/10">
          Passer
        </Button>
      </div>
      
      <div className="px-[var(--plz-green-gutter)] space-y-6">
        <SectionCard 
          title="Quels événements vous concernent ?"
          description="Sélectionnez les occasions pour lesquelles vous recevez souvent des cadeaux"
        >
          <div className="space-y-3">
            {eventTypesList.map(([eventType, label]) => (
              <div key={eventType} className="flex items-center space-x-3">
                <Checkbox
                  id={eventType}
                  checked={selectedEventTypes.includes(eventType)}
                  onCheckedChange={() => handleEventTypeToggle(eventType)}
                />
                <label 
                  htmlFor={eventType} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="text-center text-xs text-muted-foreground">
          {selectedEventTypes.length > 0 && (
            <p>{selectedEventTypes.length} événement{selectedEventTypes.length > 1 ? 's' : ''} sélectionné{selectedEventTypes.length > 1 ? 's' : ''}</p>
          )}
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
          disabled={selectedEventTypes.length === 0}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}