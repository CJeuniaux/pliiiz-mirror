import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useContactsWithPreviews } from '@/hooks/use-contacts-with-previews';
import { AccessRequestCreateModal } from '@/components/modals/access-request-create-modal';
import { ArrowLeft, Plus, Users, UserPlus, Eye } from 'lucide-react';
import { computeAge } from '@/utils/people';
import { useNavigate } from 'react-router-dom';
import { ViewProfileButton } from '@/components/ui/view-profile-button';

interface ContactsScreenStrictProps {
  onBack: () => void;
}

/**
 * Écran contacts STRICT - ZÉRO HALLUCINATION avec aperçus d'images
 * Principe : affichage exact des données DB + 3 dernières images uploadées par contact
 */
export function ContactsScreenStrict({ onBack }: ContactsScreenStrictProps) {
  const { contacts, loading, error, refetch } = useContactsWithPreviews();
  const [showAccessModal, setShowAccessModal] = useState(false);
  const navigate = useNavigate();
  
  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name?.split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '•';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 text-center">
          <div className="text-muted-foreground">Chargement des contacts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6 text-center space-y-4">
          <div className="text-destructive">Erreur : {error}</div>
          <Button 
            variant="outline" 
            onClick={refetch}
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* PLUS de padding horizontal ici - géré par .plz-content */}
      <div className="space-y-6">
        {/* Header avec bouton ajout contact */}
        <div className="flex items-center justify-end">
          <Button
            onClick={() => setShowAccessModal(true)}
            className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white font-semibold whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Statistiques STRICTES */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{contacts.length}</div>
              <div className="text-sm text-muted-foreground">Contacts ayant accepté</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des contacts acceptés avec aperçus d'images */}
        {contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <Card key={contact.contact_id} className="contact-card bg-gradient-to-br from-background to-muted/20 border hover:shadow-md transition-all">
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-12 h-12 md:w-14 md:h-14 relative flex-shrink-0">
                        {contact.avatar_url ? (
                          <img 
                            src={contact.avatar_url} 
                            alt={`${contact.display_name} avatar`}
                            loading="lazy"
                            className="avatar"
                            onError={(e) => {
                              console.log('Avatar load error for:', contact.display_name, contact.avatar_url);
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`avatar bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm ${contact.avatar_url ? 'absolute inset-0 hidden' : ''}`}
                          style={{ display: contact.avatar_url ? 'none' : 'flex' }}
                        >
                          {getInitials(contact.display_name)}
                        </div>
                      </div>
                      
                      {/* Contact main info */}
                      <div className="contact-main flex-1 min-w-0">
                        <div className="contact-item__name">{contact.display_name}</div>
                        <div className="contact-item__meta">
                          {(() => {
                            const age = computeAge(contact.birthday);
                            const city = contact.city?.trim() || null;
                            const ageLabel = age ? `${age} ans` : 'Non renseigné';
                            const cityLabel = city || 'Non renseigné';
                            return `${ageLabel}, ${cityLabel}`;
                          })()}
                        </div>
                        
                        {/* Image previews row */}
                        <div className="thumb-row flex gap-2 mt-2">
                          {contact.preview_urls.slice(0, 3).map((url, i) => (
                            <img 
                              key={i} 
                              className="thumb w-12 h-12 md:w-14 md:h-14 rounded-[10px] object-cover bg-muted border border-black/[0.06]" 
                              loading="lazy" 
                              src={url} 
                              alt="" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action button */}
                    <ViewProfileButton 
                      userId={contact.user_id}
                      variant="ghost"
                      size="sm"
                      className="btn-icon flex-shrink-0"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <h3 className="font-semibold text-lg">Aucun contact pour l'instant</h3>
                <p className="text-muted-foreground mt-2">
                  Commencez par ajouter vos premiers contacts pour voir vos connexions acceptées ici
                </p>
              </div>
              <Button
                onClick={() => setShowAccessModal(true)}
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white font-semibold whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal d'ajout de contact */}
      <AccessRequestCreateModal
        open={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSubmit={async ({ toUserId, message }: { toUserId: string; message?: string }) => {
          // Return empty object to satisfy type requirements
          return {};
          setShowAccessModal(false);
          // The real-time subscription will handle the refresh when accepted
        }}
      />
    </div>
  );
}