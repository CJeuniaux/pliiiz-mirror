import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lightbulb, Info, X, ChevronLeft, ChevronRight, Sparkles, Target } from "lucide-react";
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
import useEmblaCarousel from 'embla-carousel-react';
import { DesignFeedbackModal } from "@/components/modals/design-feedback-modal";
import { ZoneExplanationModal } from "@/components/modals/zone-explanation-modal";
import tips from "@/data/tips.json";
import news from "@/data/news.json";
import mobileMockup from "@/assets/generated/ui/mobile-app-mockup.jpg";

interface HomePageNewProps {
  onNavigateToRequests?: () => void;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  body: string;
}

interface Tip {
  id: string;
  text: string;
}

export function HomePageNew({ onNavigateToRequests }: HomePageNewProps) {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [dailyTip, setDailyTip] = useState<Tip | null>(null);
  const [showDesignFeedback, setShowDesignFeedback] = useState(false);
  const [showZoneExplanation, setShowZoneExplanation] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
    skipSnaps: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  // Get daily tip based on date
  useEffect(() => {
    const today = new Date().toDateString();
    const storedTip = localStorage.getItem(`dailyTip_${today}`);
    
    if (storedTip) {
      setDailyTip(JSON.parse(storedTip));
    } else {
      // Select random tip and store it for the day
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setDailyTip(randomTip);
      localStorage.setItem(`dailyTip_${today}`, JSON.stringify(randomTip));
    }
  }, []);

  // Create new announcement cards
  const announcementCards = [
    {
      id: 'design-feedback',
      type: 'announcement',
      title: 'On a refait tout le design ✨',
      subtitle: 'Dites-nous ce que vous en pensez !',
      features: [
      'Parcours simplifié : nouvelle nav + onglets plus clairs',
      'Fiches cadeaux redesign : visuels, tags et priorités',
      'Performances boostées : chargements plus rapides ⏱️'
    ],
      cta: 'Donner mon avis',
      action: () => setShowDesignFeedback(true),
      image: mobileMockup
    },
    {
      id: 'zone-features',
      type: 'announcement', 
      title: 'Trouver le cadeau idéal est encore plus simple 🎯',
      features: [
        'Définissez votre zone (ex. Namur, Bel) pour des idées locales pertinentes',
        'Me localiser : géolocalisation en 1 clic',
        'Encodage automatique : suggestions intelligentes dans le champ Type de cadeaux'
      ],
      cta: 'Voir comment ça marche',
      action: () => setShowZoneExplanation(true)
    }
  ];

  // Sort news by date (most recent first) and add announcement cards at the beginning
  const sortedNews = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allItems = [...announcementCards, ...sortedNews];

  return (
    <ScreenFixedBG isAuth={true} topGap={24} padH={0} padB={90}>{/* padH=0 car géré par .plz-content */}
        {/* About Pliiiz */}
        <section className="py-4 mb-8 px-4" aria-labelledby="about-title">
          <div>
            <h1 id="about-title" className="text-2xl font-bold mb-4 text-white">À propos de Pliiiz</h1>
            <p className="text-justify text-white">
              Pliiiz, c'est ton super-pouvoir cadeaux : tu dévoiles tes{" "}<strong>goûts & envies</strong>, tes proches offrent juste ce qu'il faut.{" "}Simple, malin, efficace 💡</p>
          </div>
        </section>

        {/* News Carousel */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Actualités</h3>
          
          {allItems.length > 0 && (
            <div className="px-2 -mx-2">
              <div className="overflow-visible" ref={emblaRef}>
                <div className="flex">
                  {allItems.map((item: any) => (
                    <div key={item.id} className="flex-[0_0_100%] min-w-0 px-2">
                      {item.type === 'announcement' ? (
                        <article className="pliiz-card cursor-pointer min-h-[320px] flex flex-col">
                          <header className="text-center mb-4">
                            <h4 className="font-semibold text-[17px] leading-[1.3] mb-2 min-h-[44px] flex items-center justify-center">
                              {item.title}
                            </h4>
                            <p className="text-[14px] leading-[1.5] opacity-80 min-h-[42px]">
                              {item.subtitle || "Découvrez cette nouvelle fonctionnalité pour améliorer votre expérience sur Pliiiz."}
                            </p>
                          </header>
                          
                          <div className="mb-4 space-y-2 flex-1">
                            {item.features ? (
                              item.features.map((feature: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-[13px] opacity-80">
                                  <span className="font-bold">•</span>
                                  <span>{feature}</span>
                                </div>
                              ))
                            ) : (
                              <>
                                <div className="flex items-start gap-2 text-[13px] opacity-80">
                                  <span className="font-bold">•</span>
                                  <span>Facile à utiliser et intuitif</span>
                                </div>
                                <div className="flex items-start gap-2 text-[13px] opacity-80">
                                  <span className="font-bold">•</span>
                                  <span>Personnalisez selon vos préférences</span>
                                </div>
                                <div className="flex items-start gap-2 text-[13px] opacity-80">
                                  <span className="font-bold">•</span>
                                  <span>Partagez avec vos proches facilement</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="text-center mt-auto">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Track analytics
                                if (typeof window !== 'undefined' && (window as any).gtag) {
                                  (window as any).gtag('event', 'cta_click', {
                                    cardId: item.id,
                                    cta: item.cta.toLowerCase().replace(/\s+/g, '_')
                                  });
                                }
                                item.action();
                              }}
                            >
                              {item.cta}
                            </Button>
                          </div>
                        </article>
                      ) : (
                        <article 
                          className="pliiz-card cursor-pointer min-h-[320px] flex flex-col"
                          onClick={() => setSelectedNews(item)}
                        >
                          <header className="flex gap-2 items-start mb-2">
                            <h4 className="font-semibold text-[17px] leading-[1.3] flex-1 line-clamp-2 min-h-[44px]">
                              {item.title}
                            </h4>
                            <time className="text-[13px] opacity-60 whitespace-nowrap ml-2">
                              {new Date(item.date).toLocaleDateString('fr-FR')}
                            </time>
                          </header>
                          <p className="text-[14px] leading-[1.5] opacity-80 mb-2 flex-1 line-clamp-6 min-h-[126px]">
                            {item.body.length > 180 ? item.body.slice(0, 180) + "..." : item.body + " Restez informé des dernières nouveautés et améliorations de la plateforme Pliiiz pour ne rien manquer."}
                          </p>
                          <div className="text-right mt-auto">
                            <a 
                              className="inline-flex items-center gap-1.5 py-2 hover:underline transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNews(item);
                              }}
                            >
                              Lire la suite
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M13 5l7 7-7 7M5 12h14"/>
                              </svg>
                            </a>
                          </div>
                        </article>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows below - only show if more than 1 item */}
              {allItems.length > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50"
                    onClick={scrollPrev}
                    aria-label="Actualité précédente"
                    disabled={selectedIndex === 0}
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  <span className="text-white text-sm font-medium">
                    {selectedIndex + 1} / {allItems.length}
                  </span>
                  
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50"
                    onClick={scrollNext}
                    aria-label="Actualité suivante"
                    disabled={selectedIndex === allItems.length - 1}
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Daily Tip - moved to bottom */}
        {dailyTip && (
          <div className="mt-4">
            <h3 className="text-2xl font-bold mb-4">Conseil du jour</h3>
            <div className="pliiz-card relative overflow-hidden" style={{ minHeight: '132px' }}>
              {/* Background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{
                  backgroundImage: `url('https://source.unsplash.com/800x600/?gift,present,celebration&t=${dailyTip.id}')`
                }}
              />
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-center h-full min-h-[132px]">
                <p className="text-[16px] leading-[1.5] font-normal text-center">{dailyTip.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* News Detail Modal */}
        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="pliiz-card max-w-md mx-auto">
            <div className="flex justify-between items-start mb-4">
              <DialogHeader className="flex-1">
                <DialogTitle>{selectedNews?.title}</DialogTitle>
              </DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNews(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                {selectedNews?.date && new Date(selectedNews.date).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm leading-relaxed">{selectedNews?.body}</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Design Feedback Modal */}
        <DesignFeedbackModal 
          open={showDesignFeedback} 
          onOpenChange={setShowDesignFeedback} 
        />

        {/* Zone Explanation Modal */}
        <ZoneExplanationModal 
          open={showZoneExplanation} 
          onOpenChange={setShowZoneExplanation} 
        />
    </ScreenFixedBG>
  );
}