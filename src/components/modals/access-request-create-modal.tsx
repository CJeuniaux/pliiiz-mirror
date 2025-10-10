import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDirectory } from "@/hooks/use-directory";
import { supabase } from "@/integrations/supabase/client";
import { openComposeTab, guessProvider } from "@/lib/email-launcher";

interface AccessRequestCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<{ error?: any }>;
}


export function AccessRequestCreateModal({
  open,
  onClose,
  onSubmit
}: AccessRequestCreateModalProps) {
  const [activeTab, setActiveTab] = useState("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For non-users invitation
  const [inviteMessage, setInviteMessage] = useState("");
  
  // Email invitation constants
  const SUBJECT_INVITE = "On partage nos idées cadeaux ? Rejoins Pliiiz";
  const DEFAULT_MSG = `Je t'invite à rejoindre Pliiiz, l'app qui permet de partager ses préférences cadeaux. Crée ton profil de préférences et finis les faux pas 🎁\n\nCrée ton compte ici : https://pliiiz.app/register`;
  
  const handleInvite = () => {
    const body = inviteMessage?.trim() ? inviteMessage : DEFAULT_MSG;

    openComposeTab({
      to: "",
      subject: SUBJECT_INVITE,
      body,
      provider: undefined,
    });
  };
  
  const { profiles, loading: directoryLoading } = useDirectory();

  // Filter profiles based on search and exclude existing contacts
  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const firstName = (profile as any).first_name || profile.name?.split(' ')[0] || '';
    const lastName = (profile as any).last_name || profile.name?.split(' ')[1] || '';
    const fullName = profile.name || '';
    
    return firstName.toLowerCase().includes(searchLower) || 
           lastName.toLowerCase().includes(searchLower) || 
           fullName.toLowerCase().includes(searchLower);
  });

  const handleSubmitExisting = async () => {
    if (!selectedUser || !message.trim() || isSubmitting) {
      if (!selectedUser || !message.trim()) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un utilisateur et ajouter un message",
          variant: "destructive"
        });
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        toUserId: selectedUser.user_id,
        message: message.trim()
      });

      // Only reset and close if the request was successful (no error)
      if (!result?.error) {
        setSelectedUser(null);
        setMessage("");
        setSearchQuery("");
        onClose();
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la demande",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedUser(null);
    setMessage("");
    setSearchQuery("");
    setInviteMessage(`Je t'invite à rejoindre PLIIIZ, l'appli qui permet de partager ses préférences cadeaux. Fini les faux pas, place aux bonnes surprises !\n\nCrée ton compte ici : https://pliiiz.app/register`);
    setActiveTab("existing");
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <div className="p-2 overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle>Nouvelle demande d'accès</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex gap-0 p-0.5 tabs-white rounded-full mb-6">
              <button 
                className={`flex-1 py-1.5 px-4 rounded-full font-semibold text-base transition-all ${
                  activeTab === 'existing'
                    ? 'tab-mauve'
                    : 'text-[#5b3bb8] bg-transparent'
                }`}
                onClick={() => setActiveTab('existing')}
              >
                Utilisateurs
              </button>
              <button 
                className={`flex-1 py-1.5 px-4 rounded-full font-semibold text-base transition-all ${
                  activeTab === 'invite'
                    ? 'tab-mauve'
                    : 'text-[#5b3bb8] bg-transparent'
                }`}
                onClick={() => setActiveTab('invite')}
              >
                Inviter
              </button>
            </div>

            <TabsContent value="existing" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="search" className="pliiz-label">Rechercher un utilisateur</label>
                  <Input 
                    id="search" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Nom ou prénom..." 
                    className="pliiz-input"
                  />
                </div>

                {directoryLoading ? (
                  <div className="text-center py-4 opacity-80">
                    <p>Chargement...</p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredProfiles.length === 0 ? (
                      <p className="text-center py-4 opacity-80">
                        {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur disponible"}
                      </p>
                    ) : (
                      filteredProfiles.map(profile => (
                        <div 
                          key={profile.user_id} 
                          onClick={() => setSelectedUser(profile)} 
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            selectedUser?.user_id === profile.user_id 
                              ? 'border-white/50 bg-white/20' 
                              : 'border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white/30">
                              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{profile.name}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedUser && (
                  <div>
                    <label htmlFor="message" className="pliiz-label">Message personnalisé</label>
                    <Textarea 
                      id="message" 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      placeholder="Expliquez pourquoi vous souhaitez accéder à ce profil..." 
                      rows={3}
                      className="pliiz-textarea"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" onClick={onClose} className="flex-1">
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSubmitExisting} 
                    disabled={!selectedUser || !message.trim() || isSubmitting} 
                    className="btn-orange flex-1"
                  >
                    {isSubmitting ? "Envoi..." : "Envoyer"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="invite" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30">
                  <h4 className="font-semibold mb-2">Inviter un ami à rejoindre PLIIIZ</h4>
                  <p className="text-sm opacity-90">
                    Votre ami recevra une invitation à créer son compte PLIIIZ. L'objet et le message sont déjà pré-remplis.
                  </p>
                </div>

                 <div>
                   <label htmlFor="invite-message" className="pliiz-label">Message d'invitation</label>
                   <Textarea 
                     id="invite-message" 
                     value={inviteMessage} 
                     onChange={e => setInviteMessage(e.target.value)} 
                     placeholder={DEFAULT_MSG}
                     rows={4}
                     className="pliiz-textarea"
                   />
                 </div>

                 <div className="flex gap-2 pt-2">
                   <Button variant="secondary" onClick={onClose} className="flex-1">
                     Annuler
                   </Button>
                    <Button 
                      type="button"
                      onClick={handleInvite}
                      className="btn-orange flex-1"
                    >
                      Inviter
                    </Button>
                 </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
