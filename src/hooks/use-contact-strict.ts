import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContactPreview, validateContactData } from '@/types/contact-strict';

/**
 * Hook strict pour un contact - ZÉRO HALLUCINATION
 * Principe : si la donnée n'est pas en DB → "Non renseigné"
 */
export function useContactStrict(userId: string) {
  const [contact, setContact] = useState<ContactPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContactStrict();
  }, [userId]);

  const fetchContactStrict = async () => {
    if (!userId) {
      setError('ID utilisateur manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Récupération STRICTE du profil - aucune extrapolation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, avatar_url, regift_enabled, birthday')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Erreur profil:', profileError);
        setError('Erreur de récupération du profil');
        return;
      }

      if (!profile) {
        setError('Profil non trouvé');
        return;
      }

      // 2. Récupération STRICTE des préférences - aucune génération
      const { data: preferences, error: prefsError } = await supabase
        .from('preferences')
        .select('user_id, current_wants, likes, dislikes, allergies')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefsError) {
        console.error('Erreur préférences:', prefsError);
        // Continuer sans les préférences plutôt que d'échouer
      }

      // 3. Construction STRICTE du ContactPreview - ZÉRO EXTRAPOLATION
      const contactData: ContactPreview = {
        id: profile.user_id,
        owner_id: profile.user_id, // Pour la compatibilité
        display_name: profile.display_name || 
                     (profile.first_name && profile.last_name 
                       ? `${profile.first_name} ${profile.last_name}`.trim()
                       : profile.first_name || 'Non renseigné'),
        nickname: null, // Pas encore implémenté en DB
        avatar_url: profile.avatar_url || null,
        regift_enabled: profile.regift_enabled === true, // Strict boolean
        birthday: profile.birthday || null,
        preferences: []
      };

      // 4. Transformation STRICTE des préférences - pas d'invention
      if (preferences) {
        const prefs: any[] = [];
        
        // current_wants -> préférences de type "aime"
        if (Array.isArray(preferences.current_wants)) {
          preferences.current_wants.forEach((item: string) => {
            if (typeof item === 'string' && item.trim()) {
              prefs.push({
                category: 'current_wants',
                value: item.trim(),
                sentiment: 'aime',
                source: 'user_entry'
              });
            }
          });
        }

        // likes -> préférences de type "aime"
        if (Array.isArray(preferences.likes)) {
          preferences.likes.forEach((item: string) => {
            if (typeof item === 'string' && item.trim()) {
              prefs.push({
                category: 'likes',
                value: item.trim(),
                sentiment: 'aime',
                source: 'user_entry'
              });
            }
          });
        }

        // dislikes -> préférences de type "n_aime_pas"
        if (Array.isArray(preferences.dislikes)) {
          preferences.dislikes.forEach((item: string) => {
            if (typeof item === 'string' && item.trim()) {
              prefs.push({
                category: 'dislikes',
                value: item.trim(),
                sentiment: 'n_aime_pas',
                source: 'user_entry'
              });
            }
          });
        }

        // allergies -> préférences de type "allergie"
        if (Array.isArray(preferences.allergies)) {
          preferences.allergies.forEach((item: string) => {
            if (typeof item === 'string' && item.trim()) {
              prefs.push({
                category: 'allergies',
                value: item.trim(),
                sentiment: 'allergie',
                source: 'user_entry'
              });
            }
          });
        }

        contactData.preferences = prefs;
      }

      // 5. Validation finale anti-hallucination
      if (!validateContactData(contactData)) {
        console.error('Données de contact invalides:', contactData);
        setError('Données de contact corrompues');
        return;
      }

      setContact(contactData);
    } catch (err) {
      console.error('Erreur lors de la récupération du contact:', err);
      setError('Erreur technique');
    } finally {
      setLoading(false);
    }
  };

  return {
    contact,
    loading,
    error,
    refetch: fetchContactStrict
  };
}