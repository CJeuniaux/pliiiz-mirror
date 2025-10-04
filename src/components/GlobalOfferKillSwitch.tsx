import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function slug(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function GlobalOfferKillSwitch({ defaultNear = "" }: { defaultNear?: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const OFFER_TEXT = /offrir ?ca|offrir ça/i;
    const MAPS_RE = /google\.com\/maps|maps\.app\.goo\.gl/i;

    const resolveType = (el: Element): string =>
      (el as HTMLElement).getAttribute("data-offrir-type")
      || (el.closest?.("[data-offrir-type]") as HTMLElement)?.getAttribute("data-offrir-type")
      || "cadeau";

    const resolveNear = (el: Element): string =>
      (el as HTMLElement).getAttribute("data-offrir-near")
      || (el.closest?.("[data-offrir-near]") as HTMLElement)?.getAttribute("data-offrir-near")
      || document.body.getAttribute("data-user-city")
      || defaultNear;

    const toInternalUrl = (el: Element) => {
      const type = slug(resolveType(el));
      const near = resolveNear(el);
      const qs = new URLSearchParams();
      if (near) qs.set("near", near);
      return `/offrir/${type}${qs.toString() ? `?${qs.toString()}` : ""}`;
    };

    // 1) Interception des clics AVANT les autres handlers
    const onClickCapture = (e: MouseEvent) => {
      // Bypass du kill-switch si on est sur un écran /offrir
      const allow = document.body.getAttribute("data-allow-maps") === "1";
      if (allow) return;
      const target = e.target as HTMLElement;
      const el = target?.closest?.("a,button") as HTMLElement | null;
      if (!el) return;

      const label = (el.textContent || "").trim();
      const href = (el as HTMLAnchorElement).href || "";

      const isOfferBtn = OFFER_TEXT.test(label) || el.hasAttribute("data-offrir-type");
      const isMapsLink = MAPS_RE.test(href);

      if (!isOfferBtn && !isMapsLink) return;

      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();

      navigate(toInternalUrl(el));
    };

    document.addEventListener("click", onClickCapture, { capture: true });

    // 2) Réécrit *à la volée* les liens Maps qui apparaissent après coup
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of Array.from(m.addedNodes)) {
          if (!(n instanceof HTMLElement)) continue;
          n.querySelectorAll?.('a[href*="google.com/maps"],a[href*="maps.app.goo.gl"]').forEach((a: HTMLAnchorElement) => {
            a.removeAttribute("target");
            a.setAttribute("data-offrir-type", "cadeau");
            a.href = toInternalUrl(a);
          });
        }
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // 3) Monkey-patch window.open pour bloquer toute ouverture Maps résiduelle
    const realOpen = window.open;
    (window as any).open = function (url?: string | URL, target?: string, feats?: string) {
      // Bypass du kill-switch si on est sur un écran /offrir
      const allow = document.body.getAttribute("data-allow-maps") === "1";
      if (allow) {
        return realOpen.apply(window, arguments as any);
      }
      
      try {
        const s = typeof url === "string" ? url : String(url);
        if (MAPS_RE.test(s)) {
          const near = document.body.getAttribute("data-user-city") || defaultNear;
          const qs = near ? `?near=${encodeURIComponent(near)}` : "";
          navigate(`/offrir/cadeau${qs}`);
          return null;
        }
      } catch {}
      return realOpen.apply(window, arguments as any);
    };

    return () => {
      document.removeEventListener("click", onClickCapture, { capture: true } as any);
      mo.disconnect();
      (window as any).open = realOpen;
    };
  }, [navigate, defaultNear]);

  return null;
}