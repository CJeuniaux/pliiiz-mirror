import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export function SignupDataTester() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [preferencesData, setPreferencesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('Profile error:', profileError);
      }
      setProfileData(profile);

      // Check preferences data
      const { data: preferences, error: prefError } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (prefError) {
        console.error('Preferences error:', prefError);
      }
      setPreferencesData(preferences);
      
    } catch (error) {
      console.error('Check user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test des données signup</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Connectez-vous pour tester</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test des données signup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User Metadata:</strong></p>
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(user.user_metadata, null, 2)}
          </pre>
        </div>

        <Button onClick={checkUserData} disabled={loading}>
          {loading ? 'Vérification...' : 'Vérifier les données en DB'}
        </Button>

        {profileData && (
          <div>
            <h4 className="font-semibold">Profil en DB:</h4>
            <pre className="text-xs bg-muted p-2 rounded">
              {JSON.stringify(profileData, null, 2)}
            </pre>
          </div>
        )}

        {preferencesData && (
          <div>
            <h4 className="font-semibold">Préférences en DB:</h4>
            <pre className="text-xs bg-muted p-2 rounded">
              {JSON.stringify(preferencesData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}