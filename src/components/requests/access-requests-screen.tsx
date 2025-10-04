import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useEnhancedRequests } from '@/hooks/use-enhanced-requests';
import { AccessRequestCreateModal } from '@/components/modals/access-request-create-modal';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, X, Plus } from 'lucide-react';
import { ContactCardModern } from '@/components/ui/contact-card-modern';
import { calculateAge } from '@/utils/age';

function RequestCard({ request, navigateTo, type, onAccept, onDecline, onCancel }: {
  request: any;
  navigateTo: (path: string) => void;
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}) {
  const otherUser = request.other_user;
  const displayName = otherUser?.display_name || otherUser?.name || 'Utilisateur';
  const age = calculateAge(otherUser?.birthday);

  const handleViewProfile = () => {
    navigateTo(`/p/${otherUser?.id}`);
  };

  return (
    <ContactCardModern
      displayName={displayName}
      avatarUrl={otherUser?.avatar_url}
      city={otherUser?.city}
      age={age}
      message={request.message}
      onViewProfile={handleViewProfile}
      status={request.status}
      showStatus={true}
    >
      {/* Actions pour demandes reçues */}
      {type === 'received' && request.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            variant="default" 
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
            onClick={() => onAccept?.(request.id)}
          >
            Accepter
          </Button>
          <Button
            variant="secondary" 
            size="sm"
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => onDecline?.(request.id)}
          >
            Refuser
          </Button>
        </div>
      )}

      {/* Actions pour demandes envoyées */}
      {type === 'sent' && request.status === 'pending' && (
        <Button
          variant="secondary" 
          size="sm"
          className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
          onClick={() => onCancel?.(request.id)}
        >
          Annuler
        </Button>
      )}

    </ContactCardModern>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="mb-4">
        <h1 className="plz-page-title p-0">Demandes</h1>
      </div>
      <div className="pliiz-list">
        <div className="pliiz-card">
          <div className="text-center opacity-60">Chargement...</div>
        </div>
      </div>
    </>
  );
}

export function AccessRequestsScreen() {
  const { user } = useAuth();
  const { sentRequests, receivedRequests, loading, updateRequestStatus, cancelRequest, createRequest } = useEnhancedRequests();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'recues' | 'envoyees'>('recues');
  const [openNewRequest, setOpenNewRequest] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const navigateTo = (path: string) => {
    navigate(path);
  };

  const handleAccept = async (requestId: string) => {
    await updateRequestStatus(requestId, 'accepted');
  };

  const handleDecline = async (requestId: string) => {
    await updateRequestStatus(requestId, 'declined');
  };

  const handleCancel = async (requestId: string) => {
    await cancelRequest(requestId);
  };

  const handleCreateRequest = async (data: { toUserId: string; message: string }) => {
    if (isCreating) return; // Prevent double submission
    
    setIsCreating(true);
    try {
      const result = await createRequest(data.toUserId, data.message);
      return result; // Return result so modal can handle success/error
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return (
      <>
        <div className="mb-4">
          <h1 className="plz-page-title p-0">Demandes</h1>
        </div>
        <div className="pliiz-list">
          <div className="pliiz-card text-center">
            <h3 className="font-bold mb-2">Connexion requise</h3>
            <p className="opacity-80">
              Vous devez être connecté pour voir les demandes
            </p>
          </div>
        </div>
      </>
    );
  }

  const currentRequests = activeTab === 'recues' ? receivedRequests : sentRequests;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="plz-page-title p-0 flex-1">Demandes</h1>
        <button
          onClick={() => setOpenNewRequest(true)}
          className="plz-iconbtn flex-shrink-0"
          aria-label="Créer une demande"
        >
          <Plus size={20} />
        </button>
      </div>
      
      {/* Onglets */}
      <div className="flex gap-0 p-1 bg-white/25 backdrop-blur-sm rounded-full mb-6">
        <button 
          className={`flex-1 py-2 px-4 rounded-full font-semibold text-base transition-all ${
            activeTab === 'recues'
              ? 'bg-gradient-to-r from-[#7b4bff] to-[#9b5fff] text-white shadow-lg'
              : 'text-[#5b3bb8] bg-transparent'
          }`}
          onClick={() => setActiveTab('recues')}
        >
          Reçues
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-full font-semibold text-base transition-all ${
            activeTab === 'envoyees'
              ? 'bg-gradient-to-r from-[#7b4bff] to-[#9b5fff] text-white shadow-lg'
              : 'text-[#5b3bb8] bg-transparent'
          }`}
          onClick={() => setActiveTab('envoyees')}
        >
          Envoyées ({sentRequests.length})
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="pliiz-list">
        {currentRequests.length === 0 ? (
          <div className="pliiz-card text-center py-12">
            <div className="opacity-80">
              {activeTab === 'recues' ? (
                <>
                  <Clock className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Aucune demande reçue</p>
                  <p className="text-sm mt-1">Les demandes d'accès à votre profil apparaîtront ici</p>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Aucune demande envoyée</p>
                  <p className="text-sm mt-1">Commencez par envoyer une demande d'accès</p>
                </>
              )}
            </div>
          </div>
        ) : (
          currentRequests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              navigateTo={navigateTo}
              type={activeTab === 'recues' ? 'received' : 'sent'}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCancel={handleCancel}
            />
          ))
        )}
      </div>

      {/* Modal existant */}
      <AccessRequestCreateModal 
        open={openNewRequest} 
        onClose={() => {
          setOpenNewRequest(false);
          setIsCreating(false);
        }}
        onSubmit={handleCreateRequest}
      />
    </>
  );
}