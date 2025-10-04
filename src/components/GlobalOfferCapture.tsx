import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalOfferCapture() {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement)?.closest?.("button,a");
      if (!btn) return;

      const isOffer = /offrir ?ça|offrir ?ca/i.test(btn.textContent || "");
      const hasData = (btn as HTMLElement).hasAttribute("data-offer-label");
      
      console.log('GlobalOfferCapture: clicked button', {
        text: btn.textContent,
        isOffer,
        hasData,
        dataLabel: (btn as HTMLElement).getAttribute("data-offer-label")
      });
      
      if (!isOffer && !hasData) return;

      // 1) libellé prioritaire: data-offer-label
      let label =
        (btn as HTMLElement).getAttribute("data-offer-label")?.trim() || "";

      // 2) si absent → remonte au conteneur de la carte et récupère le titre "giftIdeas"
      if (!label) {
        const card =
          (btn as HTMLElement).closest("[data-gift-label]") ||
          (btn as HTMLElement).closest("article, .gift-card, .card");
        label =
          card?.getAttribute?.("data-gift-label")?.trim() ||
          card?.querySelector?.("[data-gift-label]")?.getAttribute?.("data-gift-label")?.trim() ||
          card?.querySelector?.(".gift-title, [data-title], h3, .title")?.textContent?.trim() ||
          "";
      }

      label = label.replace(/\s+/g, " ").trim();
      console.log('GlobalOfferCapture: extracted label', label);
      
      if (!label) return; // rien à faire

      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();

      // mémo béton (3 sources)
      document.body.setAttribute("data-offer-label", label);
      try { localStorage.setItem("pliiiz:offerLabel", label); } catch {}

      console.log('GlobalOfferCapture: navigating to', `/offrir/cadeau?q=${encodeURIComponent(label)}`);
      navigate(`/offrir/cadeau?q=${encodeURIComponent(label)}`);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as any);
  }, [navigate]);

  return null;
}