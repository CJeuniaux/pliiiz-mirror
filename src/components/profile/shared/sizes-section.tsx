import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shirt } from "lucide-react";

interface SizesSectionProps {
  sizes: any;
  readOnly?: boolean;
  onEdit?: () => void;
}

export function SizesSection({ sizes, readOnly = false, onEdit }: SizesSectionProps) {
  const sizeEntries = Object.entries(sizes || {}).filter(([_, value]) => value);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Tailles
          </div>
          {!readOnly && onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sizeEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune taille renseignée</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sizeEntries.map(([key, value]) => (
              <div key={key} className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  {key === 'top' ? 'Haut' : 
                   key === 'bottom' ? 'Bas' : 
                   key === 'shoes' ? 'Chaussures' : 'Autre'}
                </div>
                <div className="font-semibold">{value as string}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}