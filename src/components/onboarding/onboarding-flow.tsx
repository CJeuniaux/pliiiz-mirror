import { useEffect, useState } from "react";
import { OnboardingIntro } from "./onboarding-intro";
import { WelcomeScreen } from "./welcome-screen";
import { EventTypesScreen } from "./event-types-screen";
import { PreferencesScreen } from "./preferences-screen";
import { CurrentWantsScreen } from "./current-wants-screen";
import { PrivacyScreen } from "./privacy-screen";
import { LoginScreen } from "../auth/login-screen";
import { SignupScreen } from "../auth/signup-screen";
import { EmailConfirmationScreen } from "../auth/email-confirmation-screen";
import { EventType, CurrentWant } from "@/types/pliiiz";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingFlowProps {
  onComplete: () => void;
  showLoginAfterIntro?: boolean;
  forceOnboarding?: boolean;
  forceLogin?: boolean; // Nouveau prop pour aller directement au login
}

export function OnboardingFlow({ onComplete, showLoginAfterIntro = false, forceOnboarding = false, forceLogin = false }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(forceLogin ? -0.5 : -1); // Si forceLogin, commencer directement au login
  const [userData, setUserData] = useState<{ firstName: string; email: string } | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [currentWants, setCurrentWants] = useState<CurrentWant[]>([]);
  const [showSignup, setShowSignup] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  
  
  const { user, signUp, resendConfirmationEmail } = useAuth();

  const handleIntroComplete = () => {
    if (showLoginAfterIntro) {
      setCurrentStep(-0.5); // Login step
    } else {
      setCurrentStep(0);
    }
  };

  const handleLoginSuccess = () => {
    onComplete();
  };

  const handleRegister = () => {
    setShowSignup(true);
  };

  const handleSignupSuccess = (email: string, needsConfirmation: boolean) => {
    setSignupEmail(email);
    setShowSignup(false);
    
    if (needsConfirmation) {
      setShowEmailConfirmation(true);
    } else {
      // No confirmation needed, continue onboarding directly
      setCurrentStep(0);
    }
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
    setShowEmailConfirmation(false);
  };

  const handleResendEmail = async () => {
    if (signupEmail) {
      await resendConfirmationEmail(signupEmail);
    }
  };

  const handleWelcomeNext = (data: { firstName: string; email: string }) => {
    setUserData(data);
    setCurrentStep(1);
  };

  const handleEventTypesNext = (eventTypes: EventType[]) => {
    setSelectedEventTypes(eventTypes);
    setCurrentStep(2);
  };

  const handlePreferencesNext = (prefs: any) => {
    setPreferences(prefs);
    setCurrentStep(3);
  };

  const handleCurrentWantsNext = (wants: CurrentWant[]) => {
    setCurrentWants(wants);
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(Math.max(-1, currentStep - 1));
  };

  const handlePrivacyNext = async (privacySettings: any) => {
    // Save the complete onboarding data to Supabase for the new user
    if (user && userData) {
      try {
        // Save profile data - utiliser la fonction sécurisée
        await supabase.rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: {
            first_name: userData.firstName,
            email: userData.email,
          }
        });
        
        // Save preferences with all onboarding data - utiliser la fonction sécurisée
        await supabase.rpc('safe_upsert_preferences', {
          p_user_id: user.id,
          p_updates: {
            likes: preferences?.likes || [],
            dislikes: preferences?.dislikes || [],
            allergies: preferences?.allergies || [],
            current_wants: currentWants.map(w => w.title) || [],
            sizes: preferences?.sizes || {}
          }
        });
        
        console.log('Onboarding data saved successfully');
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      }
    }
    onComplete();
  };

  // If user is authenticated and not forcing onboarding, complete via effect
  // to avoid side-effects during render
  // (prevents blank screen and render loops)
  // Note: we keep showing the intro step until parent unmounts
  
  // useEffect below will handle redirection
  useEffect(() => {
    if (user && !forceOnboarding && !showSignup && !showEmailConfirmation && currentStep === -1) {
      console.log('[OnboardingFlow] user already authenticated -> completing intro');
      onComplete();
    }
  }, [user, forceOnboarding, showSignup, showEmailConfirmation, currentStep, onComplete]);

  // Show email confirmation screen if waiting for email verification
  if (showEmailConfirmation) {
    return (
      <EmailConfirmationScreen
        email={signupEmail}
        onBack={handleBackToLogin}
        onResendEmail={handleResendEmail}
      />
    );
  }

  // Show signup screen if requested
  if (showSignup) {
    return (
      <SignupScreen
        onBack={handleBackToLogin}
        onSignupSuccess={handleSignupSuccess}
      />
    );
  }

  switch (currentStep) {
    case -1:
      return <OnboardingIntro onComplete={onComplete} />;
    case -0.5:
      return <LoginScreen onLogin={handleLoginSuccess} onRegister={handleRegister} />;
    case 0:
      return <WelcomeScreen onNext={handleWelcomeNext} />;
    case 1:
      return <EventTypesScreen onNext={handleEventTypesNext} onBack={handleBack} />;
    case 2:
      return <PreferencesScreen onNext={handlePreferencesNext} onBack={handleBack} />;
    case 3:
      return <CurrentWantsScreen onNext={handleCurrentWantsNext} onBack={handleBack} />;
    case 4:
      return (
        <PrivacyScreen 
          onNext={handlePrivacyNext} 
          onBack={handleBack}
          safeBets={preferences?.safeBets || []}
          budgetRanges={preferences?.budgetRanges || []}
        />
      );
    default:
      return <OnboardingIntro onComplete={handleIntroComplete} />;
  }
}