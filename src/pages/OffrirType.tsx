import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, useOutletContext } from "react-router-dom";
import { fetchPoisOverpass, resolveTypeFromIdea, type Poi } from "@/lib/poi-overpass";
import { getProfileZoneLabelStrict } from "@/lib/user-geo";
import { useEnhancedBackNavigation } from "@/hooks/use-enhanced-back-navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/ui/app-header";
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
import { Card, CardContent } from "@/components/ui/card";
import OffrirSetupCard from "@/components/offrir/OffrirSetupCard";
import { TargetAvatar } from "@/components/ui/target-avatar";
import { useAuth } from "@/hooks/use-auth";
import { RegiftModal } from "@/components/modals/regift-modal";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface OutletContext {
  setBackHandler: (handler: (() => void) | undefined) => void;
}

export default function OffrirType() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setBackHandler } = useOutletContext<OutletContext>();

  // Profile source data for "Retour profil" header
  const fromProfileName = searchParams.get("fromProfileName");
  const fromProfileId = searchParams.get("fromProfileId");
  const [sourceProfileName, setSourceProfileName] = useState<string | null>(fromProfileName);
  const [loadingSourceProfile, setLoadingSourceProfile] = useState(false);

  // 1) Libellé d'idée reçu depuis le bouton (query ?q=…)
  const ideaFromQuery = useMemo(() => {
    const q = searchParams.get("q")?.trim();
    if (q) return q;
    if (typeof document !== "undefined") {
      const b = document.body.getAttribute("data-offer-label");
      if (b) return b;
    }
    try {
      const ls = localStorage.getItem("pliiiz:offerLabel");
      if (ls) return ls;
    } catch {}
    return ""; // surtout pas "Cadeaux"
  }, [searchParams]);
  
  // Target person data retrieval
  const targetData = useMemo(() => {
    // Try query params first
    const targetId = searchParams.get("targetId");
    const targetName = searchParams.get("targetName");
    const targetAvatar = searchParams.get("targetAvatar");
    
    if (targetId || targetName || targetAvatar) {
      return { targetId, targetName, targetAvatar };
    }
    
    // Try sessionStorage fallback
    try {
      const cached = sessionStorage.getItem("pliiiz:offerTarget");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    
    // Try data attributes fallback
    if (typeof document !== "undefined") {
      const targetId = document.body.getAttribute("data-target-id");
      const targetName = document.body.getAttribute("data-target-name");
      const targetAvatar = document.body.getAttribute("data-target-avatar");
      
      if (targetId || targetName || targetAvatar) {
        return { targetId, targetName, targetAvatar };
      }
    }
    
    return { targetId: null, targetName: null, targetAvatar: null };
  }, [searchParams]);
  
  const brand = searchParams.get("brand") || "";

  // 🔒 zone profil strict
  const [initialZone, setInitialZone] = useState<string>();
  useEffect(() => { getProfileZoneLabelStrict().then(setInitialZone); }, []);

  // État du wizard
  type Step = "setup" | "results";
  const [step, setStep] = useState<Step>("setup");
  const [center, setCenter] = useState<{lat:number; lng:number; label?:string} | null>(null);
  const [ideaLabel, setIdeaLabel] = useState<string>(ideaFromQuery);

  // État regift
  const [showRegiftModal, setShowRegiftModal] = useState(false);
  const [targetRegiftEnabled, setTargetRegiftEnabled] = useState(false);
  // Flag pour éviter les réouvertures multiples
  const hasShownRegiftRef = useRef(false);
  // Alias lisible pour debug
  const isRegiftModalOpen = showRegiftModal;

  // Ouvrir dès qu'on passe en "results" si déjà éligible
  useEffect(() => {
    if (step === "results" && targetRegiftEnabled && !hasShownRegiftRef.current) {
      setShowRegiftModal(true);
      hasShownRegiftRef.current = true;
    }
  }, [step, targetRegiftEnabled]);

  // Réinitialiser le flag quand on revient en setup
  useEffect(() => {
    if (step === "setup") {
      hasShownRegiftRef.current = false;
    }
  }, [step]);

  // Charger les infos de regift du profil target
  useEffect(() => {
    const loadTargetRegiftInfo = async () => {
      console.log('[OffrirType] Checking regift - targetId:', targetData.targetId, 'step:', step);
      
      if (!targetData.targetId) {
        console.log('[OffrirType] No targetId, skipping regift check');
        return;
      }
      
      try {
        console.log('[OffrirType] Fetching regift info for user:', targetData.targetId);
        const { data, error } = await supabase
          .from('profiles')
          .select('regift_enabled, first_name')
          .eq('user_id', targetData.targetId)
          .maybeSingle();
        
        console.log('[OffrirType] Regift query result:', { data, error });
        
        if (!error && data) {
          const isRegiftEnabled = data.regift_enabled === true;
          console.log('[OffrirType] Regift enabled:', isRegiftEnabled);
          setTargetRegiftEnabled(isRegiftEnabled);
          
          // Afficher le modal si regift activé
          if (isRegiftEnabled && step === "results" && !hasShownRegiftRef.current) {
            console.log('[OffrirType] Showing regift modal');
            setShowRegiftModal(true);
            hasShownRegiftRef.current = true;
          }
        } else if (error) {
          console.error('[OffrirType] Error fetching regift info:', error);
        }
      } catch (err) {
        console.error('[OffrirType] Exception lors du chargement des infos regift:', err);
      }
    };

    loadTargetRegiftInfo();
  }, [targetData.targetId, step]);

  // synchronise l'input du formulaire
  useEffect(() => { setIdeaLabel(ideaFromQuery); }, [ideaFromQuery]);

  // Load source profile name if only ID is provided
  useEffect(() => {
    if (!fromProfileName && fromProfileId && !loadingSourceProfile) {
      setLoadingSourceProfile(true);
      // Load profile name from API
      fetch(`https://afyxwaprjecyormhnncl.supabase.co/rest/v1/profiles?user_id=eq.${fromProfileId}&select=first_name,last_name`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmeXh3YXByamVjeW9ybWhubmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTk4MzEsImV4cCI6MjA3MjM5NTgzMX0.ajC-iZbb3xxZk5xfgh3QtG-DQxT5TEr_0QE_ChGRq7k',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmeXh3YXByamVjeW9ybWhubmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTk4MzEsImV4cCI6MjA3MjM5NTgzMX0.ajC-iZbb3xxZk5xfgh3QtG-DQxT5TEr_0QE_ChGRq7k`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          const profile = data[0];
          const displayName = `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`.trim();
          setSourceProfileName(displayName || 'Profil invité');
        } else {
          setSourceProfileName('Profil invité');
        }
      })
      .catch(() => setSourceProfileName('Profil invité'))
      .finally(() => setLoadingSourceProfile(false));
    }
  }, [fromProfileName, fromProfileId, loadingSourceProfile]);

  // Bypass kill-switch uniquement sur l'écran "results"
  useEffect(() => {
    document.body.setAttribute("data-allow-maps", step === "results" ? "1" : "0");
    return () => document.body.removeAttribute("data-allow-maps");
  }, [step]);

  // --- Map refs ---
  const mapRef = useRef<L.Map|null>(null);
  const layerRef = useRef<L.LayerGroup|null>(null);
  const mapEl = useRef<HTMLDivElement>(null);

  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRadius, setCurrentRadius] = useState(3000);
  const [searchAttempts, setSearchAttempts] = useState(0);

  // Étape 2 : init carte quand on a un centre confirmé
  useEffect(() => {
    if (step !== "results" || !center || !mapEl.current || mapRef.current) return;
    console.log('[OffrirType] Initializing map with center:', center);
    console.log('geo:', center.lat, center.lng); // Debug log as requested
    const map = L.map(mapEl.current, { center:[center.lat, center.lng], zoom: 13 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
      attribution:"&copy; OpenStreetMap", 
      maxZoom: 19 
    }).addTo(map);
    L.circleMarker([center.lat, center.lng], { 
      radius:7, 
      color:"#10b981", 
      fillColor:"#10b981", 
      fillOpacity:.9 
    }).addTo(map);
    mapRef.current = map;
    console.log('[OffrirType] Map initialized and centered at:', center.lat, center.lng);
  }, [step, center]);

  // Charger POI avec élargissement automatique si peu de résultats
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (step !== "results" || !center || !mapRef.current) return;
      setLoading(true);
      setSearchAttempts(0);
      
      const typeKey = resolveTypeFromIdea(ideaLabel, type || "cadeau");
      let radius = 3000;
      let attempts = 0;
      let data: Poi[] = [];
      
      // Élargir progressivement le rayon si pas assez de résultats
      while (data.length < 5 && attempts < 3 && !cancelled) {
        attempts++;
        console.log(`[OffrirType] Search attempt ${attempts} with radius ${radius}m`);
        data = await fetchPoisOverpass(typeKey, center.lat, center.lng, radius, 40, brand || undefined);
        
        if (data.length < 5 && attempts < 3) {
          radius = radius * 2; // Double le rayon
          console.log(`[OffrirType] Only ${data.length} results found, expanding radius to ${radius}m`);
        }
      }
      
      if (cancelled) return;
      
      setCurrentRadius(radius);
      setSearchAttempts(attempts);
      setPois(data);

      if (layerRef.current) { 
        layerRef.current.remove(); 
        layerRef.current = null; 
      }
      const layer = L.layerGroup().addTo(mapRef.current!);
      data.forEach(p => {
        L.circleMarker([p.lat, p.lng], { 
          radius:6, 
          color:"#2563eb", 
          fillColor:"#2563eb", 
          fillOpacity:.85 
        })
        .bindPopup(`<strong>${p.name}</strong><br/>${p.address || ""}`)
        .addTo(layer);
      });
      layerRef.current = layer;

      if (data.length) {
        const b = L.latLngBounds(data.map(p => [p.lat, p.lng] as [number,number]));
        b.extend([center.lat, center.lng]);
        mapRef.current!.fitBounds(b.pad(0.15));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [step, center, ideaLabel, brand, type]);

  // Quand l'utilisateur confirme le formulaire
  const onConfirm = ({ ideaLabel: lbl, loc }: { ideaLabel: string; loc: { lat:number; lng:number; label?:string } }) => {
    console.log('[OffrirType] onConfirm called with location:', loc);
    // Ensure coordinates are valid numbers
    if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number' || 
        isNaN(loc.lat) || isNaN(loc.lng)) {
      console.error('[OffrirType] Invalid coordinates received:', loc);
      alert('Coordonnées invalides. Veuillez réessayer.');
      return;
    }
    setIdeaLabel(lbl);
    setCenter(loc);
    setStep("results");
    // Force scroll top when entering results
    try {
      const scroller = document.querySelector('.app-scroll') as HTMLElement | null;
      if (scroller) scroller.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {}

  };

  const title = step === "setup" 
    ? "Définir votre zone" 
    : `${ideaLabel}${center?.label ? ` — ${center.label}` : ""}`;

  const openExternal = (p: Poi, provider:"apple"|"waze"|"gmaps"|"osm") => {
    // Check if coordinates are valid
    if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
      console.error('Invalid coordinates for POI:', p);
      alert('Coordonnées non disponibles pour ce lieu');
      return;
    }

    const label = encodeURIComponent(p.name || "Point d'intérêt");
    const lat = p.lat.toString();
    const lng = p.lng.toString();
    
    let url: string;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    switch (provider) {
      case "apple":
        url = `https://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
        break;
      case "waze":
        if (isIOS || isAndroid) {
          // Deep link pour app native Waze
          url = `waze://?ll=${lat},${lng}&navigate=yes`;
        } else {
          // Web version
          url = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes&z=16`;
        }
        break;
      case "gmaps":
        if (isIOS) {
          // Deep link iOS pour Google Maps
          url = `comgooglemaps://?q=${label}&center=${lat},${lng}&zoom=16`;
        } else if (isAndroid) {
          // Deep link Android pour Google Maps
          url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
        } else {
          // Web version avec format API officiel
          url = `https://www.google.com/maps/search/?api=1&query=${label}&query_place_id=${lat},${lng}`;
        }
        break;
      case "osm":
        url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
        break;
      default:
        return;
    }
    
    console.log('[OffrirType] Opening external map:', provider, url, 'iOS:', isIOS, 'Android:', isAndroid);
    
    // Ouvrir avec la bonne stratégie selon le device
    if (isIOS || isAndroid) {
      // Mobile: tenter deep link d'abord, puis fallback web
      window.location.href = url;
      
      // Fallback vers version web si l'app ne s'ouvre pas
      setTimeout(() => {
        if (provider === "gmaps") {
          window.open(`https://www.google.com/maps/search/?api=1&query=${label}`, "_blank", "noopener,noreferrer");
        } else if (provider === "waze") {
          window.open(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank", "noopener,noreferrer");
        }
      }, 1500);
    } else {
      // Desktop: ouvrir dans nouvel onglet
      const w = window.open(url, "_blank", "noopener,noreferrer");
      
      // Fallback si bloqué par popup blocker
      if (!w) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  // Calculate distance between two points in meters using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: center?.label || title, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Lien copié !");
      }
    } catch (e) {
      console.error("Erreur lors du partage:", e);
    }
  };

  const handleCustomBack = React.useCallback(() => {
    if (step === "results") {
      setStep("setup");
      // Reset map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (layerRef.current) {
        layerRef.current = null;
      }
      setPois([]);
    } else {
      navigate('/home');
    }
  }, [step, navigate]);

  // Register back handler with AppBar
  React.useEffect(() => {
    setBackHandler(() => handleCustomBack);
    return () => setBackHandler(undefined);
  }, [setBackHandler, handleCustomBack]);

  return (
    <>
      {step === "setup" ? (
        <>
          <div className="pliiz-list">
            <div className="plz-card p-4 md:p-6 box-border">
              <OffrirSetupCard
                key={`setup-${initialZone ?? "none"}-${ideaFromQuery}`}
                initialIdea={ideaFromQuery}
                initialZoneFromProfile={initialZone}
                onConfirm={onConfirm}
              />
            </div>
            
            {/* Conseil du jour section */}
            <div className="px-4 offrir-conseil-section">
              <h2 className="text-lg font-bold text-white mb-4">
                Conseil du jour
              </h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <p className="text-white text-base leading-relaxed text-center font-medium m-0">
                  {(() => {
                    const tips = [
                      "Pense à la wishlist : demande discrètement la liste de souhaits pour éviter les doublons et les faux pas.",
                      "Misez sur le gourmand : chocolats, biscuits maison ou bonne bouteille, ça fait toujours plaisir et ça ne traîne jamais.",
                      "Fixe ton budget avant de flâner, tu profiteras plus de la recherche sans stress.",
                      "Et si tu offrais un souvenir ? Une expérience (atelier, concert, massage…) marque souvent plus qu'un objet matériel.",
                      "Préciser ses allergies alimentaires dans son profil, c'est protéger ses proches d'erreurs embarrassantes."
                    ];
                    return tips[Math.floor(Math.random() * tips.length)];
                  })()}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Title section with avatar */}
          <div style={{marginBottom: '24px'}}>
            <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
              <h3 className="typo-h1" style={{
                margin: 0, 
                fontSize: '20px', 
                fontWeight: '700', 
                lineHeight: '1.3',
                textTransform: 'capitalize',
                color: '#ffffff',
                flex: 1,
                paddingRight: '16px'
              }}>
                {ideaLabel}
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                {/* <span style={{fontSize: '12px', color: '#6b7b80'}}>pour</span> */}
                <TargetAvatar
                  targetName={targetData.targetName || undefined}
                  targetAvatar={targetData.targetAvatar || undefined}
                size={48}
              />
            </div>
          </div>
        </div>

        {/* Map section */}
        <div style={{marginBottom: '24px'}}>
          <div ref={mapEl} style={{
            height: '300px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #e7ecee',
            backgroundColor: '#f8f9fa'
          }} />
          
          {loading && (
            <div style={{textAlign: 'center', padding: '16px', color: '#6b7b80'}}>
              Recherche en cours...
            </div>
          )}
        </div>


        {/* Info banner - radius expanded */}
        {searchAttempts > 1 && pois.length > 0 && (
          <div className="mb-4 p-3 rounded-3xl text-sm text-white" style={{background: 'linear-gradient(135deg, #FF9E5F 0%, #FF7E2F 100%)', border: '1px solid rgba(255,255,255,0.3)'}}>
            ℹ️ Rayon élargi à {(currentRadius/1000).toFixed(1)} km pour trouver plus de résultats
          </div>
        )}

        {/* POI list */}
        {pois.length > 0 && (
          <div className="space-y-3 mb-6">
            {pois.map((poi, idx) => {
              const distance = center ? calculateDistance(center.lat, center.lng, poi.lat, poi.lng) : 0;
              const tags = poi.tags || {};
              
              // Déterminer les badges d'information
              const badges: string[] = [];
              
              // Badge "Local" si distance < 2km
              if (distance < 2000) badges.push("Local");
              
              // Badge "Bio/Éthique" basé sur les tags OSM
              if (tags.organic === "yes" || tags.organic === "only" || 
                  tags.fair_trade === "yes" || tags.fair_trade === "only") {
                badges.push("Éthique");
              }
              
              // Badge ouverture aujourd'hui (simplifié - pourrait être amélioré avec parsing opening_hours)
              const openingHours = tags.opening_hours;
              if (openingHours && !openingHours.includes("closed")) {
                // Vérification basique - amélioration possible
                if (openingHours.includes("Mo-Su") || openingHours.includes("24/7")) {
                  badges.push("Ouvert");
                }
              }
              
              return (
                <div key={idx} className="plz-card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-white mb-1">
                        {poi.name}
                      </h3>
                    </div>
                    <span className="text-sm font-medium text-white/90 ml-2 shrink-0">
                      {formatDistance(distance)}
                    </span>
                  </div>
                  {poi.address && (
                    <p className="text-sm text-white/80 mb-3">
                      {poi.address}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => openExternal(poi, "waze")}
                      disabled={!poi.lat || !poi.lng}
                      title={!poi.lat || !poi.lng ? "Coordonnées non disponibles" : "Ouvrir dans Waze"}
                      className="bg-white/20 text-white border border-white/30 rounded-full px-4 py-2 text-sm font-medium hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Waze
                    </button>
                    <button
                      onClick={() => openExternal(poi, "gmaps")}
                      disabled={!poi.lat || !poi.lng}
                      title={!poi.lat || !poi.lng ? "Coordonnées non disponibles" : "Ouvrir dans Google Maps"}
                      className="btn-orange"
                    >
                      Google Maps
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pois.length === 0 && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: '#ffffff'
          }}>
            <p style={{margin: 0, fontSize: '16px'}}>
              Aucun magasin trouvé dans cette zone.
            </p>
            <p style={{margin: '8px 0 0 0', fontSize: '14px'}}>
              Essayez d'élargir votre recherche ou de modifier votre localisation.
            </p>
          </div>
        )}
      </>
      )}
      
      {/* Modal Regift */}
      <RegiftModal
        open={showRegiftModal}
        onClose={() => { setShowRegiftModal(false); hasShownRegiftRef.current = true; }}
        firstName={targetData.targetName || "Cette personne"}
      />
    </>
  );
}