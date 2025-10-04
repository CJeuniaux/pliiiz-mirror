import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { canonicalProfilePath, canonicalProfileUrl } from '@/lib/share';

type Options = { absolute?: boolean };

export const useShareUrl = (slug?: string, options: Options = {}) => {
  return useMemo(() => {
    if (!slug) return '';
    return options.absolute ? canonicalProfileUrl(slug) : canonicalProfilePath(slug);
  }, [slug, options.absolute]);
};

export interface ShareLink {
  id: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export function useShareLink() {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchShareLink();
    } else {
      setShareLink(null);
      setLoading(false);
    }
  }, [user]);

  const fetchShareLink = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching share link:', error);
        return;
      }

      setShareLink(data);
    } catch (error) {
      console.error('Error fetching share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleShareLink = async () => {
    if (!user || !shareLink) return;

    try {
      const newActiveState = !shareLink.is_active;
      
      const { error } = await supabase
        .from('share_links')
        .update({ is_active: newActiveState })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return;
      }

      setShareLink(prev => prev ? { ...prev, is_active: newActiveState } : null);
      toast.success(newActiveState ? 'Lien activé' : 'Lien désactivé');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getShareUrl = () => {
    if (!shareLink || !shareLink.is_active) return '';
    return canonicalProfileUrl(shareLink.slug);
  };

  const getQRCodeUrl = (size: number = 200) => {
    const url = getShareUrl();
    if (!url) return '';
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  };

  const regenerateSlug = async () => {
    if (!user) return false;

    try {
      // Generate a new unique slug
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      const newSlug = `user-${timestamp}-${random}`.toLowerCase();

      const { error } = await supabase
        .from('share_links')
        .update({ slug: newSlug })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Erreur lors de la régénération du slug');
        return false;
      }

      await fetchShareLink();
      toast.success('Nouveau lien de partage généré');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la régénération du slug');
      return false;
    }
  };

  return {
    shareLink,
    loading,
    toggleShareLink,
    getShareUrl,
    getQRCodeUrl,
    regenerateSlug,
    refetch: fetchShareLink
  };
}
