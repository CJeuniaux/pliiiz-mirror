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
    <div className="min-h-screen flex flex-col">
      <div className="relative">
        {/* Hero Image */}
        <div className="relative z-0 h-[60vh] overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${gHome})` }}>
          <img 
            src={currentSlideData.image} 
            alt={currentSlideData.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Section */}
        <section className="relative z-10 -mt-8 md:-mt-10 min-h-[40vh] md:min-h-[50vh] flex flex-col justify-between bg-white rounded-t-[40px] border border-black/10 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] px-6 pt-6 pb-8">
          {/* Text content */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-[#2F4B4E] leading-tight whitespace-pre-line">
              {currentSlideData.title}
            </h1>
            <p className="text-kit-text-secondary text-base leading-relaxed max-w-sm mx-auto">
              {currentSlideData.description}
            </p>
          </div>

          {/* Get Started Button */}
          <div className="space-y-6 mt-4">
            <Button
              onClick={nextSlide}
              variant="kit"
              size="lg"
              className="w-full h-14 text-white font-semibold"
            >
              {currentSlide === onboardingSlides.length - 1 ? "Commencer" : "Suivant"}
            </Button>

            {/* Progress indicator */}
            <div className="flex justify-center space-x-2">
              {onboardingSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-kit-primary w-8' 
                      : 'bg-kit-neutral w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}