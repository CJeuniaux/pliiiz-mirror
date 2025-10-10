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

      // Récupérer infos target si dispo sur la page (profil)
      const targetId = document.body.getAttribute("data-target-id") || undefined;
      const targetName = document.body.getAttribute("data-target-name") || undefined;
      const targetAvatar = document.body.getAttribute("data-target-avatar") || undefined;

      try {
        localStorage.setItem("pliiiz:offerLabel", label);
        if (targetId || targetName || targetAvatar) {
          const targetData = { targetId, targetName, targetAvatar };
          sessionStorage.setItem("pliiiz:offerTarget", JSON.stringify(targetData));
        }
      } catch {}

      const params = new URLSearchParams({ q: label });
      if (targetId) params.set("targetId", targetId);
      if (targetName) params.set("targetName", targetName);
      if (targetAvatar) params.set("targetAvatar", targetAvatar);

      const href = `/offrir/cadeau?${params.toString()}`;
      console.log('GlobalOfferCapture: navigating to', href);
      navigate(href);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as any);
  }, [navigate]);

  return null;
}