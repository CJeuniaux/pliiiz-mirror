import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // When user confirms email, ensure profile exists (defer with setTimeout)
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setTimeout(() => {
            ensureProfileExists(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer the profile check to avoid blocking the auth state update
        setTimeout(() => {
          ensureProfileExists(session.user);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to ensure profile exists
  const ensureProfileExists = async (user: User) => {
    try {
      console.log('[useAuth] Checking if profile exists for user:', user.id);
      console.log('[useAuth] User metadata:', user.user_metadata);
      
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, birthday, city, country')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('[useAuth] Existing profile data:', data);
      
      if (!data) {
        console.log('[useAuth] Profile does not exist, creating...');
        // Profile doesn't exist, create it using safe upsert function
        const profileData = {
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email,
          email_verified: user.email_confirmed_at !== null,
          birthday: user.user_metadata?.birthday || undefined,
          city: user.user_metadata?.city || undefined,
          country: user.user_metadata?.country || undefined
        };
        
        console.log('[useAuth] Creating profile with data:', profileData);
        
        const { error } = await supabase.rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: profileData
        });
        
        if (error) {
          console.error('[useAuth] Error creating profile:', error);
        } else {
          console.log('[useAuth] Profile created successfully');
        }
      } else {
        console.log('[useAuth] Profile already exists');
      }
    } catch (error) {
      console.error('[useAuth] Error ensuring profile exists:', error);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName?: string, birthday?: string, city?: string, country?: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const signupData = {
        first_name: firstName?.trim() || undefined,
        last_name: lastName?.trim() || undefined,
        birthday: birthday || undefined,
        city: city?.trim() || undefined,
        country: country?.trim() || undefined
      };
      
      console.log('[useAuth] Signing up with data:', { 
        email: normalizedEmail, 
        ...signupData 
      });
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: signupData
        }
      });

      if (error) {
        console.error('[useAuth] Signup error:', error);
        toast.error(error.message);
        return { error, needsConfirmation: false };
      }

      console.log('[useAuth] Signup successful:', { 
        user: data.user?.id, 
        session: !!data.session,
        userData: data.user?.user_metadata 
      });

      const needsConfirmation = !data.session;
      toast.success(
        needsConfirmation
          ? 'Compte créé ! Vérifiez votre email pour confirmer votre compte.'
          : 'Compte créé et connecté !'
      );
      return { error: null, needsConfirmation };
    } catch (error: any) {
      console.error('[useAuth] Signup exception:', error);
      toast.error('Erreur lors de la création du compte');
      return { error, needsConfirmation: false };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        console.error('Resend email error:', error);
        toast.error('Erreur lors du renvoi de l\'email: ' + error.message);
        return { error };
      }
      toast.success('Email de confirmation renvoyé avec succès.');
      return { error: null };
    } catch (error: any) {
      console.error('Resend email exception:', error);
      toast.error('Erreur lors du renvoi de l\'email');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Connexion réussie !');
      return { error: null };
    } catch (error) {
      toast.error('Erreur lors de la connexion');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Début de la déconnexion');

      // 1) Clear local UI state immediately
      setSession(null);
      setUser(null);

      // 2) Ask Supabase to revoke tokens and clear its stored session
      let { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.warn('[signOut] Global signout failed, retrying local only:', error);
        const fallback = await supabase.auth.signOut();
        if (fallback.error) {
          console.warn('[signOut] Local signout also failed:', fallback.error);
        }
      }

      // 3) Extra hard cleanup: remove any persisted sb-* auth tokens (defensive)
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith('sb-') && k.includes('-auth-token')) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('[signOut] Failed to scan/remove sb-* keys:', e);
      }

      // App-specific flags
      localStorage.removeItem('onboardingDone');
      sessionStorage.removeItem('intendedPath');

      console.log('Déconnexion terminée');
      toast.success('Déconnexion réussie', { duration: 2000 });

      // 4) Full redirect to onboarding (will show intro screen)
      window.location.replace('/onboarding');
      return { error: null };
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);

      // Force logout UI even on error
      setSession(null);
      setUser(null);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}

      toast.error('Déconnexion forcée');
      window.location.replace('/login');
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        toast.error('Erreur lors de l\'envoi du lien de réinitialisation');
        return { error };
      }
      
      toast.success('Lien de réinitialisation envoyé par email', { duration: 3000 });
      return { error: null };
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du lien de réinitialisation');
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    resendConfirmationEmail,
    signIn,
    signOut,
    resetPassword
  };
}