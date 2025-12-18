import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Calendar as CalendarIcon, Plus, Trash2, Clock, Ban } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Availability, BlockedTime, Business } from "@shared/schema";
import { format } from "date-fns";
import { isUnauthorizedError } from "@/lib/authUtils";

const DAYS_OF_WEEK_KEYS = [
  "days.sunday",
  "days.monday",
  "days.tuesday",
  "days.wednesday",
  "days.thursday",
  "days.friday",
  "days.saturday",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const time = `${hour.toString().padStart(2, "0")}:${minute}`;
  return time;
});

const SLOT_DURATIONS = [15, 30, 45, 60, 90, 120];

export default function AvailabilityPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [blockedTimeDialog, setBlockedTimeDialog] = useState(false);
  const [newBlockedTime, setNewBlockedTime] = useState({
    startDate: new Date(),
    startTime: "09:00",
    endDate: new Date(),
    endTime: "17:00",
    reason: "",
  });

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

  const { data: availability, isLoading } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
    enabled: !!business,
  });

  const { data: blockedTimes } = useQuery<BlockedTime[]>({
    queryKey: ["/api/blocked-times"],
    enabled: !!business,
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOpen: boolean;
      slotDuration: number;
    }) => {
      return await apiRequest("POST", "/api/availability", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({ title: "Availability updated" });
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
      toast({ title: "Failed to update availability", variant: "destructive" });
    },
  });

  const createBlockedTimeMutation = useMutation({
    mutationFn: async (data: {
      startDateTime: Date;
      endDateTime: Date;
      reason: string;
    }) => {
      return await apiRequest("POST", "/api/blocked-times", {
        startDateTime: data.startDateTime.toISOString(),
        endDateTime: data.endDateTime.toISOString(),
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-times"] });
      setBlockedTimeDialog(false);
      setNewBlockedTime({
        startDate: new Date(),
        startTime: "09:00",
        endDate: new Date(),
        endTime: "17:00",
        reason: "",
      });
      toast({ title: "Blocked time added" });
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
      toast({ title: "Failed to add blocked time", variant: "destructive" });
    },
  });

  const deleteBlockedTimeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/blocked-times/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-times"] });
      toast({ title: "Blocked time removed" });
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
      toast({ title: "Failed to remove blocked time", variant: "destructive" });
    },
  });

  const getDayAvailability = (dayOfWeek: number) => {
    return (
      availability?.find((a) => a.dayOfWeek === dayOfWeek) || {
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        isOpen: false,
        slotDuration: 30,
      }
    );
  };

  const handleDayToggle = (dayOfWeek: number, isOpen: boolean) => {
    const current = getDayAvailability(dayOfWeek);
    updateAvailabilityMutation.mutate({
      dayOfWeek,
      startTime: current.startTime,
      endTime: current.endTime,
      isOpen,
      slotDuration: current.slotDuration || 30,
    });
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const current = getDayAvailability(dayOfWeek);
    updateAvailabilityMutation.mutate({
      dayOfWeek,
      startTime: field === "startTime" ? value : current.startTime,
      endTime: field === "endTime" ? value : current.endTime,
      isOpen: current.isOpen ?? false,
      slotDuration: current.slotDuration || 30,
    });
  };

  const handleSlotDurationChange = (dayOfWeek: number, value: string) => {
    const current = getDayAvailability(dayOfWeek);
    updateAvailabilityMutation.mutate({
      dayOfWeek,
      startTime: current.startTime,
      endTime: current.endTime,
      isOpen: current.isOpen ?? false,
      slotDuration: parseInt(value),
    });
  };

  const handleAddBlockedTime = () => {
    const startDateTime = new Date(newBlockedTime.startDate);
    const [startHour, startMin] = newBlockedTime.startTime.split(":");
    startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

    const endDateTime = new Date(newBlockedTime.endDate);
    const [endHour, endMin] = newBlockedTime.endTime.split(":");
    endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

    createBlockedTimeMutation.mutate({
      startDateTime,
      endDateTime,
      reason: newBlockedTime.reason,
    });
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
              {t("availability.setupFirst")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-availability-title">
          {t("availability.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("availability.subtitle")}
        </p>
      </div>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("availability.workingHours")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK_KEYS.map((dayKey, index) => {
              const dayAvail = getDayAvailability(index);
              return (
                <div
                  key={dayKey}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border"
                  data-testid={`day-availability-${index}`}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Switch
                      checked={dayAvail.isOpen ?? false}
                      onCheckedChange={(checked) => handleDayToggle(index, checked)}
                      data-testid={`switch-day-${index}`}
                    />
                    <span className="font-medium">{t(dayKey)}</span>
                  </div>

                  {dayAvail.isOpen ? (
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Select
                          value={dayAvail.startTime}
                          onValueChange={(v) => handleTimeChange(index, "startTime", v)}
                        >
                          <SelectTrigger className="w-[100px]" data-testid={`select-start-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">{t("availability.to")}</span>
                        <Select
                          value={dayAvail.endTime}
                          onValueChange={(v) => handleTimeChange(index, "endTime", v)}
                        >
                          <SelectTrigger className="w-[100px]" data-testid={`select-end-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t("availability.slotLabel")}</span>
                        <Select
                          value={String(dayAvail.slotDuration || 30)}
                          onValueChange={(v) => handleSlotDurationChange(index, v)}
                        >
                          <SelectTrigger className="w-[90px]" data-testid={`select-slot-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SLOT_DURATIONS.map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d} min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary">{t("availability.closed")}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Times */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            {t("common.blockedTime")}
          </CardTitle>
          <Dialog open={blockedTimeDialog} onOpenChange={setBlockedTimeDialog}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto"
              onClick={() => setBlockedTimeDialog(true)}
              data-testid="button-add-blocked-time"
            >
              <Plus className="h-4 w-4" />
              {t("common.addBlockedTime")}
            </Button>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("common.blockTimeOff")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("availability.startDate")}
                    </label>
                    <Calendar
                      mode="single"
                      selected={newBlockedTime.startDate}
                      onSelect={(date) =>
                        date &&
                        setNewBlockedTime((prev) => ({ ...prev, startDate: date }))
                      }
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("availability.endDate")}
                    </label>
                    <Calendar
                      mode="single"
                      selected={newBlockedTime.endDate}
                      onSelect={(date) =>
                        date &&
                        setNewBlockedTime((prev) => ({ ...prev, endDate: date }))
                      }
                      className="rounded-md border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("availability.startDate") /* reused for time picker labels */}
                    </label>
                    <Select
                      value={newBlockedTime.startTime}
                      onValueChange={(v) =>
                        setNewBlockedTime((prev) => ({ ...prev, startTime: v }))
                      }
                    >
                      <SelectTrigger data-testid="select-blocked-start-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t("availability.endDate") /* reused for time picker labels */}
                    </label>
                    <Select
                      value={newBlockedTime.endTime}
                      onValueChange={(v) =>
                        setNewBlockedTime((prev) => ({ ...prev, endTime: v }))
                      }
                    >
                      <SelectTrigger data-testid="select-blocked-end-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("availability.reason")}
                  </label>
                  <Input
                    value={newBlockedTime.reason}
                    onChange={(e) =>
                      setNewBlockedTime((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="e.g., Vacation, Holiday, Personal"
                    data-testid="input-blocked-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBlockedTimeDialog(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleAddBlockedTime}
                  disabled={createBlockedTimeMutation.isPending}
                  data-testid="button-save-blocked-time"
                >
                  {createBlockedTimeMutation.isPending ? t("settings.saving") : t("common.add")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {blockedTimes && blockedTimes.length > 0 ? (
            <div className="space-y-3">
              {blockedTimes.map((bt) => (
                <div
                  key={bt.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                  data-testid={`blocked-time-${bt.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(new Date(bt.startDateTime), "MMM d, yyyy")}
                        {!isSameDay(
                          new Date(bt.startDateTime),
                          new Date(bt.endDateTime)
                        ) && ` - ${format(new Date(bt.endDateTime), "MMM d, yyyy")}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(bt.startDateTime), "HH:mm")} -{" "}
                        {format(new Date(bt.endDateTime), "HH:mm")}
                        {bt.reason && ` • ${bt.reason}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBlockedTimeMutation.mutate(bt.id)}
                    disabled={deleteBlockedTimeMutation.isPending}
                    data-testid={`button-delete-blocked-${bt.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ban className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">{t("common.noBlockedTimeScheduled")}</p>
              <p className="text-sm text-muted-foreground">
                {t("common.addTimeOffDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
