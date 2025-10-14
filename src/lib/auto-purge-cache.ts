// Auto-purge cache script - will run once when loaded
import { supabase } from '@/integrations/supabase/client';

async function purgeImageCache() {
  console.log('🧹 Starting automatic cache purge...');
  
  try {
    const { data, error } = await supabase.functions.invoke('images-purge-cache', {
      body: {}
    });

    if (error) {
      console.error('❌ Cache purge failed:', error);
      return;
    }

    console.log('✅ Cache purge completed:', data);
    
    // Reload the page after purge to refresh all components
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Cache purge error:', error);
  }
}

// Auto-run the purge
purgeImageCache();