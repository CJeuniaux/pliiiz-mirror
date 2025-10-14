import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useProfile } from './use-profile';
import { toast } from 'sonner';

export function useAvatar() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return { error: 'User not authenticated' };
    }

    try {
      setUploading(true);
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return { error: 'Invalid file type' };
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return { error: 'File too large' };
      }

      // Utiliser l'edge function pour upload
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('upload-avatar', {
        body: formData
      });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Erreur lors de l\'upload');
        return { error };
      }

      const publicUrl = data.avatar_url;

      // Le profil sera automatiquement mis à jour par l'edge function

      toast.success('Avatar mis à jour');
      return { data: publicUrl };

    } catch (error) {
      console.error('Avatar upload exception:', error);
      toast.error('Erreur lors de l\'upload');
      return { error };
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async () => {
    if (!user) return { error: 'User not authenticated' };

    try {
      setUploading(true);

      // Supprimer de Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`]);

      // Mettre à jour le profil (enlever l'URL)
      const { error: updateError } = await updateProfile({ 
        avatar_url: null 
      });

      if (updateError) {
        console.error('Profile update error:', updateError);
        toast.error('Erreur lors de la suppression');
        return { error: updateError };
      }

      toast.success('Avatar supprimé');
      return { data: null };

    } catch (error) {
      console.error('Avatar delete exception:', error);
      toast.error('Erreur lors de la suppression');
      return { error };
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    uploading
  };
}