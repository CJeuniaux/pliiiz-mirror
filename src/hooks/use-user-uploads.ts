import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface UserUpload {
  id: string;
  user_id: string;
  url: string;
  kind: string;
  created_at: string;
}

export function useUserUploads() {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadImage = async (file: File, kind: string = 'gift'): Promise<string | null> => {
    if (!user) {
      toast.error('Vous devez être connecté pour uploader une image');
      return null;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return null;
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.error('Erreur lors de l\'upload');
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(uploadData.path);

      const publicUrl = data.publicUrl;

      // Save record to database
      const { error: dbError } = await supabase
        .from('user_uploads')
        .insert({
          user_id: user.id,
          url: publicUrl,
          kind: kind
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to cleanup storage file
        await supabase.storage
          .from('user-uploads')
          .remove([uploadData.path]);
        toast.error('Erreur lors de l\'enregistrement');
        return null;
      }

      toast.success('Image uploadée avec succès');
      return publicUrl;

    } catch (error) {
      console.error('Upload exception:', error);
      toast.error('Erreur inattendue lors de l\'upload');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const getUserUploads = async (userId?: string, limit: number = 10): Promise<UserUpload[]> => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_uploads')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user uploads:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching uploads:', error);
      return [];
    }
  };

  const deleteUpload = async (uploadId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get upload info first
      const { data: uploadData, error: fetchError } = await supabase
        .from('user_uploads')
        .select('url')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !uploadData) {
        toast.error('Upload introuvable');
        return false;
      }

      // Extract file path from URL
      const urlParts = uploadData.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_uploads')
        .delete()
        .eq('id', uploadId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        toast.error('Erreur lors de la suppression');
        return false;
      }

      toast.success('Image supprimée');
      return true;

    } catch (error) {
      console.error('Delete exception:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  return {
    uploadImage,
    getUserUploads,
    deleteUpload,
    uploading
  };
}