import { useContacts } from "@/hooks/use-contacts-enhanced";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommonHeader } from "@/components/ui/common-header";
import { ViewProfileButton } from "@/components/ui/view-profile-button";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactsScreenProps {
  onBack: () => void;
}

export function ContactsScreen({ onBack }: ContactsScreenProps) {
  const { contacts, loading } = useContacts();

  const getInitials = (displayName: string) => {
    const names = displayName.split(' ');
    return names.map(name => name.charAt(0)).join('').slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CommonHeader title="Contacts" />
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader title="Contacts" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 rounded">
            ←
          </button>
          <h1 className="text-2xl font-bold">Mes contacts</h1>
        </div>

        <div className="space-y-4 mt-6">
          {contacts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Aucun contact pour le moment
              </p>
              <p className="text-sm text-muted-foreground">
                Acceptez des demandes d'accès pour voir vos contacts ici
              </p>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback>
                        {getInitials(contact.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {contact.display_name}
                      </h3>
                      {contact.alias && (
                        <p className="text-sm text-muted-foreground">
                          {contact.alias}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <ViewProfileButton 
                      userId={contact.user_id} 
                      variant="outline" 
                      size="sm" 
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}