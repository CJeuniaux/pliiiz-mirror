import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fonction pour appliquer le soft backfill sur un array d'objets préférences
    const applySoftBackfill = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => {
        if (typeof item === 'string') {
          // Legacy string format -> convert to object with level 2
          return { label: item, level: 2, freeText: true };
        } else if (typeof item === 'object' && item !== null) {
          // Object format -> set level = 2 if missing
          return { ...item, level: item.level ?? 2 };
        }
        return item;
      });
    };

    // Fonction pour traiter les préférences globales
    const processGlobalPreferences = (globalPrefs: any): any => {
      const processed = { ...globalPrefs };
      
      if (processed.likes) {
        processed.likes = applySoftBackfill(processed.likes);
      }
      
      if (processed.giftIdeas) {
        processed.giftIdeas = applySoftBackfill(processed.giftIdeas);
      }

      return processed;
    };

    // Fonction pour traiter les préférences d'occasion
    const processOccasionPreferences = (occasionPrefs: any): any => {
      const processed = { ...occasionPrefs };
      
      Object.keys(processed).forEach(slug => {
        const occasion = processed[slug];
        if (occasion && typeof occasion === 'object') {
          if (occasion.likes) {
            occasion.likes = applySoftBackfill(occasion.likes);
          }
          if (occasion.giftIdeas) {
            occasion.giftIdeas = applySoftBackfill(occasion.giftIdeas);
          }
        }
      });

      return processed;
    };

    console.log('Starting soft backfill migration...');

    // Récupérer tous les profils
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, global_preferences, occasion_prefs');

    if (fetchError) {
      throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
    }

    let updatedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      const updates = [];

      for (const profile of batch) {
        const originalGlobal = profile.global_preferences || {};
        const originalOccasion = profile.occasion_prefs || {};

        const processedGlobal = processGlobalPreferences(originalGlobal);
        const processedOccasion = processOccasionPreferences(originalOccasion);

        // Vérifier s'il y a des changements
        const globalChanged = JSON.stringify(originalGlobal) !== JSON.stringify(processedGlobal);
        const occasionChanged = JSON.stringify(originalOccasion) !== JSON.stringify(processedOccasion);

        if (globalChanged || occasionChanged) {
          updates.push({
            user_id: profile.user_id,
            global_preferences: processedGlobal,
            occasion_prefs: processedOccasion
          });
        }
      }

      // Appliquer les mises à jour par batch
      if (updates.length > 0) {
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              global_preferences: update.global_preferences,
              occasion_prefs: update.occasion_prefs,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', update.user_id);

          if (updateError) {
            console.error(`Failed to update profile ${update.user_id}:`, updateError.message);
          } else {
            updatedCount++;
          }
        }
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profiles.length / batchSize)}`);
    }

    console.log(`Soft backfill completed. Updated ${updatedCount} profiles.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedCount,
        totalProfiles: profiles.length,
        message: 'Soft backfill migration completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});