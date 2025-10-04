import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit3, MapPin, Calendar } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

export function KitProfileScreen() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const profileData = {
    name: profile?.display_name || user?.email?.split('@')[0] || 'Utilisateur',
    city: profile?.city || 'Non renseigné',
    age: profile?.birthday ? new Date().getFullYear() - new Date(profile.birthday).getFullYear() : null,
    avatar: profile?.avatar_url
  };

  const preferences = {
    likes: [],
    dislikes: [],
    ideas: [],
    sizes: [],
    brands: []
  };

  const renderPreferenceCard = (title: string, items: string[], color: string, emptyMessage: string) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-inter font-semibold flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge key={index} variant="secondary" className="rounded-[12px]">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Title */}
      <div className="px-4 py-4 text-center">
        <div className="h-4 bg-primary rounded-full w-1/2 mx-auto"></div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-6 text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-muted rounded-full mx-auto relative">
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full w-8 h-8"
              onClick={() => navigate('/edit-profile')}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="h-5 bg-primary rounded-full w-2/3 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded-full w-1/2 mx-auto"></div>
        </div>
      </div>

      {/* Section Title */}
      <div className="px-4 mb-4">
        <div className="h-4 bg-muted rounded-full w-1/3"></div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mb-6 space-y-3">
        {[
          { icon: Settings, title: "Paramètres", color: "bg-gray-100" },
          { icon: MapPin, title: "Notifications", color: "bg-blue-100" },
          { icon: Calendar, title: "Historique", color: "bg-yellow-100" }
        ].map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between h-auto p-0 text-left"
                onClick={() => navigate('/settings')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="h-4 bg-primary rounded-full w-24"></div>
                </div>
                <span className="text-muted-foreground">›</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second Section Title */}
      <div className="px-4 mb-4">
        <div className="h-4 bg-muted rounded-full w-1/3"></div>
      </div>

      {/* Additional Menu Items */}
      <div className="px-4 mb-6 space-y-3">
        {[
          { icon: Settings, title: "Sécurité", color: "bg-blue-100" },
          { icon: MapPin, title: "Confidentialité", color: "bg-yellow-100" },
          { icon: Calendar, title: "Aide", color: "bg-red-100" }
        ].map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-between h-auto p-0 text-left"
                onClick={() => navigate('/settings')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="h-4 bg-primary rounded-full w-32"></div>
                </div>
                <span className="text-muted-foreground">›</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Last Item */}
      <div className="px-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-0 text-left"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-destructive" />
                </div>
                <div className="h-4 bg-primary rounded-full w-20"></div>
              </div>
              <span className="text-muted-foreground">›</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}