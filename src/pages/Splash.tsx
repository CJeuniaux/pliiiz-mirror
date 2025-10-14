import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '@/components/splash/splash-screen';
import { useAuth } from '@/hooks/use-auth';
import { ONBOARD_DEST } from '@/config/routing';

export default function Splash() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) return; // Wait for auth to finish loading
      
      const onboardingDone = localStorage.getItem('onboardingDone') === 'true';
      
      console.log('[Splash] Navigation logic:', { 
        session: !!session, 
        onboardingDone, 
        loading 
      });
      
      if (session) {
        // User is logged in, go to home
        console.log('[Splash] User is logged in, going to home');
        navigate('/home', { replace: true });
      } else if (!onboardingDone) {
        // First time user, show onboarding
        console.log('[Splash] First time user, showing onboarding');
        navigate('/onboarding', { replace: true });
      } else {
        // Returning user, ALWAYS show login (never register)
        console.log('[Splash] Returning user without session, redirecting to login');
        navigate('/login', { replace: true });
      }
    }, 1200); // 1.2s splash delay

    return () => clearTimeout(timer);
  }, [session, loading, navigate]);

  return (
    <SplashScreen onComplete={() => {
      // This will be handled by the useEffect above
    }} />
  );
}