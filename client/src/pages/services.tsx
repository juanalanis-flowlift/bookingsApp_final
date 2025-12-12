import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Pencil, Trash2, Clock, DollarSign, Tag } from "lucide-react";
import type { Service, Business } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  price: z.coerce.number().min(0, "Price must be positive"),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function Services() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: !!business,
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 30,
      price: 0,
      tags: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const payload = {
        ...data,
        price: String(data.price),
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      return await apiRequest("POST", "/api/services", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Service created successfully" });
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
      toast({ title: "Failed to create service", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceFormValues & { id: string }) => {
      const payload = {
        ...data,
        price: String(data.price),
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      return await apiRequest("PATCH", `/api/services/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({ title: "Service updated successfully" });
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
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setDeleteConfirmId(null);
      toast({ title: "Service deleted successfully" });
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
      toast({ title: "Failed to delete service", variant: "destructive" });
    },
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: parseFloat(service.price),
      tags: service.tags?.join(", ") || "",
      isActive: service.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    form.reset();
  };

  const onSubmit = (data: ServiceFormValues) => {
    if (editingService) {
      updateMutation.mutate({ ...data, id: editingService.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof price === "string" ? parseFloat(price) : price);
  };

  if (isLoading || authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
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
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-services-title">
            {t("services.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("services.subtitle")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setIsDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-service">
              <Plus className="h-4 w-4" />
              {t("services.addService")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? t("services.editService") : t("services.addService")}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("services.name")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Haircut, Massage"
                          {...field}
                          data-testid="input-service-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("services.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your service..."
                          className="resize-none"
                          {...field}
                          data-testid="input-service-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("services.duration")} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            {...field}
                            data-testid="input-service-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("services.price")} ($) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            data-testid="input-service-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("services.tags")} ({t("common.commaSeparated")})</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., haircut, styling, men"
                          {...field}
                          data-testid="input-service-tags"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-base">{t("services.active")}</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Show this service on your booking page
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-service-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    data-testid="button-cancel"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-service"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? t("settings.saving")
                      : editingService
                      ? t("common.edit")
                      : t("services.save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      {services && services.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`relative ${!service.isActive ? "opacity-60" : ""}`}
              data-testid={`service-card-${service.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {!service.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      {t("common.inactive")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatPrice(service.price)}</span>
                  </div>
                </div>

                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {service.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {service.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleEdit(service)}
                    data-testid={`button-edit-service-${service.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("common.edit")}
                  </Button>
                  <Dialog
                    open={deleteConfirmId === service.id}
                    onOpenChange={(open) =>
                      setDeleteConfirmId(open ? service.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        data-testid={`button-delete-service-${service.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{t("services.delete")}</DialogTitle>
                      </DialogHeader>
                      <p className="text-muted-foreground">
                        {t("services.deleteConfirm")}
                      </p>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(service.id)}
                          disabled={deleteMutation.isPending}
                          data-testid="button-confirm-delete"
                        >
                          {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("services.noServices")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("services.noServicesDesc")}
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-service">
              {t("services.addService")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
