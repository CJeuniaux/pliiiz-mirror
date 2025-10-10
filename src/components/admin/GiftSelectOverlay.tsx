import { useEffect, useState } from "react";
import { useAdminMode } from "@/contexts/AdminModeContext";

export type GiftRef = { 
  giftIdeaId?: number | null;
  title?: string | null;
  category?: string | null;
  occasion?: string | null;
};

interface GiftSelectOverlayProps {
  gift: GiftRef;
}

export function GiftSelectOverlay({ gift }: GiftSelectOverlayProps) {
  const { adminModeOn, isAdmin } = useAdminMode();
  const [multiMode, setMultiMode] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const toggleMulti = () => setMultiMode(m => !m);
    document.addEventListener("pliiiz-toggle-multi", toggleMulti as any);
    return () => document.removeEventListener("pliiiz-toggle-multi", toggleMulti as any);
  }, []);

  if (!adminModeOn || !isAdmin || !multiMode) return null;

  return (
    <label className="gift-select-overlay">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          document.dispatchEvent(
            new CustomEvent("pliiiz-multi-select", {
              detail: { gift, add: e.target.checked }
            })
          );
        }}
      />
      <span />
    </label>
  );
}
