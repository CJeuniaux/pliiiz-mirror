import React, { useState } from "react";
import { useUniversalBack } from "@/hooks/use-universal-back";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnsplashMentionsModal } from "@/components/ui/unsplash-mentions-modal";
import { Plus, X, Heart, HeartOff, User, ShirtIcon, Apple, Info } from "lucide-react";

interface PreferencesSettingsScreenProps {
  onBack: () => void;
}

export function PreferencesSettingsScreen({ onBack }: PreferencesSettingsScreenProps) {
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;
  
  const [newLike, setNewLike] = useState("");
  const [newDislike, setNewDislike] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [mentionsOpen, setMentionsOpen] = useState(false);
  
  const [likes, setLikes] = useState([
    "Café de spécialité",
    "Papeterie premium",
    "Plantes faciles",
    "Chocolat noir 85%"
  ]);
  
  const [dislikes, setDislikes] = useState([
    "Parfums forts",
    "Gadgets encombrants",
    "Fleurs coupées"
  ]);
  
  const [allergies, setAllergies] = useState([
    "Arachides"
  ]);
  
  const [sizes, setSizes] = useState({
    top: "S",
    bottom: "36",
    shoes: "38"
  });

  const addLike = () => {
    if (newLike.trim()) {
      setLikes([...likes, newLike.trim()]);
      setNewLike("");
    }
  };

  const removeLike = (index: number) => {
    setLikes(likes.filter((_, i) => i !== index));
  };

  const addDislike = () => {
    if (newDislike.trim()) {
      setDislikes([...dislikes, newDislike.trim()]);
      setNewDislike("");
    }
  };

  const removeDislike = (index: number) => {
    setDislikes(dislikes.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Gérer mes préférences" 
        subtitle="Aide tes contacts à trouver le cadeau parfait"
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {/* J'aime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              J'aime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {likes.map((like, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {like}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeLike(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter quelque chose que j'aime..."
                value={newLike}
                onChange={(e) => setNewLike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLike()}
                className="flex-1"
              />
              <Button onClick={addLike} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* À éviter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartOff className="h-5 w-5 text-gray-500" />
              À éviter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {dislikes.map((dislike, index) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {dislike}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeDislike(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter quelque chose à éviter..."
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDislike()}
                className="flex-1"
              />
              <Button onClick={addDislike} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tailles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShirtIcon className="h-5 w-5 text-blue-500" />
              Tailles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Haut</label>
                <Select value={sizes.top} onValueChange={(value) => setSizes({...sizes, top: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Bas</label>
                <Input 
                  value={sizes.bottom}
                  onChange={(e) => setSizes({...sizes, bottom: e.target.value})}
                  placeholder="ex: 36, 38/40..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chaussures</label>
                <Input 
                  value={sizes.shoes}
                  onChange={(e) => setSizes({...sizes, shoes: e.target.value})}
                  placeholder="ex: 38, 39..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-orange-500" />
              Allergies & Intolérances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 border-orange-200">
                  {allergy}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeAllergy(index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une allergie ou intolérance..."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                className="flex-1"
              />
              <Button onClick={addAllergy} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              À propos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              className="justify-start p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
              onClick={() => setMentionsOpen(true)}
            >
              Mentions & crédits photo
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleBack}
          >
            Annuler
          </Button>
          <Button 
            className="flex-1 bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--pliiz-primary-hover))] text-white"
          >
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Unsplash mentions modal */}
      <UnsplashMentionsModal 
        open={mentionsOpen} 
        onOpenChange={setMentionsOpen} 
      />
    </div>
  );
}