import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import onboarding1 from "@/assets/onboarding-1.jpg";
import onboarding2 from "@/assets/onboarding-2.jpg";
import onboarding3 from "@/assets/onboarding-3.jpg";
import gHome from "@/assets/g-home.webp";

interface OnboardingIntroProps {
  onComplete: () => void;
}

const onboardingSlides = [
  {
    image: onboarding1,
    title: "L’app idéale\npour faire plaisir",
    description: "Avec Pliiiz, finis les cadeaux à côté de la plaque. Tu partages tes envies et tes proches visent juste à tous les coups."
  },
  {
    image: onboarding2,
    title: "Simplifie-toi\nla vie",
    description: "Plus besoin de courir partout : trouve des idées cadeaux en un clin d’œil, sans pression et sans stress ✨"
  },
  {
    image: onboarding3,
    title: "Un geste pour\nla planète",
    description: "Donne une seconde vie aux cadeaux inutilisés ! Tu fais plaisir, tu désencombre et tu agis écolo."
  }
];

export function OnboardingIntro({ onComplete }: OnboardingIntroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = onboardingSlides[currentSlide];

  return (
    <div className="page-onboarding">
      <div className="onb-hero">
        <img 
          src={currentSlideData.image} 
          alt=""
        />
        <button className="onb-skip" onClick={onComplete}>
          Passer
        </button>
      </div>

      <div className="onb-sheet">
        <div className="text-center space-y-4">
          <h1 className="onb-title">
            {currentSlideData.title}
          </h1>
          <p className="onb-text">
            {currentSlideData.description}
          </p>
        </div>

        <div className="space-y-6 mt-4">
          <button
            onClick={nextSlide}
            className="btn-orange"
          >
            {currentSlide === onboardingSlides.length - 1 ? "Commencer" : "Suivant"}
          </button>

          {/* Progress indicator */}
          <div className="onb-progress">
            {onboardingSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`onb-progress-dot ${index === currentSlide ? 'active' : ''}`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}