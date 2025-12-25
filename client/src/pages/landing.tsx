import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import flowliftLogo from "@assets/flowlift_logo_full_large_white_1766548850207.png";
import { useState, useEffect, useCallback, useMemo } from "react";

import haircutImg1 from "@assets/adam-winger-FkAZqQJTbXM-unsplash_1766644171026.jpeg";
import haircutImg2 from "@assets/baylee-gramling-MMz03PyCOZg-unsplash_1766644171026.jpeg";
import haircutImg3 from "@assets/agustin-fernandez-1Pmp9uxK8X8-unsplash_1766644171026.jpeg";
import haircutImg4 from "@assets/nathon-oski-fE42nRlBcG8-unsplash_1766644171026.jpeg";
import haircutImg5 from "@assets/benyamin-bohlouli-LGXN4OSQSa4-unsplash_1766644171026.jpeg";

function RotatingText({ 
  phrases, 
  interval = 2750, 
  onIndexChange 
}: { 
  phrases: string[], 
  interval?: number, 
  onIndexChange?: (index: number) => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const nextPhrase = useCallback(() => {
    if (isPaused) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
      setIsAnimating(false);
    }, 300);
  }, [isPaused, phrases.length]);

  useEffect(() => {
    const timer = setInterval(nextPhrase, interval);
    return () => clearInterval(timer);
  }, [nextPhrase, interval]);

  const handleInteractionStart = () => setIsPaused(true);
  const handleInteractionEnd = () => setIsPaused(false);

  return (
    <span
      className="inline-block relative"
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      <span
        className={`inline-block transition-all duration-300 ease-in-out ${
          isAnimating 
            ? "opacity-0 translate-y-2" 
            : "opacity-100 translate-y-0"
        }`}
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {phrases[currentIndex]}
      </span>
    </span>
  );
}

function HaircutImageCarousel({ isVisible }: { isVisible: boolean }) {
  const images = [haircutImg1, haircutImg2, haircutImg3, haircutImg4, haircutImg5];
  
  const imageStyles = useMemo(() => {
    return images.map((_, i) => ({
      marginLeft: i === 0 ? 0 : Math.floor(Math.random() * 20) + 8,
      marginRight: Math.floor(Math.random() * 20) + 8,
      translateY: Math.floor(Math.random() * 31) - 15,
    }));
  }, []);

  return (
    <div className="w-[90%] mx-auto overflow-hidden py-4">
      <div className="flex justify-center items-center w-full">
        {images.map((img, index) => (
          <div
            key={index}
            className={`relative transition-all duration-500 ease-out flex-shrink-0 ${
              isVisible 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 translate-y-8"
            }`}
            style={{
              marginLeft: `${imageStyles[index].marginLeft}px`,
              marginRight: `${imageStyles[index].marginRight}px`,
              transform: `translateY(${imageStyles[index].translateY}px)`,
              transitionDelay: `${index * 80}ms`,
            }}
          >
            <div className="h-28 md:h-40 lg:h-64 xl:h-80 w-20 md:w-32 lg:w-48 xl:w-56 overflow-hidden rounded-md">
              <img
                src={img}
                alt={`Haircut ${index + 1}`}
                className="w-full h-[150%] object-cover object-top"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { t } = useI18n();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const rotatingPhrases = [
    t("landing.hero.rotating.haircut"),
    t("landing.hero.rotating.photoSession"),
    t("landing.hero.rotating.consultation"),
    t("landing.hero.rotating.classOrLesson"),
    t("landing.hero.rotating.equipmentHire"),
    t("landing.hero.rotating.venueHire"),
  ];

  const handlePhraseChange = useCallback((index: number) => {
    setCurrentPhraseIndex(index);
  }, []);

  const features = [
    {
      icon: Calendar,
      titleKey: "landing.features.easyScheduling",
      descKey: "landing.features.easySchedulingDesc",
    },
    {
      icon: Clock,
      titleKey: "landing.features.availabilityControl",
      descKey: "landing.features.availabilityControlDesc",
    },
    {
      icon: Users,
      titleKey: "landing.features.customerManagement",
      descKey: "landing.features.customerManagementDesc",
    },
    {
      icon: BarChart3,
      titleKey: "landing.features.simpleAnalytics",
      descKey: "landing.features.simpleAnalyticsDesc",
    },
  ];

  const benefits = [
    "landing.benefits.noDoubleBookings",
    "landing.benefits.mobileFriendly",
    "landing.benefits.instantConfirmations",
    "landing.benefits.multipleServices",
    "landing.benefits.customProfile",
    "landing.benefits.multiTenant",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-[#F1F4F8]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <img 
            src={flowliftLogo} 
            alt="FlowLift" 
            className="h-10 object-contain"
          />
          <div className="flex items-center gap-2">
            <LanguageSwitcher minimal />
            <a href="/api/login">
              <Button data-testid="button-login">{t("landing.startFree")}</Button>
            </a>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {t("landing.hero.fixedText")}
              </h1>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                <RotatingText 
                  phrases={rotatingPhrases} 
                  interval={2750} 
                  onIndexChange={handlePhraseChange}
                />
              </p>
            </div>
            <HaircutImageCarousel isVisible={currentPhraseIndex === 0} />
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="/api/login">
                <Button size="lg" className="gap-2" data-testid="button-get-started">
                  {t("landing.hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#features">
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  {t("landing.hero.learnMore")}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground text-sm">{t(feature.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("landing.benefits.title")}
              </h2>
              <p className="text-muted-foreground text-lg">
                {t("landing.benefits.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefitKey, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-card border"
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{t(benefitKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            {t("landing.cta.subtitle")}
          </p>
          <a href="/api/login">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2"
              data-testid="button-cta-signup"
            >
              {t("landing.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img 
              src={flowliftLogo} 
              alt="FlowLift" 
              className="h-6 object-contain"
            />
            <p className="text-sm text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
