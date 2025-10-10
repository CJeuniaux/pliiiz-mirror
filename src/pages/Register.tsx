import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupScreen } from '@/components/auth/signup-screen';
import { ONBOARD_DEST } from '@/config/routing';

export default function Register() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/login', { replace: true });
  };

  const handleSignupSuccess = (email: string, needsConfirmation: boolean) => {
    if (needsConfirmation) {
      // Redirect to email confirmation flow
      // For now, redirect to login with a message
      navigate('/login', { replace: true });
    } else {
      // User is signed up and authenticated, go to onboarding
      localStorage.removeItem('onboardingDone'); // Reset onboarding flag
      navigate('/onboarding', { replace: true });
    }
  };

  return (
    <SignupScreen 
      onBack={handleBack}
      onSignupSuccess={handleSignupSuccess}
    />
  );
}