import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContactsEnhancedV2 } from '@/hooks/use-contacts-enhanced-v2';
import { AccessRequestCreateModal } from '@/components/modals/access-request-create-modal';
import { useContactManagement } from '@/hooks/use-contact-management';
import { ContactCardModern } from '@/components/ui/contact-card-modern';
import { calculateAge } from '@/utils/age';

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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

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
      <div className="flex items-center justify-between px-4 mb-4">
        <h1 className="plz-page-title p-0 flex-1">Mes Contacts</h1>
        <button
          onClick={() => setShowAccessModal(true)}
          className="plz-iconbtn flex-shrink-0"
          aria-label="Ajouter un contact"
        >
          <Plus size={20} />
        </button>
      </div>
      
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
        ) : (
          <>
            {contacts.map((contact) => (
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