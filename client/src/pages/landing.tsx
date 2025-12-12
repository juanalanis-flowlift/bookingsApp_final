import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

export default function Landing() {
  const { t } = useI18n();

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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher minimal />
            <a href="/api/login">
              <Button data-testid="button-login">{t("landing.signIn")}</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t("landing.hero.title")}{" "}
              <span className="text-primary">{t("landing.hero.titleHighlight")}</span>
            </h1>
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
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">{t("app.name")}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
