import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, Phone, Mail, ExternalLink, Copy, Check, Camera, Globe, Share2 } from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube, SiTiktok, SiPinterest, SiSnapchat, SiWhatsapp, SiThreads } from "react-icons/si";
import type { Business } from "@shared/schema";
import { businessCategories } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

const businessFormSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  slug: z
    .string()
    .min(3, "URL must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialLinkedin: z.string().optional(),
  socialYoutube: z.string().optional(),
  socialTiktok: z.string().optional(),
  socialPinterest: z.string().optional(),
  socialSnapchat: z.string().optional(),
  socialWhatsapp: z.string().optional(),
  socialThreads: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { t, language } = useI18n();

  const getCategoryLabel = (cat: string): string => {
    return t(`categories.${cat}`);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: t("common.unauthorized"),
        description: t("common.loggingIn"),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast, t]);

  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      category: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      socialFacebook: "",
      socialInstagram: "",
      socialTwitter: "",
      socialLinkedin: "",
      socialYoutube: "",
      socialTiktok: "",
      socialPinterest: "",
      socialSnapchat: "",
      socialWhatsapp: "",
      socialThreads: "",
    },
  });

  useEffect(() => {
    if (business) {
      form.reset({
        name: business.name,
        slug: business.slug,
        description: business.description || "",
        category: business.category,
        address: business.address || "",
        city: business.city || "",
        country: business.country || "",
        phone: business.phone || "",
        email: business.email || "",
        socialFacebook: business.socialFacebook || "",
        socialInstagram: business.socialInstagram || "",
        socialTwitter: business.socialTwitter || "",
        socialLinkedin: business.socialLinkedin || "",
        socialYoutube: business.socialYoutube || "",
        socialTiktok: business.socialTiktok || "",
        socialPinterest: business.socialPinterest || "",
        socialSnapchat: business.socialSnapchat || "",
        socialWhatsapp: business.socialWhatsapp || "",
        socialThreads: business.socialThreads || "",
      });
    }
  }, [business, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: BusinessFormValues) => {
      if (business) {
        return await apiRequest("PATCH", "/api/business", data);
      } else {
        return await apiRequest("POST", "/api/business", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({ title: t("settings.profileSaved") });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: t("common.unauthorized"),
          description: t("common.loggingIn"),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: t("common.failedToSave"), variant: "destructive" });
    },
  });

  const onSubmit = (data: BusinessFormValues) => {
    saveMutation.mutate(data);
  };

  const logoMutation = useMutation({
    mutationFn: async (logoURL: string) => {
      return await apiRequest("PUT", "/api/business/logo", { logoURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({ title: t("settings.logoUpdated") });
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Error updating logo:", error);
      toast({ title: t("common.failedToSave"), variant: "destructive" });
      setIsUploading(false);
    },
  });

  const handleGetUploadParameters = useCallback(async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  }, []);

  const handleUploadComplete = useCallback((result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        setIsUploading(true);
        logoMutation.mutate(uploadURL);
      }
    }
  }, [logoMutation]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!business && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const copyBookingUrl = () => {
    const url = `${window.location.origin}/book/${form.getValues("slug")}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: t("settings.urlCopied") });
  };

  if (isLoading || authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-settings-title">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Profile Card with Logo Upload */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={business?.logoUrl?.startsWith('/objects/') 
                      ? business.logoUrl 
                      : business?.logoUrl || undefined
                    } 
                    className="object-cover" 
                  />
                  <AvatarFallback className="text-xl">
                    {business?.name?.charAt(0) || user?.firstName?.charAt(0) || "B"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <CardTitle>{business?.name || t("settings.yourBusiness")}</CardTitle>
                <CardDescription>
                  {business
                    ? getCategoryLabel(business.category)
                    : t("dashboard.setupButton")}
                </CardDescription>
              </div>
            </div>
            {business && (
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5 * 1024 * 1024}
                allowedFileTypes={["image/*"]}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonVariant="outline"
                buttonSize="default"
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span>{isUploading || logoMutation.isPending ? t("settings.uploading") : t("settings.changeLogo")}</span>
                </div>
              </ObjectUploader>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Language Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("settings.preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t("settings.language")}</label>
              <p className="text-sm text-muted-foreground mb-3">
                {t("settings.languageDescription")}
              </p>
              <LanguageSwitcher />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("settings.businessInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.businessName")} *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={handleNameChange}
                          placeholder={t("settings.businessNamePlaceholder")}
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.category")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder={t("settings.selectCategory")} />
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
              </div>

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.bookingPageUrl")} *</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center">
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                          {window.location.origin}/book/
                        </span>
                        <FormControl>
                          <Input
                            {...field}
                            className="rounded-l-none"
                            placeholder="your-business"
                            data-testid="input-slug"
                          />
                        </FormControl>
                      </div>
                      {business && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copyBookingUrl}
                          data-testid="button-copy-url"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      {t("settings.urlDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("settings.descriptionPlaceholder")}
                        className="resize-none min-h-[100px]"
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("settings.location")}
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>{t("settings.address")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="123 Main Street"
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.city")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="New York"
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.country")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="United States"
                            data-testid="input-country"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {t("settings.contact")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.phone")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.email")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="contact@business.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  {t("settings.socialMedia")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{t("settings.socialMediaDescription")}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="socialFacebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiFacebook className="h-4 w-4 text-[#1877F2]" />
                          Facebook
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-facebook"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialInstagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiInstagram className="h-4 w-4 text-[#E4405F]" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-instagram"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialTwitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiX className="h-4 w-4" />
                          X (Twitter)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-twitter"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialLinkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiLinkedin className="h-4 w-4 text-[#0A66C2]" />
                          LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-linkedin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialYoutube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiYoutube className="h-4 w-4 text-[#FF0000]" />
                          YouTube
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="channel"
                            data-testid="input-social-youtube"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialTiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiTiktok className="h-4 w-4" />
                          TikTok
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-tiktok"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialPinterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiPinterest className="h-4 w-4 text-[#E60023]" />
                          Pinterest
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-pinterest"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialSnapchat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiSnapchat className="h-4 w-4 text-[#FFFC00]" />
                          Snapchat
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-snapchat"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialWhatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiWhatsapp className="h-4 w-4 text-[#25D366]" />
                          WhatsApp
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+1234567890"
                            data-testid="input-social-whatsapp"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialThreads"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <SiThreads className="h-4 w-4" />
                          Threads
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="username"
                            data-testid="input-social-threads"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                {business && (
                  <a
                    href={`/book/${business.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button type="button" variant="outline" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {t("settings.previewBooking")}
                    </Button>
                  </a>
                )}
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-business"
                >
                  {saveMutation.isPending ? t("settings.saving") : business ? t("settings.save") : t("settings.create")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
