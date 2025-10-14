import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REQUIRED_SECRET = Deno.env.get("ADMIN_RESYNC_SECRET");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

type Body =
  | { mode: "all" }
  | { mode: "pair"; from_id: string; to_id: string; a_to_b?: boolean; b_to_a?: boolean };

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!REQUIRED_SECRET || req.headers.get("x-admin-secret") !== REQUIRED_SECRET) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    
    if (body?.mode === "pair" && body.from_id && body.to_id) {
      const a2b = body.a_to_b !== false; // default true
      const b2a = body.b_to_a !== false; // default true
      
      const { error } = await supabase.rpc("resync_contact_pair", {
        from_id: body.from_id,
        to_id: body.to_id,
        create_a_to_b: a2b,
        create_b_to_a: b2a
      } as any);
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ ok: true, mode: "pair" }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // fallback / défaut : mode 'all'
    await supabase.rpc("resync_all_contacts");
    
    return new Response(
      JSON.stringify({ ok: true, mode: "all" }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error("Error in admin-resync-contacts:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
