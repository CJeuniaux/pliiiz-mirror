import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KitSearchBar } from "@/components/ui/kit-search-bar";
import { Plus, ChevronLeft, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function KitContactsScreen() {
  const navigate = useNavigate();

  const mockContacts = [
    { id: 1, name: "Marie Dubois", status: "online" },
    { id: 2, name: "Thomas Martin", status: "offline" },
    { id: 3, name: "Sophie Laurent", status: "online" },
    { id: 4, name: "Jean Dupont", status: "offline" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="h-4 bg-primary rounded-full w-24"></div>
        <Button variant="ghost" size="icon">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <KitSearchBar 
          placeholder="Rechercher des contacts..."
          className="h-12"
        />
      </div>

      {/* Section Title */}
      <div className="px-4 mb-4">
        <div className="h-4 bg-primary rounded-full w-1/3"></div>
      </div>

      {/* Contacts List */}
      <div className="px-4 flex-1">
        {mockContacts.map((contact) => (
          <Card key={contact.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-muted rounded-full relative">
                  {contact.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="h-4 bg-primary rounded-full w-2/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded-full w-1/2"></div>
                </div>
                
                {/* Action */}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="px-4 mb-6">
        <div className="h-4 bg-muted rounded-full w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <Card key={item}>
              <CardContent className="p-4">
                <div className="h-4 bg-primary rounded-full w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded-full w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Contact Button */}
      <div className="px-4 pb-8">
        <Button 
          variant="kit" 
          size="lg" 
          className="w-full h-14"
          onClick={() => navigate('/contacts/add')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un contact
        </Button>
      </div>
    </div>
  );
}