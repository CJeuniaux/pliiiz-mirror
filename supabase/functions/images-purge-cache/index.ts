import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const BUCKET = 'ai-previews';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting image cache purge...');

    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list('');

    if (listError) {
      console.error('Error listing files:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found to delete');
      return json({ 
        success: true, 
        message: 'Cache was already empty',
        deletedCount: 0 
      });
    }

    console.log(`Found ${files.length} files to delete`);

    // Delete all files except the placeholder
    const filesToDelete = files
      .filter(file => file.name !== 'placeholder.png')
      .map(file => file.name);

    if (filesToDelete.length === 0) {
      console.log('Only placeholder found, nothing to delete');
      return json({ 
        success: true, 
        message: 'Cache was already empty (only placeholder exists)',
        deletedCount: 0 
      });
    }

    console.log(`Deleting ${filesToDelete.length} cached images...`);

    // Delete files in batches to avoid timeout
    const batchSize = 50;
    let totalDeleted = 0;
    
    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove(batch);

      if (deleteError) {
        console.error('Error deleting batch:', deleteError);
        throw deleteError;
      }

      totalDeleted += batch.length;
      console.log(`Deleted batch: ${batch.length} files (total: ${totalDeleted})`);
    }

    console.log(`Successfully purged ${totalDeleted} cached images`);

    return json({
      success: true,
      message: `Successfully purged ${totalDeleted} cached images`,
      deletedCount: totalDeleted
    });

  } catch (error: any) {
    console.error('Cache purge failed:', error);
    
    return json({
      success: false,
      error: error.message
    }, 500);
  }
});

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json' 
    }
  });
}