import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Star } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { PreferenceBadgeWithImage } from "@/components/ui/preference-badge-with-image";

interface PreferenceItem {
  label: string;
  level?: number;
}

interface ProfileSectionProps {
  title: string;
  items: (string | PreferenceItem)[];
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "secondary" | "outline";
  readOnly?: boolean;
  onAdd?: () => void;
  emptyText?: string;
  showStars?: boolean;
  showImages?: boolean;
}

export function ProfileSection({ 
  title, 
  items, 
  icon, 
  variant = "default", 
  readOnly = false,
  onAdd,
  emptyText = "Aucun élément ajouté",
  showStars = false,
  showImages = false
}: ProfileSectionProps) {
  // Ne rien afficher si pas d'items et en mode lecture seule (profils publics)
  if (readOnly && items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {!readOnly && onAdd && (
            <Button variant="ghost" size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{emptyText}</p>
        ) : showImages ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item, index) => {
              const itemData = typeof item === 'string' 
                ? { label: item, level: 2 } 
                : { label: item.label, level: item.level || 2 };
              
              return (
                <PreferenceBadgeWithImage
                  key={index}
                  label={itemData.label}
                  variant={variant}
                  size="sm"
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => {
              const itemData = typeof item === 'string' 
                ? { label: item, level: 2 } 
                : { label: item.label, level: item.level || 2 };
              
              return (
                <div key={index} className="flex items-center gap-2 px-3 py-2">
                  <Badge variant={variant}>
                    {itemData.label}
                  </Badge>
                  {showStars && (
                    <StarRating level={itemData.level} size="sm" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}