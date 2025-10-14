import React from 'react';
import { HeroHeader } from '@/components/ui/hero-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location?: string;
  hostName: string;
  hostId: string;
  daysUntil: number;
}

interface CalendarScreenProps {
  onViewProfile?: (userId: string) => void;
}

export function CalendarScreen({ onViewProfile }: CalendarScreenProps) {
  // Mock data for upcoming events
  const upcomingEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Anniversaire Thomas',
      type: 'Anniversaire',
      date: '2024-01-15',
      location: 'Paris',
      hostName: 'Thomas L.',
      hostId: 'thomas-123',
      daysUntil: 12
    },
    {
      id: '2',
      title: 'Dîner chez Camille',
      type: 'Dîner',
      date: '2024-01-20',
      location: 'Lyon',
      hostName: 'Camille R.',
      hostId: 'camille-456',
      daysUntil: 17
    },
    {
      id: '3',
      title: 'Pendaison de crémaillère',
      type: 'Housewarming',
      date: '2024-01-25',
      location: 'Marseille',
      hostName: 'Alex M.',
      hostId: 'alex-789',
      daysUntil: 22
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'anniversaire':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'dîner':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'housewarming':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <HeroHeader 
        title="Calendrier" 
        subtitle="Vos événements à venir"
      />
      
      <div className="p-6 space-y-6">
        {/* Events List - Remove calendar icon */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Vos événements
          </h2>
          <p className="text-muted-foreground">
            {upcomingEvents.length} événement{upcomingEvents.length > 1 ? 's' : ''} prévu{upcomingEvents.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Events list */}
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aucun événement prévu
                </h3>
                <p className="text-muted-foreground">
                  Les événements auxquels vous êtes invité apparaîtront ici
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {event.title}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getEventTypeColor(event.type)}`}
                      >
                        {event.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {event.daysUntil === 0 ? 'J-0' : `J-${event.daysUntil}`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(event.date)}
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Organisé par </span>
                        <button
                          onClick={() => onViewProfile?.(event.hostId)}
                          className="text-primary hover:underline font-medium ml-1"
                        >
                          {event.hostName}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}