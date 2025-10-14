import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContactsEnhancedV2 } from '@/hooks/use-contacts-enhanced-v2';
import { AccessRequestCreateModal } from '@/components/modals/access-request-create-modal';
import { useContactManagement } from '@/hooks/use-contact-management';
import { ContactCardModern } from '@/components/ui/contact-card-modern';
import { calculateAge } from '@/utils/age';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function ContactCard({ contact }: { contact: any }) {
  const navigate = useNavigate();
  const age = calculateAge(contact.birthday);

  const handleViewProfile = () => {
    navigate(`/p/${contact.user_id}`);
  };

  return (
    <ContactCardModern
      displayName={contact.display_name}
      avatarUrl={contact.avatar_url}
      city={contact.city}
      age={age}
      onViewProfile={handleViewProfile}
      showStatus={false}
    />
  );
}

interface ContactsScreenReferenceProps {
  onBack?: () => void;
}

export function ContactsScreenReference({ onBack }: ContactsScreenReferenceProps) {
  const navigate = useNavigate();
  const { contacts, loading, error, refetch } = useContactsEnhancedV2();
  const { createRequest } = useContactManagement();
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleSyncContacts = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc('sync_my_contacts_from_requests');
      if (error) throw error;
      
      const count = data || 0;
      if (count > 0) {
        toast.success(`${count} contact(s) ajouté(s)`);
      } else {
        toast.info('Aucun contact manquant détecté');
      }
      await refetch();
    } catch (err: any) {
      console.error('Sync error:', err);
      const msg = err?.message || err?.error?.message || 'Erreur lors de la synchronisation';
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // Filtrer les contacts selon la recherche
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.display_name?.toLowerCase().includes(query) ||
      contact.city?.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  if (loading) {
    return (
      <>
        <div className="px-4 mb-4">
          <h1 className="plz-page-title p-0">Mes Contacts</h1>
        </div>
        <div className="pliiz-list">
          <div className="pliiz-card text-center opacity-60">
            Chargement...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 px-[var(--plz-outer-margin)]" style={{ marginInline: 'calc(-1 * var(--plz-green-gutter))' }}>
        <h1 className="plz-page-title p-0 flex-1">Mes Contacts ({contacts.length})</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccessModal(true)}
            className="btn-icon-orange w-10 h-10"
            aria-label="Ajouter un contact"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
      
      {/* Barre de recherche */}
      {contacts.length > 0 && (
        <div className="mb-4 px-[var(--plz-outer-margin)]" style={{ marginInline: 'calc(-1 * var(--plz-green-gutter))' }}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher un contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/15"
            />
          </div>
        </div>
      )}
      
      {/* Liste des contacts */}
      <div className="pliiz-list">
        {error && (
          <div className="pliiz-card">
            <div className="flex items-center justify-between">
              <span>Erreur lors du chargement des contacts</span>
              <Button size="sm" variant="secondary" onClick={refetch}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {contacts.length === 0 ? (
          <div className="pliiz-card text-center py-12">
            <p className="opacity-80 mb-4">Aucun contact pour l'instant</p>
            <Button 
              className="pliiz-btn"
              onClick={() => setShowAccessModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un contact
            </Button>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="pliiz-card text-center py-12">
            <p className="opacity-80 mb-2">Aucun contact trouvé</p>
            <p className="text-sm opacity-60">Essayez une autre recherche</p>
          </div>
        ) : (
          <>
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.user_id} contact={contact} />
            ))}
          </>
        )}
      </div>

      {/* Add Contact Modal */}
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
    </>
  );
}