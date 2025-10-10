import React, { useState } from 'react';
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, Lock } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  avatar_url?: string;
}

interface RegiftCreationModalProps {
  open: boolean;
  onClose: () => void;
  giftId: string;
  giftName: string;
  contacts: Contact[];
}

export function RegiftCreationModal({ 
  open, 
  onClose, 
  giftId, 
  giftName, 
  contacts 
}: RegiftCreationModalProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'friends'>('private');
  const [submitting, setSubmitting] = useState(false);

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const canSubmit = selectedContactId && !submitting;

  const handleSubmit = async () => {
    if (!selectedContactId) return;
    
    setSubmitting(true);
    try {
      // TODO: Appel API pour créer le regift
      const response = await fetch(`/api/gifts/${giftId}/regift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toContactId: selectedContactId,
          reason: reason.trim() || null,
          visibility
        })
      });

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      toast.success('Proposition de re-gift envoyée !');
      onClose();
      
      // Reset form
      setSelectedContactId('');
      setReason('');
      setVisibility('private');
      
    } catch (error) {
      console.error('Erreur regift:', error);
      toast.error('Impossible d\'envoyer la proposition. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedContactId('');
    setReason('');
    setVisibility('private');
    onClose();
  };

  return (
    <AppModal 
      open={open} 
      onClose={handleCancel} 
      title="Re-gift 🎁"
      size="lg"
    >
      <div className="space-y-6">
        {/* Gift info */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{giftName}</p>
              <p className="text-sm text-muted-foreground">
                Proposer ce cadeau à un(e) ami(e)
              </p>
            </div>
          </div>
        </div>

        {/* Contact selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Destinataire</Label>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun contact disponible</p>
              <p className="text-sm">Ajoutez des amis pour pouvoir faire des re-gifts</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedContactId === contact.id 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar_url} />
                    <AvatarFallback>
                      {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{contact.name}</p>
                  </div>
                  {selectedContactId === contact.id && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Sélectionné
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reason (optional) */}
        <div className="space-y-3">
          <Label htmlFor="reason" className="text-base font-semibold">
            Note (optionnelle)
          </Label>
          <Textarea
            id="reason"
            placeholder="Pourquoi proposer ce re-gift ? (ex: ne correspond pas à mes goûts, doublon...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Privacy */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Confidentialité</Label>
          <RadioGroup value={visibility} onValueChange={(value: 'private' | 'friends') => setVisibility(value)}>
            <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex items-center gap-2 flex-1 cursor-pointer">
                <Lock className="h-4 w-4" />
                <div>
                  <div className="font-medium">Privé</div>
                  <div className="text-sm text-muted-foreground">
                    Seul(e) {selectedContact?.name || 'le destinataire'} verra cette proposition
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="friends" id="friends" />
              <Label htmlFor="friends" className="flex items-center gap-2 flex-1 cursor-pointer">
                <Users className="h-4 w-4" />
                <div>
                  <div className="font-medium">Amis</div>
                  <div className="text-sm text-muted-foreground">
                    Vos amis communs pourront voir cette proposition
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            className="flex-1"
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-[hsl(var(--pliiz-primary))] to-[hsl(var(--pliiz-secondary))] text-white hover:opacity-90 border-0"
          >
            {submitting ? 'Envoi...' : 'Envoyer la proposition'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}