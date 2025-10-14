import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface RegenAvatarButtonProps {
  userId: string;
  compact?: boolean;
}

export function RegenAvatarButton({ userId, compact = false }: RegenAvatarButtonProps) {
  const { adminModeOn, isAdmin } = useAdminMode();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!adminModeOn || !isAdmin) return null;

  const handleRegen = async () => {
    try {
      setLoading(true);
      setStatus('idle');

      // Utilise la nouvelle edge function regenerate-images
      const { data, error } = await supabase.functions.invoke('regenerate-images', {
        body: { profile_id: userId }
      });

      if (error) throw error;

      console.log("Avatar regen completed:", data);
      setStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error("Error regenerating avatar:", error);
      setStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleRegen}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="w-3 h-3 text-green-500" />
        ) : status === 'error' ? (
          <XCircle className="w-3 h-3 text-red-500" />
        ) : (
          <RefreshCw className="w-3 h-3" />
        )}
        {loading ? "Régénération..." : "Régénérer l'image"}
      </Button>
    );
  }

  return (
    <div className="admin-bubble">
      <Button
        onClick={handleRegen}
        disabled={loading}
        className="admin-btn"
        size="sm"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Régénération...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Régénérer l'image
          </>
        )}
      </Button>
      
      {status === 'success' && (
        <div className="admin-status admin-ok">
          <CheckCircle className="w-4 h-4" />
          <span>✅ Queued</span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="admin-status admin-ko">
          <XCircle className="w-4 h-4" />
          <span>❌ Erreur</span>
        </div>
      )}
      
      <div className="admin-hint">
        Mode admin ON — Shift+R pour cacher
      </div>
    </div>
  );
}
