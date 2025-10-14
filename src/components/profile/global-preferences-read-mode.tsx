import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { prettyArray, prettySizes } from '@/lib/display-utils';

interface GlobalPreferencesReadModeProps {
  prefs: any;
  onEdit: () => void;
}

export function GlobalPreferencesReadMode({ prefs, onEdit }: GlobalPreferencesReadModeProps) {
  const Section = ({ title, items }: { title: string; items: string[] }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge 
            key={index} 
            variant={item === 'non renseigné' ? 'outline' : 'secondary'} 
            className={`text-sm ${item === 'non renseigné' ? 'text-muted-foreground italic' : ''}`}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Mes préférences générales</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Tes goûts "qui ne bougent pas" : ce que tu aimes, tes allergies, des idées cadeaux, tailles et pointures, …
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Modifier
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <Section title="J'aime" items={prettyArray(prefs?.likes)} />
        <Section title="À éviter" items={prettyArray(prefs?.avoid)} />
        <Section title="Idées cadeaux" items={prettyArray(prefs?.giftIdeas)} />
        <Section title="Tailles et pointures" items={prettySizes(prefs?.sizes)} />
      </CardContent>
    </Card>
  );
}