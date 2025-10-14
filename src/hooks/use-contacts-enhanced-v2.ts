import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizePrefList } from '@/lib/display-utils';

export interface ContactEnhancedV2 {
  contact_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  city?: string;
  regift_enabled: boolean;
  birthday?: string;
  global_preferences: {
    likes?: any[];
    avoid?: any[];
    allergies?: any[];
    giftIdeas?: any[];
    sizes?: any;
  };
  occasion_prefs: any;
  // Computed fields for backwards compatibility
  wishlist: string[];
  wishlist_top3: string[];
  preview_urls?: string[];
}

export function useContactsEnhancedV2() {
  const [contacts, setContacts] = useState<ContactEnhancedV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_my_contacts_unified');

      if (fetchError) {
        console.error('Error fetching contacts:', fetchError);
        setError('Erreur lors du chargement des contacts');
        return;
      }

      // Transform the data to include computed fields
      const transformedContacts: ContactEnhancedV2[] = (data || []).map((contact: any) => {
        // Normalize global preferences
        const global_preferences = {
          likes: sanitizePrefList(contact.global_preferences?.likes),
          avoid: sanitizePrefList(contact.global_preferences?.avoid),
          allergies: sanitizePrefList(contact.global_preferences?.allergies),
          giftIdeas: sanitizePrefList(contact.global_preferences?.giftIdeas),
          sizes: contact.global_preferences?.sizes || {}
        };

        // Normalize occasion preferences
        const occasion_prefs: any = {};
        if (contact.occasion_prefs) {
          Object.keys(contact.occasion_prefs).forEach(key => {
            const pref = contact.occasion_prefs[key];
            occasion_prefs[key] = {
              likes: sanitizePrefList(pref?.likes),
              avoid: sanitizePrefList(pref?.avoid),
              allergies: sanitizePrefList(pref?.allergies),
              giftIdeas: sanitizePrefList(pref?.giftIdeas || pref?.gift_ideas)
            };
          });
        }
        
        // Extract wishlist from likes and giftIdeas
        const wishlistItems = [
          ...global_preferences.likes,
          ...global_preferences.giftIdeas
        ].filter(Boolean);

        return {
          contact_id: contact.contact_id,
          user_id: contact.user_id,
          display_name: contact.display_name,
          avatar_url: contact.avatar_url,
          city: contact.city,
          regift_enabled: contact.regift_enabled,
          birthday: contact.birthday,
          global_preferences,
          occasion_prefs,
          wishlist: wishlistItems,
          wishlist_top3: wishlistItems.slice(0, 3),
          preview_urls: []
        };
      });

      setContacts(transformedContacts);
    } catch (err) {
      console.error('Error in fetchContacts:', err);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const refetch = () => {
    fetchContacts();
  };

  return {
    contacts,
    loading,
    error,
    refetch
  };
}