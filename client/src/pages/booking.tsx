import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
} from "lucide-react";
import type { Business, Service, Booking, Availability } from "@shared/schema";
import { format, addDays, isBefore, startOfDay, isToday, addMinutes } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

const bookingFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  customerNotes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

type BookingStep = "services" | "datetime" | "details" | "confirmation";

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<BookingStep>("services");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const { t, language } = useI18n();

  const getCategoryLabel = (cat: string): string => {
    return t(`categories.${cat}`);
  };

  const dateLocale = language === "es" ? es : enUS;

  const { data: business, isLoading: businessLoading, error: businessError } = useQuery<Business>({
    queryKey: ["/api/public/business", slug],
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/public/services", slug],
    enabled: !!business,
  });

  const { data: availability } = useQuery<Availability[]>({
    queryKey: ["/api/public/availability", slug],
    enabled: !!business,
  });

  const { data: existingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/public/bookings", slug, selectedDate?.toISOString()],
    enabled: !!business && !!selectedDate,
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerNotes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      if (!selectedService || !selectedDate || !selectedTime) {
        throw new Error("Missing booking details");
      }

      const endTime = calculateEndTime(selectedTime, selectedService.duration);

      return await apiRequest("POST", `/api/public/bookings/${slug}`, {
        serviceId: selectedService.id,
        bookingDate: selectedDate.toISOString(),
        startTime: selectedTime,
        endTime,
        preferredLanguage: language,
        ...data,
      });
    },
    onSuccess: (booking) => {
      setConfirmedBooking(booking as unknown as Booking);
      setStep("confirmation");
    },
  });

  const formatPrice = (price: string | number) => {
    const locale = language === "es" ? "es-MX" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
    }).format(typeof price === "string" ? parseFloat(price) : price);
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addMinutes(startDate, duration);
    return format(endDate, "HH:mm");
  };

  const getAvailableSlots = (): TimeSlot[] => {
    if (!selectedDate || !selectedService || !availability) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);

    if (!dayAvailability || !dayAvailability.isOpen) return [];

    const slots: TimeSlot[] = [];
    const slotDuration = dayAvailability.slotDuration || 30;
    const serviceDuration = selectedService.duration;
    const maxSlotCapacity = dayAvailability.maxBookingsPerSlot || 1;

    const [startHour, startMin] = dayAvailability.startTime.split(":").map(Number);
    const [endHour, endMin] = dayAvailability.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (let time = startMinutes; time + serviceDuration <= endMinutes; time += slotDuration) {
      const hours = Math.floor(time / 60);
      const mins = time % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      const serviceEndTime = calculateEndTime(timeStr, serviceDuration);

      const overlappingBookings = (existingBookings || []).filter((booking) => {
        if (booking.status === "cancelled") return false;
        return (
          (timeStr >= booking.startTime && timeStr < booking.endTime) ||
          (serviceEndTime > booking.startTime && serviceEndTime <= booking.endTime) ||
          (timeStr <= booking.startTime && serviceEndTime >= booking.endTime)
        );
      });

      const isAtCapacity = overlappingBookings.length >= maxSlotCapacity;

      let isPast = false;
      if (isToday(selectedDate)) {
        const now = new Date();
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hours, mins, 0, 0);
        isPast = isBefore(slotDate, now);
      }

      slots.push({
        time: timeStr,
        available: !isAtCapacity && !isPast,
      });
    }

    return slots;
  };

  const isDateAvailable = (date: Date): boolean => {
    if (isBefore(date, startOfDay(new Date()))) return false;
    if (!availability) return false;

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);
    return dayAvailability?.isOpen ?? false;
  };

  const onSubmit = (data: BookingFormValues) => {
    createBookingMutation.mutate(data);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setStep("datetime");
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const handleBack = () => {
    if (step === "datetime") {
      setStep("services");
      setSelectedService(null);
    } else if (step === "details") {
      setStep("datetime");
      setSelectedTime(null);
    }
  };

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (businessError || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">{t("booking.businessNotFound")}</h2>
            <p className="text-muted-foreground">
              {t("booking.businessNotFoundDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "confirmation" && confirmedBooking) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="pt-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{t("booking.confirmed")}</h2>
                <p className="text-muted-foreground">
                  {t("booking.thankYou")} {business.name}
                </p>
              </div>

              <Card className="bg-muted/50 text-left">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy", { locale: dateLocale }) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedTime && selectedService
                        ? `${selectedTime} - ${calculateEndTime(selectedTime, selectedService.duration)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedService?.name}</span>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                {t("booking.confirmationSent")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setStep("services");
                    setSelectedService(null);
                    setSelectedDate(undefined);
                    setSelectedTime(null);
                    setConfirmedBooking(null);
                    form.reset();
                  }}
                  variant="outline"
                  data-testid="button-book-another"
                >
                  {t("booking.bookAnother")}
                </Button>
                <Button
                  onClick={() => window.location.href = "/my-bookings"}
                  data-testid="button-view-my-bookings"
                >
                  {t("booking.viewMyBookings")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={business.logoUrl || undefined} className="object-cover" />
              <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{business.name}</h1>
              <p className="text-xs text-muted-foreground">
                {getCategoryLabel(business.category)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher minimal />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2">
            {["services", "datetime", "details"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : i < ["services", "datetime", "details"].indexOf(step)
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 ${
                      i < ["services", "datetime", "details"].indexOf(step)
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
            <span>{t("booking.step.service")}</span>
            <span>{t("booking.step.datetime")}</span>
            <span>{t("booking.step.details")}</span>
          </div>
        </div>

        {/* Step: Services */}
        {step === "services" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Business Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0">
                    <AvatarImage src={business.logoUrl || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl">
                      {business.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-2xl font-bold">{business.name}</h2>
                      <Badge variant="secondary" className="mt-1">
                        {getCategoryLabel(business.category)}
                      </Badge>
                    </div>
                    {business.description && (
                      <p className="text-muted-foreground">{business.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {(business.city || business.country) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {[business.city, business.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{business.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services List */}
            <div>
              <h3 className="text-xl font-semibold mb-4">{t("booking.selectService")}</h3>
              {services && services.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {services
                    .filter((s) => s.isActive)
                    .map((service) => (
                      <Card
                        key={service.id}
                        className="cursor-pointer hover-elevate"
                        onClick={() => handleServiceSelect(service)}
                        data-testid={`service-card-${service.id}`}
                      >
                        <CardContent className="pt-6 space-y-3">
                          <h4 className="text-lg font-semibold">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{service.duration} {t("booking.min")}</span>
                            </div>
                            <span className="text-lg font-bold">
                              {formatPrice(service.price)}
                            </span>
                          </div>
                          {service.tags && service.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {service.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Button className="w-full" data-testid={`button-select-service-${service.id}`}>
                            {t("booking.select")}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {t("booking.noServices")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step: Date & Time */}
        {step === "datetime" && selectedService && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("booking.back")}
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{t("booking.selectedService")}</CardTitle>
                <CardDescription>
                  {selectedService.name} - {selectedService.duration} {t("booking.min")} -{" "}
                  {formatPrice(selectedService.price)}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("booking.selectDate")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => !isDateAvailable(date)}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 60)}
                    className="rounded-md"
                    locale={dateLocale}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate
                      ? `${t("booking.availableTimes")} - ${format(selectedDate, "MMM d, yyyy", { locale: dateLocale })}`
                      : t("booking.selectDateFirst")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {getAvailableSlots().map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => handleTimeSelect(slot.time)}
                          className="h-12"
                          data-testid={`time-slot-${slot.time}`}
                        >
                          {slot.time}
                        </Button>
                      ))}
                      {getAvailableSlots().length === 0 && (
                        <p className="col-span-full text-center text-muted-foreground py-8">
                          {t("booking.noSlots")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        {t("booking.pleaseSelectDate")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && selectedService && selectedDate && selectedTime && (
          <div className="max-w-lg mx-auto space-y-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("booking.back")}
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{t("booking.summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(selectedDate, "EEEE, MMMM d, yyyy", { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedTime} - {calculateEndTime(selectedTime, selectedService.duration)} ({selectedService.duration} {t("booking.min")})
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <span className="font-semibold">{formatPrice(selectedService.price)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("booking.yourDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.name")} *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-customer-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.email")} *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-customer-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.phone")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" data-testid="input-customer-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.notes")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none" data-testid="input-customer-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={createBookingMutation.isPending}
                      data-testid="button-confirm-booking"
                    >
                      {createBookingMutation.isPending ? t("booking.processing") : t("booking.confirmBooking")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
