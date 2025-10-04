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
        <div className="animate-pulse">
          <div className="h-32 w-32 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 p-6">
            <img 
              src={pliiizLogo} 
              alt="PLIIIZ" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-white/70 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    </ScreenFixedBG>
  );
}