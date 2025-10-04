import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
};

interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  city?: string;
  country?: string;
  birthday?: string;
}

interface SignupResponse {
  user_id: string;
  first_name: string;
  email: string;
  needs_confirmation: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get idempotency key from headers
    const idempotencyKey = req.headers.get('idempotency-key');
    
    if (!idempotencyKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing idempotency-key header' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if request already processed (idempotency)
    const { data: existingRequest } = await supabase
      .from('request_log')
      .select('response')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingRequest) {
      console.log(`[Signup V2] Returning cached response for key: ${idempotencyKey}`);
      return new Response(JSON.stringify(existingRequest.response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body: SignupRequest = await req.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.first_name) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: email, password, first_name' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize signup data using our helper function
    const { data: normalizedData } = await supabase
      .rpc('normalize_signup_data', {
        p_email: body.email,
        p_first_name: body.first_name,
        p_last_name: body.last_name,
        p_city: body.city,
        p_country: body.country
      });

    console.log(`[Signup V2] Processing signup for: ${normalizedData.email}`);

    // Start transaction-like operations
    try {
      // 1. Create user with Supabase Auth
      const redirectUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedData.email,
        password: body.password,
        email_confirm: false, // We'll handle confirmation manually
        user_metadata: {
          first_name: normalizedData.first_name,
          last_name: normalizedData.last_name,
          birthday: body.birthday,
          city: normalizedData.city,
          country: normalizedData.country
        }
      });

      if (authError) {
        console.error('[Signup V2] Auth error:', authError);
        
        // Handle duplicate email error specifically
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          return new Response(JSON.stringify({ 
            error: 'Email already used',
            code: 'EMAIL_ALREADY_EXISTS'
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        throw authError;
      }

      const user = authData.user;
      if (!user) {
        throw new Error('User creation failed - no user returned');
      }

      // 2. Ensure profile exists with our safe function
      const { error: profileError } = await supabase
        .rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: {
            first_name: normalizedData.first_name,
            last_name: normalizedData.last_name,
            email: normalizedData.email,
            birthday: body.birthday,
            city: normalizedData.city,
            country: normalizedData.country,
            regift_enabled: false,
            global_preferences: {
              avoid: [],
              likes: [],
              sizes: {},
              allergies: [],
              giftIdeas: []
            }
          }
        });

      if (profileError) {
        console.error('[Signup V2] Profile creation error:', profileError);
        throw profileError;
      }

      // 3. Ensure preferences exist
      const { error: prefsError } = await supabase
        .rpc('safe_upsert_preferences', {
          p_user_id: user.id,
          p_updates: {
            likes: [],
            dislikes: [],
            allergies: [],
            current_wants: [],
            gift_ideas: [],
            sizes: {}
          }
        });

      if (prefsError) {
        console.error('[Signup V2] Preferences creation error:', prefsError);
        throw prefsError;
      }

      // 4. Trigger replication to public profiles
      const { error: outboxError } = await supabase
        .from('replication_outbox')
        .insert({
          user_id: user.id,
          event_type: 'UPSERT_PROFILE',
          source_version: 1,
          payload: { user_id: user.id, operation: 'signup' },
          idempotency_key: `signup_${user.id}_${Date.now()}`
        });

      if (outboxError) {
        console.error('[Signup V2] Outbox error:', outboxError);
        // Don't fail the signup for outbox errors
      }

      // Prepare response
      const response: SignupResponse = {
        user_id: user.id,
        first_name: normalizedData.first_name,
        email: normalizedData.email,
        needs_confirmation: !user.email_confirmed_at
      };

      // Log the successful response with idempotency
      await supabase
        .from('request_log')
        .insert({
          idempotency_key: idempotencyKey,
          response: response
        });

      console.log(`[Signup V2] Success for user: ${user.id}, email: ${normalizedData.email}`);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('[Signup V2] Transaction error:', error);
      
      // Log the error response with idempotency to prevent retries
      const errorResponse = {
        error: error.message || 'Internal server error',
        code: 'SIGNUP_FAILED'
      };

      await supabase
        .from('request_log')
        .insert({
          idempotency_key: idempotencyKey,
          response: errorResponse
        });

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('[Signup V2] General error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});