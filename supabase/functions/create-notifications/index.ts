import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  targetUserId: string;
  type: string;
  actorUserId?: string;
  payload?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { targetUserId, type, actorUserId, payload }: NotificationRequest = await req.json();

    // Get actor name if provided
    let actorName = "Un utilisateur";
    if (actorUserId) {
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", actorUserId)
        .single();
      
      if (actorProfile) {
        actorName = `${actorProfile.first_name} ${actorProfile.last_name}`.trim();
      }
    }

    // Generate message based on type
    let message = "";
    switch (type) {
      case 'preferences_updated':
        message = `${actorName} a mis à jour ses préférences`;
        break;
      case 'request_accepted':
        message = `${actorName} a accepté votre demande de consultation`;
        break;
      case 'request_received':
        message = `${actorName} souhaite consulter votre profil`;
        break;
      default:
        message = "Nouvelle notification";
    }

    // Create notification
    const { data, error } = await supabase.rpc('create_notification', {
      target_user_id: targetUserId,
      notification_type: type,
      notification_message: message,
      actor_id: actorUserId || null,
      notification_payload: payload || {}
    });

    if (error) {
      console.error("Error creating notification:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, notificationId: data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);