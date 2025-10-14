import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useSavePreferencesV2 } from '@/hooks/use-auth-v2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function PreferencesTester() {
  const { user } = useAuth();
  const { savePreferences, loading } = useSavePreferencesV2();
  const [testResults, setTestResults] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);

  const checkCurrentPreferences = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        toast.error('Error fetching preferences');
        return;
      }

      setPreferences(data);
      setTestResults({
        hasPreferences: !!data,
        preferencesData: data
      });

      if (!data) {
        toast.info('No preferences found for this user');
      } else {
        toast.success('Preferences found');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error checking preferences');
    }
  };

  const testSavePreferences = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    const testData = {
      global_preferences: {
        likes: ['chocolat', 'vin rouge'],
        avoid: ['allergènes'],
        giftIdeas: ['livre', 'café'],
        sizes: {
          top: 'M',
          shoes: '42'
        },
        allergies: ['arachides']
      },
      occasion_prefs: {
        anniversaire: {
          likes: ['gâteau'],
          allergies: [],
          avoid: [],
          gift_ideas: ['surprise']
        }
      }
    };

    try {
      const success = await savePreferences(testData);
      if (success) {
        toast.success('Test save successful!');
        // Recheck preferences after save
        await checkCurrentPreferences();
      }
    } catch (error) {
      console.error('Test save failed:', error);
    }
  };

  const checkUsersWithoutPreferences = async () => {
    try {
      const { data, error } = await supabase.rpc('get_users_without_preferences' as any);
      
      if (error) {
        console.error('RPC error:', error);
        toast.error('Error checking users without preferences');
        return;
      }

      setTestResults(prev => ({
        ...prev,
        usersWithoutPrefs: data?.length || 0
      }));

      toast.info(`Found ${data?.length || 0} users without preferences`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error checking users');
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Preferences Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to test preferences functionality.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Preferences Tester</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the new save_preferences_v2 RPC function
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={checkCurrentPreferences} variant="outline">
            Check Current Preferences
          </Button>
          <Button 
            onClick={testSavePreferences} 
            disabled={loading}
            variant="default"
          >
            {loading ? 'Saving...' : 'Test Save Preferences'}
          </Button>
          <Button onClick={checkUsersWithoutPreferences} variant="outline">
            Check Users Without Prefs
          </Button>
        </div>

        {testResults && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            <div className="space-y-1">
              <Badge variant={testResults.hasPreferences ? "default" : "destructive"}>
                Has Preferences: {testResults.hasPreferences ? "Yes" : "No"}
              </Badge>
              {testResults.usersWithoutPrefs !== undefined && (
                <Badge variant="outline">
                  Users without prefs: {testResults.usersWithoutPrefs}
                </Badge>
              )}
            </div>
          </div>
        )}

        {preferences && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Current Preferences:</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(preferences, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}