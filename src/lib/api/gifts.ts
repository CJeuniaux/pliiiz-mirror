import { supabase } from '@/integrations/supabase/client';

export async function fetchGiftsWithMedia() {
  const { data, error } = await supabase
    .from('vw_gift_with_media')
    .select('*')
    .order('accuracy_score', { ascending: false });
  return { data, error };
}

export async function rescoreAllGifts() {
  return supabase.rpc('fn_rescore_all_gifts');
}

export async function rescoreOneGift(giftId: string) {
  return supabase.rpc('fn_pick_canonical_media', { p_gift_id: giftId });
}
