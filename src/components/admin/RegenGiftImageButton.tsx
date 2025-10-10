import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { useToast } from "@/hooks/use-toast";

interface RegenGiftImageButtonProps {
  giftIdeaId?: number;
  giftName?: string;
  canonical?: string; // Le vrai nom de l'idée cadeau stocké en base
}

export function RegenGiftImageButton({ giftIdeaId, giftName, canonical }: RegenGiftImageButtonProps) {
  const { adminModeOn, isAdmin } = useAdminMode();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const canTrigger = isAdmin && (!!giftIdeaId || !!giftName);

  if (!adminModeOn) return null;

  const handleRegen = async () => {
    if (!isAdmin) {
      toast({
        title: "Accès requis",
        description: "Droits admin nécessaires pour régénérer.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      setStatus('idle');

      // Utilise la nouvelle RPC de debug avec résolution complète + log
      // Priorité: canonical (vrai nom en base) > giftName (affiché)
      const titleToSearch = canonical || giftName;
      
      console.log('[RegenButton] Calling dbg2 with:', {
        giftIdeaId,
        giftName,
        canonical,
        titleToSearch
      });

      const { data, error } = await supabase.rpc('request_gift_image_regen_resolve_dbg2', {
        p_suggestion_id: giftIdeaId?.toString() ?? null,
        p_owner_id: null,
        p_gift_id: null,
        p_title: titleToSearch ?? null,
        p_category: canonical ?? null,
        p_occasion: null,
        p_reason: 'manual-admin'
      });

      if (error) {
        console.error('RPC error:', error);
        setStatus('error');
        toast({
          title: "❌ Erreur RPC",
          description: error.message,
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      console.log('[RegenButton] dbg2 response:', data);

      const response = data as {
        ok: boolean;
        resolved_id?: number;
        method?: string;
        hash?: string;
        candidates?: Array<{ id: number; text: string; src: string; version: string }>;
        error?: string;
        payload?: Record<string, unknown>;
      };

      if (!response?.ok) {
        setStatus('error');
        
        // Diagnostic avec candidats
        const candidates = response?.candidates || [];
        const candText = candidates
          .slice(0, 3)
          .map(c => `${c.text} (${c.src}/${c.version})`)
          .join(' · ');
        
        const errorMsg = response?.error === 'forbidden:not_admin'
          ? 'Droits admin requis'
          : `Référence introuvable (hash: ${response.hash?.substring(0, 8)}). Candidats (${candidates.length}): ${candText || 'aucun'}`;
        
        toast({
          title: "❌ Résolution échouée",
          description: errorMsg,
          variant: "destructive",
          duration: 8000,
        });

        console.warn('Candidats:', candidates);
        console.warn('Payload:', response.payload);
        return;
      }

      setStatus('success');
      toast({
        title: "✅ Queued",
        description: `Méthode: ${response.method} · ID: ${response.resolved_id}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error requesting gift image regeneration:', error);
      setStatus('error');
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible de lancer la régénération",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <button 
      className="admin-regen-overlay" 
      onClick={handleRegen} 
      disabled={loading}
      title={loading ? "Régénération en cours..." : "Régénérer l'image"}
    >
      {loading ? "⏳" : status === 'success' ? "✅" : status === 'error' ? "❌" : "🔄"}
    </button>
  );
}
