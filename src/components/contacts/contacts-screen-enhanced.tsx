import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedAvatar } from '@/components/ui/enhanced-avatar';
import { AccessRequestCreateModal } from '@/components/modals/access-request-create-modal';
import { useContactsEnhancedV2, ContactEnhancedV2 } from '@/hooks/use-contacts-enhanced-v2';
import { useContactManagement } from '@/hooks/use-contact-management';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { ViewProfileButton } from '@/components/ui/view-profile-button';


function calculateAge(birthday: string): number | null {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
}

function CardContact({ contact }: { contact: ContactEnhancedV2 }) {
  
  const age = contact.birthday ? calculateAge(contact.birthday) : null;

  return (
    <Card className="p-4 border bg-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EnhancedAvatar 
            userId={contact.user_id}
            avatarUrl={contact.avatar_url}
            name={contact.display_name}
            size="md"
          />
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate-2">{contact.display_name}</div>
          </div>
        </div>
        <div className="text-right min-w-0 flex-shrink-0">
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {age ? `${age} ans` : ''}{contact.city ? `${age ? ' · ' : ''}${contact.city}` : ''}
          </div>
          <ViewProfileButton
            userId={contact.user_id}
            variant="default"
            size="sm"
            className="mt-2 bg-gradient-to-r from-[hsl(var(--pliiz-primary))] to-[hsl(var(--pliiz-secondary))] text-white border-0"
          />
        </div>
      </div>
    </Card>
  );
}

interface ContactsScreenEnhancedProps {
  onBack: () => void;
}

export function ContactsScreenEnhanced({ onBack }: ContactsScreenEnhancedProps) {
  const { contacts, loading, error, refetch } = useContactsEnhancedV2();
  const { createRequest } = useContactManagement();
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Set up realtime subscription for request updates
  useEffect(() => {
    const channel = supabase
      .channel('requests-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
        },
        (payload) => {
          console.log('Request updated:', payload);
          // Refetch contacts when a request status changes to accepted
          if (payload.new.status === 'accepted') {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setShowAccessModal(true)}
            className="bg-gradient-to-r from-[hsl(var(--pliiz-primary))] to-[hsl(var(--pliiz-secondary))] text-white hover:opacity-90 border-0 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {error && (
            <div className="p-3 rounded-md bg-muted flex items-center justify-between">
              <span>Chargement impossible. Réessayer.</span>
              <Button size="sm" variant="outline" onClick={refetch}>Réessayer</Button>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="space-y-2 w-full">
                      <div className="h-4 w-1/3 bg-muted rounded" />
                      <div className="h-3 w-1/4 bg-muted rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun contact pour l’instant.
            </div>
          ) : (
            contacts.map(contact => (
              <CardContact key={contact.user_id} contact={contact} />
            ))
          )}
        </div>
      </div>

      <AccessRequestCreateModal
        open={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSubmit={async ({ toUserId, message }: { toUserId: string; message?: string }) => {
          const result = await createRequest(toUserId, message);
          if (!result?.error) {
            setShowAccessModal(false);
            refetch();
          }
          return result;
        }}
      />
    </div>
  );
}