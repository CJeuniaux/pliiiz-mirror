import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, MapPin, Phone, Globe, Star } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  city: string;
  category: string;
  place_id?: string;
  formatted_address?: string;
  website?: string;
  google_maps_url?: string;
  phone?: string;
  rating?: number;
  user_ratings_total?: number;
  status: string;
}

export function PartnersEnrichment() {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [enrichmentStatus, setEnrichmentStatus] = useState<string>('');

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name');

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const startEnrichment = async () => {
    setLoading(true);
    setEnrichmentStatus('Démarrage de l\'enrichissement...');

    try {
      const { data, error } = await supabase.functions.invoke('enrich-partners');
      
      if (error) throw error;
      
      setEnrichmentStatus(`Enrichissement terminé: ${data.message}`);
      await loadPartners(); // Reload partners after enrichment
    } catch (error) {
      console.error('Error during enrichment:', error);
      setEnrichmentStatus(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPartners();
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'books_indie': 'bg-blue-100 text-blue-800',
      'books_chain': 'bg-blue-200 text-blue-900',
      'vinyls': 'bg-purple-100 text-purple-800',
      'board_games': 'bg-green-100 text-green-800',
      'chocolate': 'bg-yellow-100 text-yellow-800',
      'tea': 'bg-emerald-100 text-emerald-800',
      'beauty': 'bg-pink-100 text-pink-800',
      'home_decor': 'bg-orange-100 text-orange-800',
      'plants': 'bg-lime-100 text-lime-800',
      'tech': 'bg-gray-100 text-gray-800',
      'experience_spa': 'bg-indigo-100 text-indigo-800',
      'experience_karting': 'bg-red-100 text-red-800',
      'experience_museum': 'bg-violet-100 text-violet-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enrichissement des Partenaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={startEnrichment} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Enrichissement en cours...' : 'Démarrer l\'enrichissement Google Places'}
          </Button>
          
          {enrichmentStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{enrichmentStatus}</p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>Cet outil va enrichir automatiquement la base de données des partenaires avec :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Adresses formatées via Google Places</li>
              <li>Coordonnées GPS (lat/lng)</li>
              <li>Sites web et numéros de téléphone</li>
              <li>URLs Google Maps</li>
              <li>Notes et évaluations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partenaires ({partners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {partners.map((partner) => (
              <div key={partner.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{partner.name}</h3>
                  <Badge className={getCategoryColor(partner.category)}>
                    {partner.category}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {partner.city}
                  </span>
                  
                  {partner.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {partner.rating.toFixed(1)} ({partner.user_ratings_total})
                    </span>
                  )}
                </div>

                {partner.formatted_address && (
                  <p className="text-sm text-muted-foreground">
                    {partner.formatted_address}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {partner.google_maps_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(partner.google_maps_url, '_blank')}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Maps
                    </Button>
                  )}
                  
                  {partner.website && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(partner.website, '_blank')}
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Site web
                    </Button>
                  )}
                  
                  {partner.phone && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`tel:${partner.phone}`, '_self')}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {partner.phone}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}