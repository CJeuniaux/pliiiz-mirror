import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the fragment from the URL (access_token, refresh_token, etc.)
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            navigate('/', { replace: true });
            return;
          }
          
          // Successfully authenticated, redirect to main page
          navigate('/', { replace: true });
        } else {
          // No tokens found, redirect to main page
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Finalisation de la connexion...</p>
      </div>
    </div>
  );
}