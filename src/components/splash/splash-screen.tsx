import React from 'react';
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
import pliiizLogo from "@/assets/branding/pliiiz-logo-white-final-v3.svg";

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <ScreenFixedBG isAuth={false} topGap={200} padH={24} padB={200}>
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center justify-center">
          <img 
            src={pliiizLogo} 
            alt="PLIIIZ" 
            className="w-64 h-64 object-contain pulse"
          />
          <p className="text-white/70 text-lg font-medium mt-8">Chargement...</p>
        </div>
      </div>
    </ScreenFixedBG>
  );
}