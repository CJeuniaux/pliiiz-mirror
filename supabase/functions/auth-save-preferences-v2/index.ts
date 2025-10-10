import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

interface SavePreferencesRequest {
  // Global preferences
  regift?: boolean;
  age?: number;
  city?: string;
  likes?: string[];
  avoid?: string[];
  gift_ideas?: string[];
  sizes?: {
    top?: string;
    bottom?: string;
    shoes?: string;
    ring?: string;
    other?: string;
  };
  allergies?: string[];
  
  // Occasion-specific preferences
  occasions?: {
    brunch?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
    cremaillere?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
    anniversaire?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
    diner_amis?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'PUT') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid authorization header' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[SavePrefs V2] Auth error:', authError);
      return new Response(JSON.stringify({ 
        error: 'Invalid token or user not found' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get idempotency key (optional for PUT requests)
    const idempotencyKey = req.headers.get('idempotency-key');

    // Parse request body
    const body: SavePreferencesRequest = await req.json();
    
    console.log(`[SavePrefs V2] Processing preferences for user: ${user.id}`);

    try {
      // Start transaction-like operations
      
      // 1. Update profile data (regift, age, city, global_preferences, occasion_prefs)
      const profileUpdates: any = {};
      
      if (body.regift !== undefined) {
        profileUpdates.regift_enabled = body.regift;
      }
      
      if (body.city !== undefined) {
        profileUpdates.city = body.city?.trim() || null;
      }

      // Build global_preferences object
      const globalPrefs: any = {};
      if (body.likes !== undefined) globalPrefs.likes = body.likes || [];
      if (body.avoid !== undefined) globalPrefs.avoid = body.avoid || [];
      if (body.gift_ideas !== undefined) globalPrefs.giftIdeas = body.gift_ideas || [];
      if (body.allergies !== undefined) globalPrefs.allergies = body.allergies || [];
      if (body.sizes !== undefined) globalPrefs.sizes = body.sizes || {};

      if (Object.keys(globalPrefs).length > 0) {
        profileUpdates.global_preferences = globalPrefs;
      }

      // Build occasion_prefs object
      if (body.occasions) {
        const occasionPrefs: any = {};
        
        for (const [occasion, prefs] of Object.entries(body.occasions)) {
          if (prefs) {
            occasionPrefs[occasion] = {
              likes: prefs.likes || [],
              allergies: prefs.allergies || [],
              avoid: prefs.avoid || [],
              giftIdeas: prefs.gift_ideas || []
            };
          }
        }
        
        if (Object.keys(occasionPrefs).length > 0) {
          profileUpdates.occasion_prefs = occasionPrefs;
        }
      }

      // Update profile if we have profile updates
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .rpc('safe_upsert_profile', {
            p_user_id: user.id,
            p_updates: profileUpdates
          });

        if (profileError) {
          console.error('[SavePrefs V2] Profile update error:', profileError);
          throw profileError;
        }
      }

      // 2. Update preferences table (legacy compatibility)
      const prefsUpdates: any = {};
      if (body.likes !== undefined) prefsUpdates.likes = body.likes;
      if (body.avoid !== undefined) prefsUpdates.dislikes = body.avoid; // avoid -> dislikes mapping
      if (body.allergies !== undefined) prefsUpdates.allergies = body.allergies;
      if (body.gift_ideas !== undefined) prefsUpdates.gift_ideas = body.gift_ideas;
      if (body.sizes !== undefined) prefsUpdates.sizes = body.sizes;

      if (Object.keys(prefsUpdates).length > 0) {
        const { error: prefsError } = await supabase
          .rpc('safe_upsert_preferences', {
            p_user_id: user.id,
            p_updates: prefsUpdates
          });

        if (prefsError) {
          console.error('[SavePrefs V2] Preferences update error:', prefsError);
          throw prefsError;
        }
      }

      // 3. Increment version and trigger replication
      const { data: versionData, error: versionError } = await supabase
        .from('profiles')
        .select('global_preferences->_version')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentVersion = versionData?.global_preferences?._version || 1;
      const newVersion = currentVersion + 1;

      // Update version in global_preferences
      const { error: versionUpdateError } = await supabase
        .from('profiles')
        .update({
          global_preferences: supabase.raw(`
            COALESCE(global_preferences, '{}') || '{"_version": ${newVersion}}'::jsonb
          `),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (versionUpdateError) {
        console.error('[SavePrefs V2] Version update error:', versionUpdateError);
        throw versionUpdateError;
      }

      // 4. Add to replication outbox
      const outboxKey = idempotencyKey || `save_prefs_${user.id}_${newVersion}_${Date.now()}`;
      
      const { error: outboxError } = await supabase
        .from('replication_outbox')
        .insert({
          user_id: user.id,
          event_type: 'UPSERT_PROFILE',
          source_version: newVersion,
          payload: { 
            user_id: user.id, 
            operation: 'save_preferences',
            fields_updated: Object.keys({ ...profileUpdates, ...prefsUpdates })
          },
          idempotency_key: outboxKey
        });

      if (outboxError && !outboxError.message.includes('duplicate key')) {
        console.error('[SavePrefs V2] Outbox error:', outboxError);
        // Don't fail the save for outbox errors
      }

      console.log(`[SavePrefs V2] Success for user: ${user.id}, version: ${newVersion}`);

      return new Response(JSON.stringify({ 
        success: true,
        version: newVersion,
        message: 'Preferences saved successfully'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('[SavePrefs V2] Transaction error:', error);
      
      return new Response(JSON.stringify({
        error: error.message || 'Failed to save preferences',
        code: 'SAVE_PREFERENCES_FAILED'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('[SavePrefs V2] General error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});