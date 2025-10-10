import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/ui/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Share2, Edit3, QrCode, Gift, Heart, X, Shirt, Utensils, DollarSign, Recycle, Settings, MapPin, Plus, Shield, Download, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { LikesCard, DislikesCard, GiftIdeasCard, SizesCard, BrandsCard } from "@/components/profile/preferences-card";
import { useProfilePreferences } from "@/hooks/use-profile-preferences";
import { calculateAge } from "@/utils/age";
import { RegenAvatarButton } from "@/components/admin/RegenAvatarButton";

// Import screens
import { EditProfileEnhancedFinal } from "@/components/screens/edit-profile-enhanced-final";
import { ShareProfileEnhancedScreen } from "@/components/screens/share-profile-enhanced-screen";
import { ShareProfileScreen } from "@/components/screens/share-profile-screen";
import { PreferencesSettingsScreen } from "@/components/screens/preferences-settings-screen";
import { PrivacySettingsScreen } from "@/components/screens/privacy-settings-screen";
import { ExportDeletionScreen } from "@/components/screens/export-deletion-screen";
import { ContactSupportScreen } from "@/components/screens/contact-support-screen";
import { QrCodeScreen } from "@/components/screens/qr-code-screen";


interface MyProfileScreenProps {
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onManageRegift?: () => void;
  onNavigateToEventPreferences?: (eventType: string) => void;
}

export function MyProfileScreen({
  onEditProfile,
  onShareProfile,
  onManageRegift,
  onNavigateToEventPreferences
}: MyProfileScreenProps) {
  const [regiftEnabled, setRegiftEnabled] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile, refetch } = useProfile();
  const { preferences, updatePreferences, loading: prefsLoading } = useProfilePreferences();

  // Sync local toggle with profile value
  useEffect(() => {
    if (profile?.regift_enabled !== undefined) {
      setRegiftEnabled(!!profile.regift_enabled);
    }
  }, [profile?.regift_enabled]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };
  
  if (!user) return null;

  // Handle screen navigation
  if (currentScreen === 'edit-profile') {
    return <EditProfileEnhancedFinal onBack={() => {
      refetch();
      setCurrentScreen(null);
    }} />;
  }
  if (currentScreen === 'share-profile') {
    return <ShareProfileScreen onBack={() => setCurrentScreen(null)} />;
  }
  if (currentScreen === 'preferences-settings') {
    return <PreferencesSettingsScreen onBack={() => setCurrentScreen(null)} />;
  }
  if (currentScreen === 'privacy-settings') {
    return <PrivacySettingsScreen onBack={() => setCurrentScreen(null)} />;
  }
  if (currentScreen === 'contact-support') {
    return <ContactSupportScreen onBack={() => setCurrentScreen(null)} />;
  }
  if (currentScreen === 'shared-links') {
    return <ShareProfileEnhancedScreen />;
  }
  if (currentScreen === 'qr-code') {
    return <QrCodeScreen onBack={() => setCurrentScreen(null)} />;
  }
  if (currentScreen === 'preferences') {
    setCurrentScreen(null);
    setTimeout(() => {
      document.getElementById('general')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return null;
  }
  
  return (
    <>
      <div className="pliiz-list">
        <div className="text-center space-y-4 profile-header-section">
          <div className="relative inline-block">
            <Avatar className="h-32 w-32 border-4 border-white/30 shadow-lg rounded-full">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} className="object-cover" />
              <AvatarFallback className="text-lg">
                {(profile?.first_name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => setCurrentScreen('edit-profile')} 
              className="btn-icon-orange absolute -right-2 -bottom-2 w-10 h-10 shadow-lg"
              aria-label="Modifier le profil"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold">
              {`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || user?.user_metadata?.first_name || 'Utilisateur'}
            </h2>
            {(() => {
              const age = profile?.birthday ? calculateAge(profile.birthday) : null;
              const city = profile?.city;
              const metaInfo = [city, age ? `${age} ans` : null].filter(Boolean).join(' · ');
              return metaInfo ? <p className="opacity-80 mt-1">{metaInfo}</p> : null;
            })()}
          </div>

          <div className="pliiz-badge mx-4">
            <Recycle className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {regiftEnabled ? "Apprécie le regift" : "Préfère les cadeaux neufs"}
            </span>
          </div>
        </div>

        {/* Préférences - Section complète */}
        {!prefsLoading && preferences && (
          <div className="space-y-4 profile-prefs-section">
            <h3 className="text-xl font-bold mb-4">
              Mes préférences
            </h3>
            
            <LikesCard
              items={preferences.likes || []}
              onAddItem={(item) => updatePreferences({ likes: [...(preferences.likes || []), item] })}
              onRemoveItem={(index) => {
                const newLikes = [...(preferences.likes || [])];
                newLikes.splice(index, 1);
                updatePreferences({ likes: newLikes });
              }}
            />

            <DislikesCard
              items={preferences.dislikes || []}
              onAddItem={(item) => updatePreferences({ dislikes: [...(preferences.dislikes || []), item] })}
              onRemoveItem={(index) => {
                const newDislikes = [...(preferences.dislikes || [])];
                newDislikes.splice(index, 1);
                updatePreferences({ dislikes: newDislikes });
              }}
            />

            <GiftIdeasCard
              items={preferences.gift_ideas || []}
              onAddItem={(item) => updatePreferences({ gift_ideas: [...(preferences.gift_ideas || []), item] })}
              onRemoveItem={(index) => {
                const newGiftIdeas = [...(preferences.gift_ideas || [])];
                newGiftIdeas.splice(index, 1);
                updatePreferences({ gift_ideas: newGiftIdeas });
              }}
            />

            <SizesCard
              sizes={preferences.sizes || {}}
              onUpdateSize={(key, value) => {
                const newSizes = { ...(preferences.sizes || {}), [key]: value };
                updatePreferences({ sizes: newSizes });
              }}
              onUpdateSizes={(newSizes) => updatePreferences({ sizes: newSizes })}
            />

            <BrandsCard
              items={preferences.brands || []}
              onAddItem={(item) => updatePreferences({ brands: [...(preferences.brands || []), item] })}
              onRemoveItem={(index) => {
                const newBrands = [...(preferences.brands || [])];
                newBrands.splice(index, 1);
                updatePreferences({ brands: newBrands });
              }}
            />
          </div>
        )}

        {/* Share Profile Section */}
        <Card>
          <div className="p-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-white/20 rounded-full">
                  <Share2 className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-1.5 text-base">Partager mon profil</h3>
                <p className="text-sm opacity-80">
                  Un profil cadeau qui te ressemble ✨ à partager avec ceux qui t'offrent des surprises 🎉
                </p>
              </div>
              <Button className="btn-orange w-full h-10 flex items-center justify-center" onClick={() => setCurrentScreen('share-profile')}>
                <Share2 className="h-4 w-4 mr-2" />
                <span>PARTAGER</span>
              </Button>
          </div>
        </Card>

        {/* Settings Section */}
        <Card>
          <div className="p-3 space-y-2">
            <h3 className="font-semibold text-sm mb-2 px-1">Réglages du compte</h3>
            <Button variant="ghost" className="w-full h-10 px-3 text-sm justify-start items-center gap-2 min-w-0" onClick={() => setCurrentScreen('privacy-settings')}>
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">Confidentialité et export</span>
            </Button>
            <Button variant="ghost" className="w-full h-10 px-3 text-sm justify-start items-center gap-2 min-w-0" onClick={() => setCurrentScreen('contact-support')}>
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">Aide</span>
            </Button>
            <Separator className="my-2" />
            <Button variant="ghost" className="w-full h-10 px-3 text-sm justify-start items-center gap-2 min-w-0 opacity-90 hover:opacity-100" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">Déconnexion</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Admin button (only visible in admin mode) */}
      <RegenAvatarButton userId={user.id} />
    </>
  );
}
