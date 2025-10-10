import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { useAuth } from '@/hooks/use-auth';
import { ONBOARD_DEST } from '@/config/routing';

export default function Onboarding() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleComplete = () => {
    // Mark onboarding as done
    localStorage.setItem('onboardingDone', 'true');
    
    if (session) {
      // User got logged in during onboarding, go to home
      navigate('/home', { replace: true });
    } else {
      // User needs to login - use controlled destination
      navigate(ONBOARD_DEST, { replace: true });
    }
  };

  return (
    <OnboardingFlow 
      onComplete={handleComplete}
      showLoginAfterIntro={false}
      forceOnboarding={false}
    />
  );
}