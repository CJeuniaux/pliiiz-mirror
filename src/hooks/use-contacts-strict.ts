import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { ContactPreview, validateContactData } from '@/types/contact-strict';

/**
 * Hook STRICT pour la liste des contacts
 * Principe : ZÉRO GÉNÉRATION, données exactes de la DB
 */
export function useContactsStrict() {
  const [contacts, setContacts] = useState<ContactPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchContactsStrict();
    } else {
      setContacts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchContactsStrict = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Récupération des demandes acceptées (bidirectionnelles)
      const { data: acceptedRequests, error: requestsError } = await supabase
        .from('requests')
        .select(`
          id,
          from_user_id,
          to_user_id,
          status,
          created_at,
          message
        `)
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

      if (requestsError) {
        console.error('Erreur demandes acceptées:', requestsError);
        setError('Erreur de récupération des contacts');
        return;
      }

      if (!acceptedRequests || acceptedRequests.length === 0) {
        setContacts([]);
        return;
      }

      // 2. Extraction des user_ids des contacts (l'autre personne dans chaque demande)
      const contactUserIds = acceptedRequests.map((request: any) => 
        request.from_user_id === user.id ? request.to_user_id : request.from_user_id
      );

      // Dédoublonnage
      const uniqueContactUserIds = [...new Set(contactUserIds)];

      // 3. Enrichissement STRICT avec profils et préférences
      const userIds = uniqueContactUserIds;
      
      // Récupération des profils
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, avatar_url, regift_enabled, birthday')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Erreur profils:', profilesError);
        setError('Erreur de récupération des profils');
        return;
      }

      // Récupération des préférences
      const { data: preferences, error: prefsError } = await supabase
        .from('preferences')
        .select('user_id, current_wants, likes, dislikes, allergies')
        .in('user_id', userIds);

      if (prefsError) {
        console.warn('Erreur préférences:', prefsError);
        // Continuer sans les préférences
      }

      // 4. Construction STRICTE des ContactPreview
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const prefsMap = new Map((preferences || []).map((p: any) => [p.user_id, p]));

      const strictContacts: ContactPreview[] = uniqueContactUserIds
        .map((contactUserId: string) => {
          const profile = profileMap.get(contactUserId);
          const prefs = prefsMap.get(contactUserId);

          if (!profile) {
            console.warn(`Profil manquant pour user_id: ${contactUserId}`);
            return null;
          }

          // Construction STRICTE du contact
          const contact: ContactPreview = {
            id: contactUserId,
            owner_id: user.id,
            display_name: profile.display_name || 
                         (profile.first_name && profile.last_name 
                           ? `${profile.first_name} ${profile.last_name}`.trim()
                           : profile.first_name || 'Contact'),
            nickname: null, // Pas encore implémenté en DB
            avatar_url: profile.avatar_url || null,
            regift_enabled: profile.regift_enabled === true,
            birthday: profile.birthday || null,
            preferences: []
          };

          // Ajout STRICT des préférences
          if (prefs) {
            const preferences: any[] = [];
            
            // current_wants
            if (Array.isArray(prefs.current_wants)) {
              prefs.current_wants.forEach((item: string) => {
                if (typeof item === 'string' && item.trim()) {
                  preferences.push({
                    category: 'current_wants',
                    value: item.trim(),
                    sentiment: 'aime',
                    source: 'user_entry'
                  });
                }
              });
            }

            // likes
            if (Array.isArray(prefs.likes)) {
              prefs.likes.forEach((item: string) => {
                if (typeof item === 'string' && item.trim()) {
                  preferences.push({
                    category: 'likes',
                    value: item.trim(),
                    sentiment: 'aime',
                    source: 'user_entry'
                  });
                }
              });
            }

            // dislikes
            if (Array.isArray(prefs.dislikes)) {
              prefs.dislikes.forEach((item: string) => {
                if (typeof item === 'string' && item.trim()) {
                  preferences.push({
                    category: 'dislikes',
                    value: item.trim(),
                    sentiment: 'n_aime_pas',
                    source: 'user_entry'
                  });
                }
              });
            }

            // allergies
            if (Array.isArray(prefs.allergies)) {
              prefs.allergies.forEach((item: string) => {
                if (typeof item === 'string' && item.trim()) {
                  preferences.push({
                    category: 'allergies',
                    value: item.trim(),
                    sentiment: 'allergie',
                    source: 'user_entry'
                  });
                }
              });
            }

            contact.preferences = preferences;
          }

          // Validation finale anti-hallucination
          if (!validateContactData(contact)) {
            console.error('Contact invalidé par validation:', contact);
            return null;
          }

          return contact;
        })
        .filter((c: ContactPreview | null): c is ContactPreview => c !== null);

      setContacts(strictContacts);
    } catch (err) {
      console.error('Erreur lors de la récupération des contacts:', err);
      setError('Erreur technique');
    } finally {
      setLoading(false);
    }
  };

  return {
    contacts,
    loading,
    error,
    refetch: fetchContactsStrict
  };
}