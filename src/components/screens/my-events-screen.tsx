import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useRequests } from "@/hooks/use-requests";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MyEventsScreenProps {
  onBack: () => void;
  onCreateEvent: () => void;
  onViewEvent?: (eventId: string) => void;
}

export function MyEventsScreen({ onBack, onCreateEvent, onViewEvent }: MyEventsScreenProps) {
  const { myEvents, invitedEvents, loading: eventsLoading } = useEvents();
  const { receivedRequests, loading: requestsLoading } = useRequests();
  
  // Force scroll top selon brief §4.6
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const getRequestCount = (eventId: string) => {
    return receivedRequests.filter(req => req.event_id === eventId && req.status === 'pending').length;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  if (eventsLoading || requestsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Mes événements" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Mes événements"
        count={myEvents.length + invitedEvents.length}
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6">
        {/* Bouton "Créer un événement" = mauve selon brief §4.10 */}
        <Button 
          onClick={onCreateEvent} 
          className="w-full bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--btn-mauve-hover))] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un événement
        </Button>

        {/* My Events Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Mes événements</h2>
          {myEvents.length === 0 ? (
            <Card className="border-2 border-dashed border-muted text-center p-8">
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Aucun événement</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Créez votre premier événement pour commencer à organiser vos cadeaux.
                  </p>
                  <Button 
                    onClick={onCreateEvent}
                    className="bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--pliiz-primary-hover))] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un événement
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {myEvents.map((event) => {
                const requestCount = getRequestCount(event.id);
                
                return (
                  <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                          </div>
                          {requestCount > 0 && (
                            <Button
                              size="sm"
                              className="bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--pliiz-primary-hover))] text-white"
                              onClick={() => onViewEvent?.(event.id)}
                            >
                              <Users className="w-4 h-4 mr-1" />
                              {requestCount}
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.event_date)}</span>
                          </div>
                          {event.location_text && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location_text}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Invited Events Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Événements auxquels vous êtes invité(e)</h2>
          {invitedEvents.length === 0 ? (
            <Card className="border-2 border-dashed border-muted text-center p-8">
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Aucune invitation</h3>
                  <p className="text-muted-foreground text-sm">
                    Vous n'avez pas encore été invité à des événements.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitedEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        {event.location_text && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location_text}</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}