import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import type { Booking, Service, Business } from "@shared/schema";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Bookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

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

  const { data: business } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!business,
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: !!business,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      internalNotes,
    }: {
      id: string;
      status?: string;
      internalNotes?: string;
    }) => {
      return await apiRequest("PATCH", `/api/bookings/${id}`, {
        status,
        internalNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setSelectedBooking(null);
      toast({ title: "Booking updated successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Failed to update booking", variant: "destructive" });
    },
  });

  const getServiceName = (serviceId: string) => {
    return services?.find((s) => s.id === serviceId)?.name || "Unknown Service";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
            {t("common.confirmed")}
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">{t("common.pending")}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("common.cancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBookings = bookings?.filter((booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  const sortedBookings = filteredBookings?.sort(
    (a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
  );

  const getBookingsForDate = (date: Date) => {
    return bookings?.filter((booking) =>
      isSameDay(new Date(booking.bookingDate), date)
    ) || [];
  };

  const getDatesWithBookings = () => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    return bookings
      ?.filter((b) => {
        const date = new Date(b.bookingDate);
        return date >= start && date <= end && b.status !== "cancelled";
      })
      .map((b) => new Date(b.bookingDate)) || [];
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setInternalNotes(booking.internalNotes || "");
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    updateMutation.mutate({ id: bookingId, status: newStatus });
  };

  const handleSaveNotes = () => {
    if (selectedBooking) {
      updateMutation.mutate({
        id: selectedBooking.id,
        internalNotes,
      });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Please set up your business profile first.
            </p>
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
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-bookings-title">
            {t("bookings.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("bookings.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("bookings.all")}</SelectItem>
              <SelectItem value="pending">{t("bookings.pending")}</SelectItem>
              <SelectItem value="confirmed">{t("bookings.confirmed")}</SelectItem>
              <SelectItem value="cancelled">{t("bookings.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2" data-testid="tab-list-view">
            <List className="h-4 w-4" />
            {t("bookings.list")}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2" data-testid="tab-calendar-view">
            <CalendarIcon className="h-4 w-4" />
            {t("bookings.calendar")}
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {sortedBookings && sortedBookings.length > 0 ? (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("booking.yourDetails")}</TableHead>
                      <TableHead>{t("booking.selectedService")}</TableHead>
                      <TableHead>{t("booking.selectDateTime")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBookings.map((booking) => (
                      <TableRow key={booking.id} data-testid={`booking-row-${booking.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.customerEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getServiceName(booking.serviceId)}</TableCell>
                        <TableCell>
                          <div>
                            <p>{format(new Date(booking.bookingDate), "MMM d, yyyy")}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.startTime} - {booking.endTime}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${booking.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(booking)}
                                data-testid={`action-view-${booking.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {booking.status !== "confirmed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(booking.id, "confirmed")
                                  }
                                  data-testid={`action-confirm-${booking.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(booking.id, "cancelled")
                                  }
                                  className="text-destructive"
                                  data-testid={`action-cancel-${booking.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                <p className="text-muted-foreground">
                  {statusFilter !== "all"
                    ? "No bookings match your filter"
                    : "Share your booking page to start receiving appointments"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
            <Card>
              <CardContent className="pt-4">
                <Calendar
                  mode="single"
                  selected={calendarDate}
                  onSelect={(date) => date && setCalendarDate(date)}
                  modifiers={{
                    booked: getDatesWithBookings(),
                  }}
                  modifiersStyles={{
                    booked: {
                      fontWeight: "bold",
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                    },
                  }}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(calendarDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getBookingsForDate(calendarDate).length > 0 ? (
                  <div className="space-y-3">
                    {getBookingsForDate(calendarDate)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer hover-elevate"
                          onClick={() => handleViewDetails(booking)}
                          data-testid={`calendar-booking-${booking.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{booking.customerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {getServiceName(booking.serviceId)} • {booking.startTime}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No bookings on this date
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 pr-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedBooking.customerEmail}</span>
                </div>
                {selectedBooking.customerPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.customerPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedBooking.bookingDate), "MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedBooking.startTime} - {selectedBooking.endTime}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-1">Service</p>
                <p className="text-muted-foreground">
                  {getServiceName(selectedBooking.serviceId)}
                </p>
              </div>

              {selectedBooking.customerNotes && (
                <div className="border-t pt-4">
                  <p className="font-medium mb-1">Customer Notes</p>
                  <p className="text-muted-foreground">
                    {selectedBooking.customerNotes}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Internal Notes</p>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add private notes about this booking..."
                  className="resize-none"
                  data-testid="input-internal-notes"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedBooking?.status !== "confirmed" && (
              <Button
                variant="outline"
                onClick={() =>
                  handleStatusChange(selectedBooking!.id, "confirmed")
                }
                disabled={updateMutation.isPending}
                className="gap-2"
                data-testid="button-dialog-confirm"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm
              </Button>
            )}
            {selectedBooking?.status !== "cancelled" && (
              <Button
                variant="outline"
                onClick={() =>
                  handleStatusChange(selectedBooking!.id, "cancelled")
                }
                disabled={updateMutation.isPending}
                className="gap-2 text-destructive"
                data-testid="button-dialog-cancel"
              >
                <XCircle className="h-4 w-4" />
                Cancel Booking
              </Button>
            )}
            <Button
              onClick={handleSaveNotes}
              disabled={updateMutation.isPending}
              data-testid="button-save-notes"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
