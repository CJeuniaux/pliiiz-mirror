import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathname = url.pathname;

    // POST /design-feedback - Submit feedback
    if (req.method === 'POST' && pathname.endsWith('/design-feedback')) {
      const { choice, comment } = await req.json();

      // Validate input
      if (!choice || !['LOVE', 'MIXED', 'DISLIKE'].includes(choice)) {
        return new Response(
          JSON.stringify({ error: 'Invalid choice' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (comment && comment.length > 300) {
        return new Response(
          JSON.stringify({ error: 'Comment too long' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user info
      const authHeader = req.headers.get('Authorization');
      let userId = null;
      
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      }

      // Generate session ID for anonymous users
      const sessionId = crypto.randomUUID();
      
      // Get client metadata
      const userAgent = req.headers.get('user-agent') || '';
      const clientMeta = {
        userAgent,
        timestamp: new Date().toISOString(),
      };

      // Insert feedback
      const { error } = await supabase
        .from('design_feedback')
        .insert({
          user_id: userId,
          session_id: sessionId,
          choice,
          comment: comment || null,
          client_meta: clientMeta,
        });

      if (error) {
        console.error('Error inserting feedback:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save feedback' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /design-feedback/stats - Get aggregated stats (admin only)
    if (req.method === 'GET' && pathname.includes('/stats')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('global_preferences')
        .eq('user_id', user.id)
        .single();

      const isAdmin = profile?.global_preferences?.role === 'admin' || 
                     profile?.global_preferences?.is_admin === 'true';

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get stats
      const { data: stats, error } = await supabase
        .from('design_feedback')
        .select('choice');

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch stats' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const total = stats.length;
      const love = stats.filter(s => s.choice === 'LOVE').length;
      const mixed = stats.filter(s => s.choice === 'MIXED').length;
      const dislike = stats.filter(s => s.choice === 'DISLIKE').length;

      return new Response(
        JSON.stringify({
          total,
          love,
          mixed,
          dislike,
          percentages: {
            love: total > 0 ? Math.round((love / total) * 100) : 0,
            mixed: total > 0 ? Math.round((mixed / total) * 100) : 0,
            dislike: total > 0 ? Math.round((dislike / total) * 100) : 0,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /design-feedback/list - Get feedback list (admin only)
    if (req.method === 'GET' && pathname.includes('/list')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('global_preferences')
        .eq('user_id', user.id)
        .single();

      const isAdmin = profile?.global_preferences?.role === 'admin' || 
                     profile?.global_preferences?.is_admin === 'true';

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get feedback list
      const { data: feedbackList, error } = await supabase
        .from('design_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch feedback list' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data: feedbackList }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});