import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { usePublicProfileEnhanced } from '@/hooks/use-public-profile-enhanced';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function PublicProfileImageTester() {
  const [userId, setUserId] = useState('');
  const [userUploads, setUserUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { profile, loading: profileLoading } = usePublicProfileEnhanced(userId);

  const checkUserUploads = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Check user uploads
      const { data, error } = await supabase
        .from('user_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('User uploads error:', error);
      } else {
        console.log('User uploads found:', data);
        setUserUploads(data || []);
      }
      
    } catch (error) {
      console.error('Check user uploads error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test images profil public</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="userId">User ID à tester:</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID du user"
          />
        </div>

        <Button onClick={checkUserUploads} disabled={loading || !userId}>
          {loading ? 'Vérification...' : 'Vérifier les images'}
        </Button>

        {profileLoading && <p>Chargement du profil...</p>}
        
        {profile && (
          <div>
            <h4 className="font-semibold">Profil chargé:</h4>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p><strong>Nom:</strong> {profile.display_name}</p>
                <p><strong>Avatar URL:</strong> {profile.avatar_url || 'Aucun'}</p>
                <p><strong>Médias v2:</strong> {profile.media?.length || 0}</p>
                {profile.media && profile.media.length > 0 && (
                  <div>
                    <p>Premier média v2:</p>
                    <pre className="text-xs bg-muted p-2 rounded">
                      {JSON.stringify(profile.media[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div>
                <p><strong>Avatar rendu:</strong></p>
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={profile.media?.[0]?.url || profile.avatar_url || "/placeholder.svg"} 
                    className="object-cover" 
                  />
                  <AvatarFallback>
                    {profile.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        )}

        {userUploads.length > 0 && (
          <div>
            <h4 className="font-semibold">User uploads trouvés ({userUploads.length}):</h4>
            <div className="space-y-2">
              {userUploads.map((upload, idx) => (
                <div key={upload.id} className="border p-2 rounded">
                  <p><strong>#{idx + 1}:</strong> {upload.url}</p>
                  <p><strong>Public:</strong> {upload.is_public ? 'Oui' : 'Non'}</p>
                  <p><strong>Kind:</strong> {upload.kind}</p>
                  <p><strong>Créé:</strong> {upload.created_at}</p>
                  <img src={upload.url} alt="Upload" className="w-16 h-16 object-cover mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {userUploads.length === 0 && userId && !loading && (
          <p className="text-muted-foreground">Aucun upload trouvé pour cet utilisateur</p>
        )}
      </CardContent>
    </Card>
  );
}