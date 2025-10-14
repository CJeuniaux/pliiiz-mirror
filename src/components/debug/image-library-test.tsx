import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResolvedImage } from '@/components/ui/resolved-image';

const testItems = [
  {
    label: 'thé vert en vrac',
    categoryId: 'tea',
    attributes: { type: 'green', form: 'loose-leaf' }
  },
  {
    label: 'chocolat noir 70%',
    categoryId: 'chocolate', 
    attributes: { type: 'dark', cocoaPct: 70 }
  },
  {
    label: 'roman policier',
    categoryId: 'books',
    attributes: { genre: 'policier' }
  },
  {
    label: 'plante succulente',
    categoryId: 'plants',
    attributes: { type: 'succulent' }
  },
  {
    label: 'item inconnu sans catégorie',
    categoryId: undefined,
    attributes: undefined
  }
];

export function ImageLibraryTest() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test de la bibliothèque d'images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testItems.map((item, index) => (
              <div key={index} className="space-y-3">
                <ResolvedImage
                  label={item.label}
                  categoryId={item.categoryId}
                  attributes={item.attributes}
                  className="gift-img border"
                />
                
                <div>
                  <h3 className="font-semibold">{item.label}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.categoryId && (
                      <Badge variant="secondary" className="text-xs">
                        {item.categoryId}
                      </Badge>
                    )}
                    {item.attributes && (
                      <Badge variant="outline" className="text-xs">
                        attrs: {Object.keys(item.attributes).length}
                      </Badge>
                    )}
                  </div>
                  {item.attributes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {JSON.stringify(item.attributes)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Logique de résolution:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. URL existante (si fournie)</li>
              <li>2. Correspondance exacte par label dans image_library</li>
              <li>3. Correspondance par catégorie + attributs</li>
              <li>4. Icône par défaut de la catégorie</li>
              <li>5. Image placeholder</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}