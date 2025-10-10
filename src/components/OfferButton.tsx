import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

const slug = (s: string) => s
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface OfferButtonProps {
  ideaLabel: string;
  type?: string;
  near?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  // Target person data for avatar display
  targetId?: string;
  targetName?: string;
  targetAvatar?: string;
}

export function OfferButton({
  ideaLabel,
  type = "cadeau",
  near,
  className = "",
  variant = "default",
  size = "default",
  targetId,
  targetName,
  targetAvatar
}: OfferButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const qs = new URLSearchParams();
    qs.set("q", ideaLabel); // Pass the exact idea label
    if (near) qs.set("near", near);
    
    // Add target person data to query params
    if (targetId) qs.set("targetId", targetId);
    if (targetName) qs.set("targetName", targetName);
    if (targetAvatar) qs.set("targetAvatar", targetAvatar);

    // Safety mechanism for potential router query loss
    try {
      sessionStorage.setItem("offer:label", ideaLabel);
      if (near) sessionStorage.setItem("offer:near", near);
      // Store target data in localStorage
      if (targetId || targetName || targetAvatar) {
        const targetData = { targetId, targetName, targetAvatar };
        sessionStorage.setItem("pliiiz:offerTarget", JSON.stringify(targetData));
      }
    } catch {}
    
    document.body.setAttribute("data-offer-label", ideaLabel);
    if (targetId) document.body.setAttribute("data-target-id", targetId);
    if (targetName) document.body.setAttribute("data-target-name", targetName);
    if (targetAvatar) document.body.setAttribute("data-target-avatar", targetAvatar);

    const href = `/offrir/${slug(type)}?${qs.toString()}`;
    navigate(href);
  };

  return (
    <Button
      type="button"
      className={className}
      variant={variant}
      size={size}
      onClick={handleClick}
      data-offer-label={ideaLabel} // DOM safety net
    >
      <Gift className="h-4 w-4 mr-2" />
      Offrir ça
    </Button>
  );
}