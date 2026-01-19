import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ArrowLeft, ArrowRight, Check, Sun, Moon, Camera, Building2 } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { businessCategories, type Business } from "@shared/schema";

import step0Image from "@assets/flowlift_onboarding_step0_1768793034455.png";
import step1Image from "@assets/flowlift_onboarding_step1_1768793034456.png";
import step2Image from "@assets/flowlift_onboarding_step2_1768793034458.png";
import step3Image from "@assets/flowlift_onboarding_step3_1768793034457.png";
import step4Image from "@assets/flowlift_onboarding_step4_1768793034457.png";

const TOTAL_STEPS = 5;

const countries = [
  "United States", "Canada", "Mexico", "United Kingdom", "Spain", 
  "Argentina", "Colombia", "Peru", "Chile", "Australia",
  "Germany", "France", "Italy", "Brazil", "Portugal",
  "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden",
  "Norway", "Denmark", "Finland", "Ireland", "New Zealand",
  "Japan", "South Korea", "Singapore", "Hong Kong", "India",
  "South Africa", "United Arab Emirates", "Saudi Arabia", "Israel", "Turkey",
  "Poland", "Czech Republic", "Greece", "Romania", "Hungary",
  "Philippines", "Malaysia", "Thailand", "Indonesia", "Vietnam",
  "Ecuador", "Venezuela", "Costa Rica", "Panama", "Puerto Rico",
  "Dominican Republic", "Guatemala", "Honduras", "El Salvador", "Nicaragua",
  "Bolivia", "Paraguay", "Uruguay", "Cuba"
].sort();

const step1Schema = z.object({
  name: z.string().min(1, "Business name is required"),
  category: z.string().min(1, "Category is required"),
});

const step2Schema = z.object({
  description: z.string().min(1, "Description is required"),
});

const step3Schema = z.object({
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
});

const step4Schema = z.object({
  preferredLanguage: z.enum(["en", "es"]),
  theme: z.enum(["light", "dark"]).optional(),
});

type OnboardingData = {
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  preferredLanguage: "en" | "es";
  theme: "light" | "dark";
  logoUrl: string | null;
};

function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const percentage = Math.round((currentStep / (totalSteps - 1)) * 100);
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted/30"
        />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-foreground">
          {currentStep}/{totalSteps - 1}
        </span>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    category: "",
    description: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    preferredLanguage: language,
    theme: "light",
    logoUrl: null,
  });

  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || "",
        category: business.category || "",
        description: business.description || "",
        address: business.address || "",
        city: business.city || "",
        country: business.country || "",
        phone: business.phone || "",
        email: business.email || "",
        preferredLanguage: (business.preferredLanguage as "en" | "es") || language,
        theme: "light",
        logoUrl: business.logoUrl || null,
      });
      setCurrentStep(business.onboardingStep || 0);
      
      if (business.onboardingComplete) {
        navigate("/dashboard");
      }
    }
  }, [business, language, navigate]);

  useEffect(() => {
    const browserLang = navigator.language.startsWith("es") ? "es" : "en";
    if (!formData.preferredLanguage) {
      setFormData(prev => ({ ...prev, preferredLanguage: browserLang }));
    }
  }, []);

  const createBusinessMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingData> & { onboardingStep: number; slug?: string }) => {
      return await apiRequest("POST", "/api/business", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save",
        variant: "destructive",
      });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingData> & { onboardingStep?: number; onboardingComplete?: boolean; slug?: string; logoUrl?: string }) => {
      return await apiRequest("PATCH", "/api/business", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save",
        variant: "destructive",
      });
    },
  });

  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: formData.name,
      category: formData.category,
    },
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      description: formData.description,
    },
  });

  const step3Form = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      address: formData.address,
      city: formData.city,
      country: formData.country,
      phone: formData.phone,
      email: formData.email,
    },
  });

  const step4Form = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      preferredLanguage: formData.preferredLanguage,
      theme: formData.theme,
    },
  });

  useEffect(() => {
    step1Form.reset({ name: formData.name, category: formData.category });
    step2Form.reset({ description: formData.description });
    step3Form.reset({
      address: formData.address,
      city: formData.city,
      country: formData.country,
      phone: formData.phone,
      email: formData.email,
    });
    step4Form.reset({ preferredLanguage: formData.preferredLanguage, theme: formData.theme });
  }, [formData]);

  const getCategoryLabel = (cat: string): string => {
    return t(`categories.${cat}`);
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
  };

  const handleGetUploadParameters = useCallback(async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  }, []);

  const handleLogoUploadComplete = useCallback((result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        setFormData(prev => ({ ...prev, logoUrl: uploadURL }));
        if (business) {
          updateBusinessMutation.mutate({ logoUrl: uploadURL });
        }
        toast({
          title: t("settings.logoUpdated"),
        });
      }
    }
    setIsUploading(false);
  }, [business, updateBusinessMutation, toast, t]);

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      if (!business) {
        const tempSlug = `temp-${Date.now()}`;
        await createBusinessMutation.mutateAsync({
          name: "My Business",
          category: "other",
          slug: tempSlug,
          onboardingStep: 1,
        });
      } else {
        await updateBusinessMutation.mutateAsync({ onboardingStep: 1 });
      }
      return;
    }

    if (currentStep === 1) {
      const valid = await step1Form.trigger();
      if (!valid) return;
      const values = step1Form.getValues();
      setFormData(prev => ({ ...prev, ...values }));
      const slug = generateSlug(values.name);
      await updateBusinessMutation.mutateAsync({
        name: values.name,
        category: values.category,
        slug,
        onboardingStep: 2,
      });
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const valid = await step2Form.trigger();
      if (!valid) return;
      const values = step2Form.getValues();
      setFormData(prev => ({ ...prev, ...values }));
      await updateBusinessMutation.mutateAsync({
        description: values.description,
        onboardingStep: 3,
      });
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      const valid = await step3Form.trigger();
      if (!valid) return;
      const values = step3Form.getValues();
      setFormData(prev => ({ ...prev, ...values }));
      await updateBusinessMutation.mutateAsync({
        address: values.address || "",
        city: values.city,
        country: values.country,
        phone: values.phone,
        email: values.email,
        onboardingStep: 4,
      });
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      const values = step4Form.getValues();
      setFormData(prev => ({ ...prev, ...values }));
      setLanguage(values.preferredLanguage);
      await updateBusinessMutation.mutateAsync({
        preferredLanguage: values.preferredLanguage,
        onboardingStep: 5,
        onboardingComplete: true,
      });
      navigate("/services");
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isSaving = createBusinessMutation.isPending || updateBusinessMutation.isPending;

  const stepImages = [step0Image, step1Image, step2Image, step3Image, step4Image];

  if (authLoading || businessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("onboarding.step0.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("onboarding.step0.subtitle")}
            </p>
            <Button
              size="lg"
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleNext}
              disabled={isSaving}
              data-testid="button-start-setup"
            >
              {isSaving ? t("onboarding.saving") : t("onboarding.step0.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("onboarding.step1.title")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("onboarding.step1.subtitle")}
              </p>
            </div>

            <Form {...step1Form}>
              <form className="space-y-4">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step1.businessName")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("onboarding.step1.businessNamePlaceholder")}
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step1.category")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder={t("onboarding.step1.categoryPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {businessCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {getCategoryLabel(cat)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>{t("onboarding.step1.logo")}</Label>
                  <p className="text-sm text-muted-foreground">{t("onboarding.step1.logoDesc")}</p>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      {formData.logoUrl ? (
                        <AvatarImage src={formData.logoUrl} alt="Logo" />
                      ) : (
                        <AvatarFallback>
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5 * 1024 * 1024}
                      allowedFileTypes={["image/*"]}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleLogoUploadComplete}
                      buttonVariant="outline"
                      buttonSize="sm"
                    >
                      <div className="flex items-center gap-2" data-testid="button-upload-logo">
                        <Camera className="h-4 w-4" />
                        <span>{isUploading ? "..." : formData.logoUrl ? t("onboarding.step1.changeLogo") : t("onboarding.step1.uploadLogo")}</span>
                      </div>
                    </ObjectUploader>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("onboarding.step2.title")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("onboarding.step2.subtitle")}
              </p>
            </div>

            <Form {...step2Form}>
              <form className="space-y-4">
                <FormField
                  control={step2Form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step2.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("onboarding.step2.descriptionPlaceholder")}
                          rows={5}
                          className="resize-none"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("onboarding.step3.title")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("onboarding.step3.subtitle")}
              </p>
            </div>

            <Form {...step3Form}>
              <form className="space-y-4">
                <FormField
                  control={step3Form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step3.address")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("onboarding.step3.addressPlaceholder")}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={step3Form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.step3.city")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("onboarding.step3.cityPlaceholder")}
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step3Form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("onboarding.step3.country")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder={t("onboarding.step3.countryPlaceholder")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={step3Form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step3.phone")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("onboarding.step3.phonePlaceholder")}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step3Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step3.email")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder={t("onboarding.step3.emailPlaceholder")}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("onboarding.step4.title")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("onboarding.step4.subtitle")}
              </p>
            </div>

            <Form {...step4Form}>
              <form className="space-y-6">
                <FormField
                  control={step4Form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step4.language")}</FormLabel>
                      <FormDescription>{t("onboarding.step4.languageDesc")}</FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-language">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step4Form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("onboarding.step4.appearance")}</FormLabel>
                      <FormDescription>{t("onboarding.step4.appearanceDesc")}</FormDescription>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={field.value === "light" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange("light")}
                          data-testid="button-theme-light"
                        >
                          <Sun className="mr-2 h-4 w-4" />
                          {t("onboarding.step4.light")}
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "dark" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => field.onChange("dark")}
                          data-testid="button-theme-dark"
                        >
                          <Moon className="mr-2 h-4 w-4" />
                          {t("onboarding.step4.dark")}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            <div className="bg-primary/10 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("onboarding.complete.title")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("onboarding.complete.subtitle")}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col md:flex-row min-h-screen">
        <header className="flex items-center justify-between p-4 md:hidden border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">FL</span>
            </div>
            <span className="font-semibold text-lg">flowlift</span>
          </div>
          {currentStep > 0 && <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />}
        </header>

        <div className="flex-1 flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 bg-muted/30 flex items-center justify-center p-8 order-first md:order-first">
            <div className="max-w-sm">
              <img
                src={stepImages[currentStep]}
                alt={`Step ${currentStep} illustration`}
                className="w-full h-auto max-h-64 md:max-h-96 object-contain"
              />
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col">
            <div className="hidden md:flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">FL</span>
                </div>
                <span className="font-semibold text-lg">flowlift</span>
              </div>
              {currentStep > 0 && <ProgressIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />}
            </div>

            <div className="flex-1 flex flex-col p-6 md:p-10">
              <div className="flex-1">
                {renderStepContent()}
              </div>

              {currentStep > 0 && (
                <div className="flex items-center justify-between pt-6 mt-6 border-t">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isSaving}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("onboarding.back")}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-continue"
                  >
                    {isSaving ? t("onboarding.saving") : currentStep === 4 ? t("onboarding.complete.cta") : t("onboarding.continue")}
                    {currentStep < 4 && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
