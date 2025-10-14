import React, { useState, useEffect } from "react";
import { RegiftModal } from "@/components/modals/regift-modal";
import { OfferGiftsScreen } from "@/components/screens/offer-gifts-screen-enhanced";
import { useUniversalBack } from "@/hooks/use-universal-back";

interface RecipientProfile {
  id: string;
  firstName: string;
  regift_enabled?: boolean;
  regift_note?: string;
}

interface OfferThisScreenProps {
  category?: string;
  contactName: string;
  recipientProfile?: RecipientProfile;
  onBack: () => void;
  // Backward compatibility
  gift?: {
    title: string;
    image: string;
    description: string;
  };
  giftTitle?: string;
}

export function OfferThisScreen({ 
  category, 
  contactName, 
  recipientProfile,
  onBack,
  gift,
  giftTitle
}: OfferThisScreenProps) {
  const [showRegift, setShowRegift] = useState(false);
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;

  // Determine category from gift if not provided
  const actualCategory = category || (gift?.title?.toLowerCase().includes('chocolat') ? 'chocolat' : 'chocolat');

  // Always scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (recipientProfile?.regift_enabled) {
      setShowRegift(true);
      // Optional tracking
      console.log("RegiftModalShown", { userId: recipientProfile.id });
    }
  }, [recipientProfile?.regift_enabled]);

  return (
    <>
      <OfferGiftsScreen 
        category={actualCategory}
        contactName={contactName}
        onBack={handleBack}
      />
      
      <RegiftModal
        open={showRegift}
        onClose={() => setShowRegift(false)}
        firstName={recipientProfile?.firstName || contactName}
        note={recipientProfile?.regift_note}
      />
    </>
  );
}