import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Vérifie qu'une session active existe
 * @throws Error si pas de session
 */
export async function requireSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('[requireSession] Error getting session:', error);
    throw new Error('Erreur de session : veuillez vous reconnecter.');
  }
  
  if (!session) {
    console.warn('[requireSession] No active session found');
    throw new Error('Session expirée : veuillez vous reconnecter.');
  }
  
  return session;
}

/**
 * Wrapper pour exécuter une opération Supabase avec timeout et gestion d'erreurs
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 15000,
  timeoutMessage: string = 'Temps d\'attente dépassé, veuillez réessayer'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );

  return Promise.race([operation, timeoutPromise]);
}

/**
 * Gère les erreurs d'authentification (401/403) en déconnectant l'utilisateur
 */
export async function handleAuthError(error: any) {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  // Détecter les erreurs d'authentification
  const isAuthError = 
    errorCode === 'PGRST301' || // JWT expired
    errorCode === '401' ||
    errorCode === '403' ||
    errorMessage.includes('JWT') ||
    errorMessage.includes('expired') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('permission denied');

  if (isAuthError) {
    console.error('[handleAuthError] Auth error detected, signing out:', error);
    toast.error('Session expirée, reconnexion nécessaire');
    
    await supabase.auth.signOut();
    
    // Rediriger vers login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
    
    throw new Error('Session expirée');
  }
}

/**
 * Wrapper générique pour les opérations Supabase avec gestion complète des erreurs
 */
export async function executeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    timeout?: number;
    showToast?: boolean;
  } = {}
): Promise<T> {
  const {
    successMessage,
    errorMessage = 'Une erreur est survenue',
    timeout = 15000,
    showToast = true
  } = options;

  try {
    // Vérifier la session
    await requireSession();

    // Exécuter l'opération avec timeout
    const { data, error } = await withTimeout(
      operation(),
      timeout,
      'Temps d\'attente dépassé, veuillez réessayer'
    );

    if (error) {
      // Gérer les erreurs d'authentification
      await handleAuthError(error);
      
      // Afficher l'erreur détaillée
      const detailedError = `${errorMessage}: ${error.message || 'Erreur inconnue'}`;
      console.error('[executeSupabaseOperation] Error:', error);
      
      if (showToast) {
        toast.error(detailedError);
      }
      
      throw new Error(detailedError);
    }

    if (!data) {
      const noDataError = `${errorMessage}: Aucune donnée retournée`;
      if (showToast) {
        toast.error(noDataError);
      }
      throw new Error(noDataError);
    }

    // Succès
    if (successMessage && showToast) {
      toast.success(successMessage);
    }

    return data;
  } catch (error: any) {
    // Re-throw si c'est déjà une erreur gérée
    if (error.message.includes('Session expirée') || error.message.includes('Temps d\'attente dépassé')) {
      throw error;
    }

    // Sinon, gérer comme erreur générique
    const genericError = `${errorMessage}: ${error?.message || 'Erreur inconnue'}`;
    console.error('[executeSupabaseOperation] Unexpected error:', error);
    
    if (showToast) {
      toast.error(genericError);
    }
    
    throw new Error(genericError);
  }
}
