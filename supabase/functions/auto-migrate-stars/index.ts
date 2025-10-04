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

    console.log('🚀 Démarrage de la migration automatique des star levels...');

    // Fonction pour appliquer le soft backfill sur un array d'objets préférences
    const applySoftBackfill = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => {
        if (typeof item === 'string') {
          // Legacy string format -> convert to object with level 2 et freeText true
          return { label: item, level: 2, freeText: true };
        } else if (typeof item === 'object' && item !== null) {
          // Object format -> set level = 2 if missing, mark as freeText if no level was set
          const hadLevel = item.level !== undefined && item.level !== null;
          return { 
            ...item, 
            level: item.level ?? 2,
            freeText: hadLevel ? item.freeText : true // Si pas de level défini, c'est du freeText
          };
        }
        return { label: String(item), level: 2, freeText: true };
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

    // Récupérer tous les profils
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, global_preferences, occasion_prefs');

    if (fetchError) {
      throw new Error(`Impossible de récupérer les profils: ${fetchError.message}`);
    }

    console.log(`📊 ${profiles.length} profils trouvés`);

    let updatedCount = 0;
    let processedCount = 0;
    const batchSize = 10; // Plus petit batch pour éviter les timeouts

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      for (const profile of batch) {
        const originalGlobal = profile.global_preferences || {};
        const originalOccasion = profile.occasion_prefs || {};

        const processedGlobal = processGlobalPreferences(originalGlobal);
        const processedOccasion = processOccasionPreferences(originalOccasion);

        // Vérifier s'il y a des changements
        const globalChanged = JSON.stringify(originalGlobal) !== JSON.stringify(processedGlobal);
        const occasionChanged = JSON.stringify(originalOccasion) !== JSON.stringify(processedOccasion);

        if (globalChanged || occasionChanged) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              global_preferences: processedGlobal,
              occasion_prefs: processedOccasion,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', profile.user_id);

          if (updateError) {
            console.error(`❌ Échec mise à jour profil ${profile.user_id}:`, updateError.message);
          } else {
            updatedCount++;
            console.log(`✅ Profil ${profile.user_id} mis à jour`);
          }
        }
        
        processedCount++;
      }

      console.log(`📈 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profiles.length / batchSize)} traité`);
    }

    console.log(`🎉 Migration terminée! ${updatedCount} profils mis à jour sur ${processedCount} traités`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedCount,
        processedCount,
        totalProfiles: profiles.length,
        message: `Migration automatique terminée: ${updatedCount} profils mis à jour avec des niveaux par défaut de 2★ et freeText=true pour les contenus existants`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Erreur de migration:', error);
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