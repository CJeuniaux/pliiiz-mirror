import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, RefreshCw, Database } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Contact {
  alias: string;
  avatar_url: string;
  created_at: string;
  display_name: string;
  owner_id: string;
  user_id: string;
}

export function ContactsAuditScreen() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactEmail, setContactEmail] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch all profiles for debugging
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email')
        .limit(10);

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch user's contacts
      const { data: contactsData, error: contactsError } = await supabase
        .rpc('get_user_contacts', { user_uuid: user.id });

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createBidirectionalContact = async () => {
    if (!contactEmail.trim()) {
      toast.error('Veuillez entrer un email');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .rpc('create_bidirectional_contact', { 
          contact_email: contactEmail.trim(),
          relation_type: 'friend'
        });

      if (error) throw error;
      
      toast.success('Contact créé avec succès');
      setContactEmail('');
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast.error(error.message || 'Erreur lors de la création du contact');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <p>Vous devez être connecté pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Audit des Contacts</h1>
        <Badge variant="outline">Debug</Badge>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateur Actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </CardContent>
      </Card>

      {/* Create Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un Contact Bidirectionnel
          </CardTitle>
          <CardDescription>
            Crée automatiquement la relation dans les deux sens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact-email">Email du contact</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          <Button 
            onClick={createBidirectionalContact}
            disabled={creating}
            className="w-full"
          >
            {creating ? 'Création...' : 'Créer Contact'}
          </Button>
        </CardContent>
      </Card>

      {/* Profiles List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profils Utilisateurs</CardTitle>
            <CardDescription>
              {profiles.length} profils trouvés
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground">ID: {profile.user_id}</p>
                  </div>
                  {profile.user_id === user.id && (
                    <Badge variant="default">Vous</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Contacts</CardTitle>
          <CardDescription>
            {contacts.length} contacts trouvés pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : contacts.length === 0 ? (
            <p className="text-muted-foreground">Aucun contact trouvé</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact, index) => (
                <div key={`${contact.owner_id}-${contact.user_id}-${index}`} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{contact.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Contact ID: {contact.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Créé le: {new Date(contact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}