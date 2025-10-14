import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { ContactPreview } from '@/types/contact-strict';
import { Recycle, User } from 'lucide-react';
import { EnhancedAvatar } from '@/components/ui/enhanced-avatar';
import { ViewProfileButton } from '@/components/ui/view-profile-button';
import { computeAge } from '@/utils/people';

interface ContactCardStrictProps {
  contact: ContactPreview;
}

export function ContactCardStrict({ contact }: ContactCardStrictProps) {
  const navigate = useNavigate();
  const age = computeAge(contact.birthday);
  const city = contact.city?.trim() || null;
  const ageLabel = age ? `${age} ans` : 'Non renseigné';
  const cityLabel = city || 'Non renseigné';
  
  // Filtrer les préférences "j'aime" pour l'aperçu
  const currentWants = contact.preferences
    .filter(p => p.sentiment === 'aime' && p.category === 'current_wants')
    .slice(0, 3); // Max 3 pour l'aperçu

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 border hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <EnhancedAvatar
            userId={contact.id}
            avatarUrl={contact.avatar_url}
            name={contact.display_name}
            size="lg"
          />
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="contact-item__name" title={contact.display_name}>{contact.display_name}</div>
                <div className="contact-item__meta">{ageLabel}, {cityLabel}</div>
                {contact.regift_enabled && (
                  <div className="badge-regift mt-2">Apprécie les "regifts" ♻️</div>
                )}
              </div>
            </div>
            
            <ViewProfileButton 
              userId={contact.id}
              variant="default" 
              className="bg-gradient-to-r from-[#5A7A7E] to-[#405F62] hover:opacity-90 text-white font-semibold"
              showText={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}