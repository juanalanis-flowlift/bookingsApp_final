import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  ExternalLink,
} from "lucide-react";
import type { Business, Booking, Service } from "@shared/schema";
import { format, isAfter, startOfDay, subDays } from "date-fns";

interface DashboardStats {
  upcomingBookings: number;
  last30DaysBookings: number;
  totalServices: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!business,
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: !!business,
  });

  const stats: DashboardStats = {
    upcomingBookings: bookings?.filter(
      (b) =>
        b.status !== "cancelled" &&
        isAfter(new Date(b.bookingDate), startOfDay(new Date()))
    ).length || 0,
    last30DaysBookings: bookings?.filter(
      (b) =>
        isAfter(new Date(b.bookingDate), subDays(new Date(), 30)) &&
        b.status !== "cancelled"
    ).length || 0,
    totalServices: services?.filter((s) => s.isActive).length || 0,
  };

  const upcomingBookings = bookings
    ?.filter(
      (b) =>
        b.status !== "cancelled" &&
        isAfter(new Date(b.bookingDate), startOfDay(new Date()))
    )
    .sort(
      (a, b) =>
        new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
    )
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">{t("common.confirmed")}</Badge>;
      case "pending":
        return <Badge variant="secondary">{t("common.pending")}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("common.cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (businessLoading || authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t("dashboard.welcomeNewBusiness")}</h2>
            <p className="text-muted-foreground">
              {t("dashboard.setupNewBusiness")}
            </p>
            <Link href="/settings">
              <Button className="gap-2" data-testid="button-setup-business">
                {t("dashboard.setupButton")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-dashboard-title">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.welcome")}
          </p>
        </div>
        <a
          href={`/book/${business.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2" data-testid="button-view-booking-page">
            <ExternalLink className="h-4 w-4" />
            {t("dashboard.viewBookingPage")}
          </Button>
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.upcomingBookings")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-upcoming-count">
              {stats.upcomingBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.scheduledAppointments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.last30Days")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-30day-count">
              {stats.last30DaysBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.totalBookings")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.activeServices")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-services-count">
              {stats.totalServices}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.availableForBooking")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t("dashboard.upcomingBookings")}</CardTitle>
          <Link href="/bookings">
            <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-bookings">
              {t("dashboard.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : upcomingBookings && upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const service = services?.find((s) => s.id === booking.serviceId);
                return (
                  <div
                    key={booking.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border"
                    data-testid={`booking-item-${booking.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {service?.name} - {booking.startTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(booking.bookingDate), "MMM d, yyyy")}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("dashboard.noUpcomingBookings")}</p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.shareYourBookingPage")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
