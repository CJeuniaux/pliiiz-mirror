import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mapsSearchUrlFromLabel, openMapsSearch } from '@/utils/maps-helpers';

const testItems = [
  { name: 'Chocolat noir 85%', city: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Café artisanal', city: 'Lyon', lat: null, lng: null },
  { name: 'Livre de science-fiction', city: null, lat: 45.7640, lng: 4.8357 },
  { name: 'Plante succulente', city: null, lat: null, lng: null }
];

export function MapsTest() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test "Offrir ça" - Google Maps Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <div className="flex gap-2">
                    {item.city && <Badge variant="secondary">Ville: {item.city}</Badge>}
                    {item.lat && item.lng && <Badge variant="outline">GPS</Badge>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    URL générée: <code className="bg-muted px-1 rounded text-xs">
                      {mapsSearchUrlFromLabel(item.name, item.city || undefined, item.lat || undefined, item.lng || undefined)}
                    </code>
                  </p>
                  
                  <Button
                    onClick={() => openMapsSearch(
                      item.name,
                      item.city || undefined,
                      item.lat || undefined,
                      item.lng || undefined
                    )}
                    className="bg-[#2f4b4e] hover:opacity-90 text-white"
                  >
                    Offrir ça ! 🎁
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Logique de fallback:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Si GPS disponible → "item @ lat,lng"</li>
              <li>2. Sinon si ville → "item near ville"</li>
              <li>3. Sinon → "item" seul</li>
              <li>4. UTM ajoutés automatiquement</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}