import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalOfferClick() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-offer-label]") as HTMLElement | null;
      if (!el) return;

      const q = el.getAttribute("data-offer-label") || "";
      if (!q.trim()) return;

      e.preventDefault();
      e.stopPropagation();

      // Store in DOM and sessionStorage for potential recovery
      try { sessionStorage.setItem("offer:label", q); } catch {}
      document.body.setAttribute("data-offer-label", q);

      // Navigate to offrir with the exact idea label
      navigate(`/offrir/cadeau?q=${encodeURIComponent(q)}`);
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true } as any);
    };
  }, [navigate]);

  return null;
}