import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { OfferGiftsScreenV2 } from "@/components/screens/offer-gifts-screen-v2";
import { usePublicProfileEnhanced } from "@/hooks/use-public-profile-enhanced";

export default function FindGift() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const item = searchParams.get("item") || "";

  const { profile, loading, error } = usePublicProfileEnhanced(userId!);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (error || !profile) return <div className="p-6">Erreur de chargement.</div>;

  const firstName = profile.display_name?.split(" ")[0] || "";

  return (
    <OfferGiftsScreenV2
      contactName={firstName}
      onBack={() => navigate(-1)}
    />
  );
}
