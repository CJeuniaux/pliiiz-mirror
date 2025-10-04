import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AvatarDisplayTester() {
  const [userId, setUserId] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProfile = async () => {
    if (!userId.trim()) {
      setError('Veuillez entrer un userId');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Test avec get_public_profile_secure
      const { data, error: rpcError } = await supabase.rpc('get_public_profile_secure', {
        profile_user_id: userId
      });

      if (rpcError) {
        setError(`RPC Error: ${rpcError.message}`);
      } else if (!data || data.length === 0) {
        setError('Aucun profil trouvé ou profil non partagé');
      } else {
        setProfileData(data[0]);
      }
    } catch (e) {
      setError(`Exception: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderAvatarTest = (profile: any) => {
    const displayName = profile?.display_name || 'Utilisateur';
    const avatarUrl = profile?.avatar_url;
    
    const initials = displayName.split(' ')
      .map((s: string) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || 'U';

    return (
      <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-32 w-32 rounded-full object-cover border-2 border-gray-200 shadow-lg"
              onError={(e) => {
                console.warn('Avatar failed to load, hiding image:', avatarUrl);
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
              onLoad={() => {
                console.info('Avatar loaded successfully:', avatarUrl);
              }}
            />
          ) : null}
          
          <div 
            className={`h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center text-primary text-2xl font-bold border-2 border-gray-200 shadow-lg ${avatarUrl ? 'absolute top-0' : ''}`}
            style={{ display: avatarUrl ? 'none' : 'flex' }}
          >
            {initials}
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-bold">{displayName}</h3>
          <p className="text-sm text-muted-foreground">
            Avatar URL: {avatarUrl || 'Non défini'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🖼️ Test Affichage Avatar Public</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="User ID à tester"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Button onClick={testProfile} disabled={loading}>
            {loading ? 'Test...' : 'Tester'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {profileData && (
          <div className="space-y-4">
            <h3 className="font-semibold">Données du profil:</h3>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(profileData, null, 2)}
            </pre>
            
            <h3 className="font-semibold">Rendu de l'avatar:</h3>
            {renderAvatarTest(profileData)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}