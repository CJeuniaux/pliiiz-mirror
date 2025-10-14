import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftIdea {
  label: string;
  category?: string;
  canonical?: {
    categoryId?: string;
    path?: string[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[populate-gift-images] Starting population...");

    // 1. Récupérer toutes les gift ideas des profils
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, global_preferences")
      .not("global_preferences->giftIdeas", "is", null);

    if (profilesError) throw profilesError;

    console.log(`[populate-gift-images] Found ${profiles?.length || 0} profiles with gift ideas`);

    const allGiftIdeas = new Map<string, { text: string; category?: string }>();

    // 2. Extraire toutes les gift ideas uniques
    for (const profile of profiles || []) {
      const giftIdeas = profile.global_preferences?.giftIdeas || [];
      
      for (const idea of giftIdeas) {
        let giftText: string;
        let category: string | undefined;

        if (typeof idea === "string") {
          giftText = idea;
        } else {
          giftText = idea.label || "";
          category = idea.category || idea.canonical?.categoryId;
        }

        if (giftText && !allGiftIdeas.has(giftText.toLowerCase())) {
          allGiftIdeas.set(giftText.toLowerCase(), { text: giftText, category });
        }
      }
    }

    console.log(`[populate-gift-images] Found ${allGiftIdeas.size} unique gift ideas`);

    // 3. Insérer dans gift_idea_unsplash (sans image pour l'instant)
    const insertions = [];
    for (const [, giftData] of allGiftIdeas) {
      const { data: hashData } = await supabase.rpc("stable_gift_idea_hash", {
        idea_text: giftData.text,
        category: giftData.category || null,
        occasion: null,
      });

      insertions.push({
        gift_idea_text: giftData.text,
        gift_idea_hash: hashData,
        category: giftData.category || null,
        generator_version: "v2",
        image_status: "pending",
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("gift_idea_unsplash")
      .upsert(insertions, {
        onConflict: "gift_idea_hash",
        ignoreDuplicates: true,
      })
      .select("id");

    if (insertError) {
      console.error("[populate-gift-images] Insert error:", insertError);
      throw insertError;
    }

    console.log(`[populate-gift-images] Inserted ${inserted?.length || 0} new entries`);

    // 4. Appeler regenerate-gift-images pour générer les images avec OpenAI
    const { data: rebuildData, error: rebuildError } = await supabase.functions.invoke(
      "regenerate-gift-images",
      {
        body: { action: "start_regeneration", force_regen: true },
      }
    );

    if (rebuildError) {
      console.error("[populate-gift-images] Rebuild error:", rebuildError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_ideas: allGiftIdeas.size,
        inserted: inserted?.length || 0,
        rebuild_triggered: !rebuildError,
        rebuild_result: rebuildData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[populate-gift-images] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
