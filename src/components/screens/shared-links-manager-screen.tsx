import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Share2, Copy, Trash2, Plus, Link } from "lucide-react";
import { toast } from "sonner";

interface SharedLinksManagerScreenProps {
  onBack: () => void;
}

interface SharedLink {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  expiresAt?: Date;
  sections: string[];
  isActive: boolean;
  clickCount: number;
}

export function SharedLinksManagerScreen({ onBack }: SharedLinksManagerScreenProps) {
  const [links, setLinks] = useState<SharedLink[]>([
    {
      id: "1",
      name: "Lien anniversaire Thomas",
      url: "https://app.pliiiz.com/p/abc123",
      createdAt: new Date("2024-01-15"),
      expiresAt: new Date("2024-02-15"),
      sections: ["likes", "dislikes", "allergies"],
      isActive: true,
      clickCount: 5
    },
    {
      id: "2",
      name: "Partage général",
      url: "https://app.pliiiz.com/p/def456",
      createdAt: new Date("2024-01-10"),
      sections: ["likes", "tailles"],
      isActive: true,
      clickCount: 12
    }
  ]);

  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkDuration, setNewLinkDuration] = useState("30");
  const [selectedSections, setSelectedSections] = useState<string[]>(["likes"]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Lien copié !");
  };

  const deactivateLink = (id: string) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, isActive: false } : link
    ));
    toast.success("Lien désactivé");
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
    toast.success("Lien supprimé");
  };

  const createNewLink = () => {
    if (!newLinkName.trim()) {
      toast.error("Veuillez donner un nom au lien");
      return;
    }

    const newLink: SharedLink = {
      id: Date.now().toString(),
      name: newLinkName,
      url: `https://app.pliiiz.com/p/${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + parseInt(newLinkDuration) * 24 * 60 * 60 * 1000),
      sections: selectedSections,
      isActive: true,
      clickCount: 0
    };

    setLinks([newLink, ...links]);
    setNewLinkName("");
    setNewLinkDuration("30");
    setSelectedSections(["likes"]);
    toast.success("Nouveau lien créé !");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const isExpired = (date?: Date) => {
    return date ? date < new Date() : false;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Gérer mes liens partagés" 
        subtitle="Créez et gérez vos liens de partage"
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {/* Créer un nouveau lien */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Créer un nouveau lien
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom du lien</label>
              <Input
                placeholder="ex: Lien pour l'anniversaire de Marie"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Durée de validité</label>
              <Select value={newLinkDuration} onValueChange={setNewLinkDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                  <SelectItem value="365">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Sections à partager</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["likes", "dislikes", "allergies", "tailles"].map((section) => (
                  <Badge
                    key={section}
                    variant={selectedSections.includes(section) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedSections.includes(section)) {
                        setSelectedSections(selectedSections.filter(s => s !== section));
                      } else {
                        setSelectedSections([...selectedSections, section]);
                      }
                    }}
                  >
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button onClick={createNewLink} className="w-full bg-primary hover:bg-primary/90">
              Créer le lien
            </Button>
          </CardContent>
        </Card>

        {/* Liste des liens existants */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mes liens partagés</h3>
          
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{link.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Créé le {formatDate(link.createdAt)}
                      </p>
                      {link.expiresAt && (
                        <p className="text-sm text-muted-foreground">
                          Expire le {formatDate(link.expiresAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={link.isActive && !isExpired(link.expiresAt) ? "default" : "secondary"}>
                        {link.isActive && !isExpired(link.expiresAt) ? "Actif" : "Inactif"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {link.clickCount} vues
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {link.sections.map((section) => (
                      <Badge key={section} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="bg-muted p-2 rounded text-sm font-mono break-all">
                    {link.url}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyToClipboard(link.url)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier
                    </Button>
                    
                    {link.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateLink(link.id)}
                      >
                        <Link className="h-3 w-3 mr-1" />
                        Désactiver
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteLink(link.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {links.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun lien partagé pour le moment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}