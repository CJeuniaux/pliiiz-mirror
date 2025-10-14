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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConsistentListContainer, ConsistentPageLayout } from '@/components/layout/consistent-page-layout';

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
            className="flex-1 btn-orange"
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
    <ConsistentPageLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="plz-page-title p-0 flex-1">Demandes</h1>
        <button
          onClick={() => setOpenNewRequest(true)}
          className="btn-icon-orange w-10 h-10"
          aria-label="Créer une demande"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recues' | 'envoyees')} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="recues" className="flex-1">
            Reçues
          </TabsTrigger>
          <TabsTrigger value="envoyees" className="flex-1">
            Envoyées ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recues">
          <ConsistentListContainer>
            {receivedRequests.length === 0 ? (
              <div className="pliiz-card text-center py-12">
                <div className="opacity-80">
                  <Clock className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Aucune demande reçue</p>
                  <p className="text-sm mt-1">Les demandes d'accès à votre profil apparaîtront ici</p>
                </div>
              </div>
            ) : (
              receivedRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  navigateTo={navigateTo}
                  type="received"
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))
            )}
          </ConsistentListContainer>
        </TabsContent>

        <TabsContent value="envoyees">
          <div className="pliiz-list">
            {sentRequests.length === 0 ? (
              <div className="pliiz-card text-center py-12">
                <div className="opacity-80">
                  <Clock className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Aucune demande envoyée</p>
                  <p className="text-sm mt-1">Commencez par envoyer une demande d'accès</p>
                </div>
              </div>
            ) : (
              sentRequests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  navigateTo={navigateTo}
                  type="sent"
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal existant */}
      <AccessRequestCreateModal 
        open={openNewRequest} 
        onClose={() => {
          setOpenNewRequest(false);
          setIsCreating(false);
        }}
        onSubmit={handleCreateRequest}
      />
    </ConsistentPageLayout>
  );
}