import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "en" | "es";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const SPANISH_SPEAKING_COUNTRIES = [
  "ES", "MX", "AR", "CO", "PE", "VE", "CL", "EC", "GT", "CU",
  "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ"
];

export const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.name": "FlowLift",
    "app.tagline": "Smart booking for service businesses",
    
    "nav.dashboard": "Dashboard",
    "nav.services": "Services",
    "nav.bookings": "Bookings",
    "nav.availability": "Availability",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    
    "sidebar.menu": "Menu",
    "sidebar.quickActions": "Quick Actions",
    
    "landing.hero.title": "Smart Booking for",
    "landing.hero.titleHighlight": "Service Businesses",
    "landing.hero.subtitle": "Stop juggling calls and messages. Let your customers book appointments online while you focus on what you do best.",
    "landing.hero.cta": "Get Started Free",
    "landing.hero.learnMore": "Learn More",
    "landing.signIn": "Sign In",
    
    "landing.features.title": "Everything You Need to Manage Bookings",
    "landing.features.subtitle": "Simple, powerful tools designed for small service businesses",
    "landing.features.easyScheduling": "Easy Scheduling",
    "landing.features.easySchedulingDesc": "Let customers book appointments 24/7 with your custom booking page",
    "landing.features.availabilityControl": "Availability Control",
    "landing.features.availabilityControlDesc": "Set your working hours, breaks, and block off time when you're unavailable",
    "landing.features.customerManagement": "Customer Management",
    "landing.features.customerManagementDesc": "Track bookings, customer details, and notes all in one place",
    "landing.features.simpleAnalytics": "Simple Analytics",
    "landing.features.simpleAnalyticsDesc": "See your upcoming bookings and track your business growth",
    
    "landing.benefits.title": "Built for Service Professionals",
    "landing.benefits.subtitle": "Whether you're a barber, hairdresser, massage therapist, or rental business",
    "landing.benefits.noDoubleBookings": "No double bookings",
    "landing.benefits.mobileFriendly": "Mobile-friendly booking page",
    "landing.benefits.instantConfirmations": "Instant booking confirmations",
    "landing.benefits.multipleServices": "Manage multiple services",
    "landing.benefits.customProfile": "Custom business profile",
    "landing.benefits.multiTenant": "Multi-tenant ready",
    
    "landing.cta.title": "Ready to Streamline Your Bookings?",
    "landing.cta.subtitle": "Join businesses that save hours every week with automated scheduling",
    "landing.cta.button": "Start Free Today",
    
    "booking.selectService": "Select a Service",
    "booking.noServices": "No services available at this time.",
    "booking.select": "Select",
    "booking.back": "Back",
    "booking.selectedService": "Selected Service",
    "booking.selectDate": "Select Date",
    "booking.availableTimes": "Available Times",
    "booking.selectDateFirst": "Select a Date First",
    "booking.pleaseSelectDate": "Please select a date to see available times",
    "booking.noSlots": "No available slots for this date",
    "booking.summary": "Booking Summary",
    "booking.yourDetails": "Your Details",
    "booking.name": "Name",
    "booking.email": "Email",
    "booking.phone": "Phone (Optional)",
    "booking.notes": "Notes (Optional)",
    "booking.confirmBooking": "Confirm Booking",
    "booking.processing": "Processing...",
    "booking.confirmed": "Booking Confirmed!",
    "booking.thankYou": "Thank you for booking with",
    "booking.confirmationSent": "A confirmation email has been sent to your email address. You can manage all your bookings from your account.",
    "booking.bookAnother": "Book Another Appointment",
    "booking.viewMyBookings": "View My Bookings",
    "booking.businessNotFound": "Business Not Found",
    "booking.businessNotFoundDesc": "The booking page you're looking for doesn't exist.",
    "booking.step.service": "Service",
    "booking.step.datetime": "Date & Time",
    "booking.step.details": "Details",
    "booking.min": "min",
    "booking.addToCalendar": "Add to Calendar",
    "booking.googleCalendar": "Google Calendar",
    "booking.outlookCalendar": "Outlook",
    "booking.appleCalendar": "Apple Calendar",
    
    "settings.title": "Business Settings",
    "settings.subtitle": "Manage your business profile and public booking page",
    "settings.businessInfo": "Business Information",
    "settings.businessName": "Business Name",
    "settings.category": "Category",
    "settings.selectCategory": "Select a category",
    "settings.bookingPageUrl": "Booking Page URL",
    "settings.urlDescription": "This is the URL where customers will book your services",
    "settings.description": "Description",
    "settings.descriptionPlaceholder": "Tell customers about your business...",
    "settings.location": "Location",
    "settings.address": "Address",
    "settings.city": "City",
    "settings.country": "Country",
    "settings.contact": "Contact",
    "settings.phone": "Phone",
    "settings.email": "Email",
    "settings.previewBooking": "Preview Booking Page",
    "settings.save": "Update",
    "settings.create": "Create Business",
    "settings.saving": "Saving...",
    "settings.changeLogo": "Change Logo",
    "settings.uploading": "Uploading...",
    "settings.urlCopied": "Booking URL copied!",
    "settings.profileSaved": "Business profile saved",
    "settings.logoUpdated": "Logo updated successfully",
    "settings.language": "Language",
    "settings.languageDescription": "Select your preferred language for the app and email notifications",
    "settings.preferences": "Preferences",
    
    "services.title": "Services",
    "services.subtitle": "Manage the services you offer to customers",
    "services.addService": "Add Service",
    "services.editService": "Edit Service",
    "services.noServices": "No services yet",
    "services.noServicesDesc": "Add your first service to start accepting bookings",
    "services.name": "Service Name",
    "services.description": "Description",
    "services.duration": "Duration (minutes)",
    "services.price": "Price",
    "services.tags": "Tags",
    "services.tagsPlaceholder": "Add tags (comma separated)",
    "services.active": "Active",
    "services.save": "Save Service",
    "services.cancel": "Cancel",
    "services.delete": "Delete",
    "services.deleteConfirm": "Are you sure you want to delete this service?",
    
    "bookings.title": "Bookings",
    "bookings.subtitle": "View and manage your customer appointments",
    "bookings.noBookings": "No bookings yet",
    "bookings.noBookingsDesc": "When customers book appointments, they will appear here",
    "bookings.calendar": "Calendar",
    "bookings.list": "List",
    "bookings.upcoming": "Upcoming",
    "bookings.past": "Past",
    "bookings.all": "All",
    "bookings.pending": "Pending",
    "bookings.confirmed": "Confirmed",
    "bookings.cancelled": "Cancelled",
    "bookings.confirm": "Confirm",
    "bookings.cancel": "Cancel",
    "bookings.customerNotes": "Customer Notes",
    "bookings.internalNotes": "Internal Notes",
    
    "availability.title": "Availability",
    "availability.subtitle": "Set your working hours and manage time slots",
    "availability.workingHours": "Working Hours",
    "availability.closed": "Closed",
    "availability.open": "Open",
    "availability.startTime": "Start Time",
    "availability.endTime": "End Time",
    "availability.slotDuration": "Slot Duration",
    "availability.maxPerSlot": "Max Bookings Per Slot",
    "availability.save": "Save Availability",
    "availability.saved": "Availability saved successfully",
    
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back",
    "dashboard.todayBookings": "Today's Bookings",
    "dashboard.upcomingBookings": "Upcoming Bookings",
    "dashboard.totalServices": "Total Services",
    "dashboard.recentBookings": "Recent Bookings",
    "dashboard.viewAll": "View All",
    "dashboard.noBookingsToday": "No bookings scheduled for today",
    "dashboard.setupBusiness": "Set up your business",
    "dashboard.setupBusinessDesc": "Complete your business profile to start accepting bookings",
    "dashboard.goToSettings": "Go to Settings",
    
    "myBookings.title": "My Bookings",
    "myBookings.subtitle": "View and manage your appointments",
    "myBookings.enterEmail": "Enter your email to view bookings",
    "myBookings.email": "Email Address",
    "myBookings.sendLink": "Send Magic Link",
    "myBookings.linkSent": "Check your email for the login link",
    "myBookings.noBookings": "No bookings found",
    "myBookings.noBookingsDesc": "Book an appointment with a business to see it here",
    
    "days.sunday": "Sunday",
    "days.monday": "Monday",
    "days.tuesday": "Tuesday",
    "days.wednesday": "Wednesday",
    "days.thursday": "Thursday",
    "days.friday": "Friday",
    "days.saturday": "Saturday",
    
    "categories.barber": "Barber Shop",
    "categories.hairdresser": "Hair Salon",
    "categories.beauty_salon": "Beauty Salon",
    "categories.spa": "Spa & Wellness",
    "categories.massage": "Massage Therapy",
    "categories.nail_salon": "Nail Salon",
    "categories.inflatable_rentals": "Inflatable Rentals",
    "categories.party_services": "Party Services",
    "categories.photography": "Photography",
    "categories.fitness": "Fitness & Training",
    "categories.consulting": "Consulting",
    "categories.other": "Other Services",
    
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.required": "Required",
    "common.optional": "Optional",
    "common.unauthorized": "Unauthorized",
    "common.loggingIn": "You are logged out. Logging in again...",
    "common.failedToSave": "Failed to save",
    "common.confirmed": "Confirmed",
    "common.pending": "Pending",
    "common.cancelled": "Cancelled",
    "common.status": "Status",
    "common.actions": "Actions",
    "common.inactive": "Inactive",
    "common.deleting": "Deleting...",
    "common.blockedTime": "Blocked Time",
    "common.addBlockedTime": "Add Blocked Time",
    "common.blockTimeOff": "Block Time Off",
    "common.noBlockedTimeScheduled": "No blocked time scheduled",
    "common.addTimeOffDescription": "Add time off for holidays, vacations, or breaks",
    "common.commaSeparated": "comma-separated",
    
    "booking.selectDateTime": "Date & Time",
    
    "dashboard.scheduledAppointments": "Scheduled appointments",
    "dashboard.last30Days": "Last 30 Days",
    "dashboard.totalBookings": "Total bookings",
    "dashboard.activeServices": "Active Services",
    "dashboard.availableForBooking": "Available for booking",
    "dashboard.noUpcomingBookings": "No upcoming bookings",
    "dashboard.shareYourBookingPage": "Share your booking page to start receiving appointments",
    "dashboard.welcomeNewBusiness": "Welcome to FlowLift",
    "dashboard.setupNewBusiness": "Let's set up your business profile to start accepting bookings.",
    "dashboard.setupButton": "Set Up Your Business",
    "dashboard.viewBookingPage": "View Booking Page",
    
    "settings.yourBusiness": "Your Business",
    "settings.businessNamePlaceholder": "Your Business Name",
    "settings.setupFirst": "Please set up your business profile first.",
    
    "email.bookingConfirmed": "Booking Confirmed",
    "email.appointmentScheduled": "Your appointment has been scheduled",
    "email.date": "Date",
    "email.time": "Time",
    "email.duration": "Duration",
    "email.price": "Price",
    "email.minutes": "minutes",
    "email.businessDetails": "Business Details",
    "email.needChanges": "Need to make changes? Contact {businessName} directly.",
    "email.poweredBy": "Powered by FlowLift",
  },
  es: {
    "app.name": "FlowLift",
    "app.tagline": "Reservas inteligentes para negocios de servicios",
    
    "nav.dashboard": "Panel",
    "nav.services": "Servicios",
    "nav.bookings": "Reservas",
    "nav.availability": "Disponibilidad",
    "nav.settings": "Configuración",
    "nav.logout": "Cerrar sesión",
    
    "sidebar.menu": "Menú",
    "sidebar.quickActions": "Acciones Rápidas",
    
    "landing.hero.title": "Reservas Inteligentes para",
    "landing.hero.titleHighlight": "Negocios de Servicios",
    "landing.hero.subtitle": "Deja de hacer malabares con llamadas y mensajes. Permite que tus clientes reserven citas en línea mientras te enfocas en lo que mejor haces.",
    "landing.hero.cta": "Comenzar Gratis",
    "landing.hero.learnMore": "Más Información",
    "landing.signIn": "Iniciar Sesión",
    
    "landing.features.title": "Todo lo que Necesitas para Gestionar Reservas",
    "landing.features.subtitle": "Herramientas simples y poderosas diseñadas para pequeños negocios de servicios",
    "landing.features.easyScheduling": "Programación Fácil",
    "landing.features.easySchedulingDesc": "Permite que los clientes reserven citas las 24 horas con tu página de reservas personalizada",
    "landing.features.availabilityControl": "Control de Disponibilidad",
    "landing.features.availabilityControlDesc": "Configura tus horarios de trabajo, descansos y bloquea tiempo cuando no estés disponible",
    "landing.features.customerManagement": "Gestión de Clientes",
    "landing.features.customerManagementDesc": "Rastrea reservas, detalles de clientes y notas en un solo lugar",
    "landing.features.simpleAnalytics": "Analíticas Simples",
    "landing.features.simpleAnalyticsDesc": "Ve tus próximas reservas y rastrea el crecimiento de tu negocio",
    
    "landing.benefits.title": "Creado para Profesionales de Servicios",
    "landing.benefits.subtitle": "Ya seas barbero, estilista, masajista o negocio de renta",
    "landing.benefits.noDoubleBookings": "Sin reservas dobles",
    "landing.benefits.mobileFriendly": "Página de reservas optimizada para móvil",
    "landing.benefits.instantConfirmations": "Confirmaciones instantáneas",
    "landing.benefits.multipleServices": "Gestiona múltiples servicios",
    "landing.benefits.customProfile": "Perfil de negocio personalizado",
    "landing.benefits.multiTenant": "Listo para múltiples negocios",
    
    "landing.cta.title": "¿Listo para Optimizar tus Reservas?",
    "landing.cta.subtitle": "Únete a negocios que ahorran horas cada semana con programación automatizada",
    "landing.cta.button": "Comenzar Gratis Hoy",
    
    "booking.selectService": "Selecciona un Servicio",
    "booking.noServices": "No hay servicios disponibles en este momento.",
    "booking.select": "Seleccionar",
    "booking.back": "Atrás",
    "booking.selectedService": "Servicio Seleccionado",
    "booking.selectDate": "Seleccionar Fecha",
    "booking.availableTimes": "Horarios Disponibles",
    "booking.selectDateFirst": "Selecciona una Fecha Primero",
    "booking.pleaseSelectDate": "Por favor selecciona una fecha para ver horarios disponibles",
    "booking.noSlots": "No hay horarios disponibles para esta fecha",
    "booking.summary": "Resumen de Reserva",
    "booking.yourDetails": "Tus Datos",
    "booking.name": "Nombre",
    "booking.email": "Correo Electrónico",
    "booking.phone": "Teléfono (Opcional)",
    "booking.notes": "Notas (Opcional)",
    "booking.confirmBooking": "Confirmar Reserva",
    "booking.processing": "Procesando...",
    "booking.confirmed": "¡Reserva Confirmada!",
    "booking.thankYou": "Gracias por reservar con",
    "booking.confirmationSent": "Se ha enviado un correo de confirmación a tu dirección de correo. Puedes gestionar todas tus reservas desde tu cuenta.",
    "booking.bookAnother": "Reservar Otra Cita",
    "booking.viewMyBookings": "Ver Mis Reservas",
    "booking.businessNotFound": "Negocio No Encontrado",
    "booking.businessNotFoundDesc": "La página de reservas que buscas no existe.",
    "booking.step.service": "Servicio",
    "booking.step.datetime": "Fecha y Hora",
    "booking.step.details": "Detalles",
    "booking.min": "min",
    "booking.addToCalendar": "Agregar al Calendario",
    "booking.googleCalendar": "Google Calendar",
    "booking.outlookCalendar": "Outlook",
    "booking.appleCalendar": "Apple Calendar",
    
    "settings.title": "Configuración del Negocio",
    "settings.subtitle": "Administra tu perfil de negocio y página de reservas",
    "settings.businessInfo": "Información del Negocio",
    "settings.businessName": "Nombre del Negocio",
    "settings.category": "Categoría",
    "settings.selectCategory": "Selecciona una categoría",
    "settings.bookingPageUrl": "URL de Página de Reservas",
    "settings.urlDescription": "Esta es la URL donde los clientes reservarán tus servicios",
    "settings.description": "Descripción",
    "settings.descriptionPlaceholder": "Cuéntale a los clientes sobre tu negocio...",
    "settings.location": "Ubicación",
    "settings.address": "Dirección",
    "settings.city": "Ciudad",
    "settings.country": "País",
    "settings.contact": "Contacto",
    "settings.phone": "Teléfono",
    "settings.email": "Correo Electrónico",
    "settings.previewBooking": "Vista Previa de Reservas",
    "settings.save": "Actualizar",
    "settings.create": "Crear Negocio",
    "settings.saving": "Guardando...",
    "settings.changeLogo": "Cambiar Logo",
    "settings.uploading": "Subiendo...",
    "settings.urlCopied": "¡URL de reservas copiada!",
    "settings.profileSaved": "Perfil de negocio guardado",
    "settings.logoUpdated": "Logo actualizado exitosamente",
    "settings.language": "Idioma",
    "settings.languageDescription": "Selecciona tu idioma preferido para la app y notificaciones por correo",
    "settings.preferences": "Preferencias",
    
    "services.title": "Servicios",
    "services.subtitle": "Administra los servicios que ofreces a los clientes",
    "services.addService": "Agregar Servicio",
    "services.editService": "Editar Servicio",
    "services.noServices": "Sin servicios aún",
    "services.noServicesDesc": "Agrega tu primer servicio para comenzar a aceptar reservas",
    "services.name": "Nombre del Servicio",
    "services.description": "Descripción",
    "services.duration": "Duración (minutos)",
    "services.price": "Precio",
    "services.tags": "Etiquetas",
    "services.tagsPlaceholder": "Agregar etiquetas (separadas por coma)",
    "services.active": "Activo",
    "services.save": "Guardar Servicio",
    "services.cancel": "Cancelar",
    "services.delete": "Eliminar",
    "services.deleteConfirm": "¿Estás seguro de que quieres eliminar este servicio?",
    
    "bookings.title": "Reservas",
    "bookings.subtitle": "Ve y gestiona las citas de tus clientes",
    "bookings.noBookings": "Sin reservas aún",
    "bookings.noBookingsDesc": "Cuando los clientes reserven citas, aparecerán aquí",
    "bookings.calendar": "Calendario",
    "bookings.list": "Lista",
    "bookings.upcoming": "Próximas",
    "bookings.past": "Pasadas",
    "bookings.all": "Todas",
    "bookings.pending": "Pendiente",
    "bookings.confirmed": "Confirmada",
    "bookings.cancelled": "Cancelada",
    "bookings.confirm": "Confirmar",
    "bookings.cancel": "Cancelar",
    "bookings.customerNotes": "Notas del Cliente",
    "bookings.internalNotes": "Notas Internas",
    
    "availability.title": "Disponibilidad",
    "availability.subtitle": "Configura tus horarios de trabajo y gestiona franjas horarias",
    "availability.workingHours": "Horarios de Trabajo",
    "availability.closed": "Cerrado",
    "availability.open": "Abierto",
    "availability.startTime": "Hora de Inicio",
    "availability.endTime": "Hora de Fin",
    "availability.slotDuration": "Duración de Franja",
    "availability.maxPerSlot": "Máximo de Reservas por Franja",
    "availability.save": "Guardar Disponibilidad",
    "availability.saved": "Disponibilidad guardada exitosamente",
    
    "dashboard.title": "Panel",
    "dashboard.welcome": "Bienvenido de nuevo",
    "dashboard.todayBookings": "Reservas de Hoy",
    "dashboard.upcomingBookings": "Próximas Reservas",
    "dashboard.totalServices": "Total de Servicios",
    "dashboard.recentBookings": "Reservas Recientes",
    "dashboard.viewAll": "Ver Todo",
    "dashboard.noBookingsToday": "No hay reservas programadas para hoy",
    "dashboard.setupBusiness": "Configura tu negocio",
    "dashboard.setupBusinessDesc": "Completa tu perfil de negocio para comenzar a aceptar reservas",
    "dashboard.goToSettings": "Ir a Configuración",
    
    "myBookings.title": "Mis Reservas",
    "myBookings.subtitle": "Ve y gestiona tus citas",
    "myBookings.enterEmail": "Ingresa tu correo para ver reservas",
    "myBookings.email": "Correo Electrónico",
    "myBookings.sendLink": "Enviar Enlace Mágico",
    "myBookings.linkSent": "Revisa tu correo para el enlace de acceso",
    "myBookings.noBookings": "No se encontraron reservas",
    "myBookings.noBookingsDesc": "Reserva una cita con un negocio para verla aquí",
    
    "days.sunday": "Domingo",
    "days.monday": "Lunes",
    "days.tuesday": "Martes",
    "days.wednesday": "Miércoles",
    "days.thursday": "Jueves",
    "days.friday": "Viernes",
    "days.saturday": "Sábado",
    
    "categories.barber": "Barbería",
    "categories.hairdresser": "Salón de Belleza",
    "categories.beauty_salon": "Salón de Belleza",
    "categories.spa": "Spa y Bienestar",
    "categories.massage": "Terapia de Masaje",
    "categories.nail_salon": "Salón de Uñas",
    "categories.inflatable_rentals": "Renta de Inflables",
    "categories.party_services": "Servicios para Fiestas",
    "categories.photography": "Fotografía",
    "categories.fitness": "Fitness y Entrenamiento",
    "categories.consulting": "Consultoría",
    "categories.other": "Otros Servicios",
    
    "common.loading": "Cargando...",
    "common.error": "Ocurrió un error",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.add": "Agregar",
    "common.search": "Buscar",
    "common.filter": "Filtrar",
    "common.required": "Requerido",
    "common.optional": "Opcional",
    "common.unauthorized": "No autorizado",
    "common.loggingIn": "Has cerrado sesión. Iniciando sesión de nuevo...",
    "common.failedToSave": "Error al guardar",
    "common.confirmed": "Confirmado",
    "common.pending": "Pendiente",
    "common.cancelled": "Cancelado",
    "common.status": "Estado",
    "common.actions": "Acciones",
    "common.inactive": "Inactivo",
    "common.deleting": "Eliminando...",
    "common.blockedTime": "Tiempo Bloqueado",
    "common.addBlockedTime": "Agregar Tiempo Bloqueado",
    "common.blockTimeOff": "Bloquear Tiempo Libre",
    "common.noBlockedTimeScheduled": "Sin tiempo bloqueado programado",
    "common.addTimeOffDescription": "Agrega tiempo libre para vacaciones, días festivos o descansos",
    "common.commaSeparated": "separadas por coma",
    
    "booking.selectDateTime": "Fecha y Hora",
    
    "dashboard.scheduledAppointments": "Citas programadas",
    "dashboard.last30Days": "Últimos 30 Días",
    "dashboard.totalBookings": "Total de reservas",
    "dashboard.activeServices": "Servicios Activos",
    "dashboard.availableForBooking": "Disponibles para reservar",
    "dashboard.noUpcomingBookings": "No hay próximas reservas",
    "dashboard.shareYourBookingPage": "Comparte tu página de reservas para comenzar a recibir citas",
    "dashboard.welcomeNewBusiness": "Bienvenido a FlowLift",
    "dashboard.setupNewBusiness": "Vamos a configurar tu perfil de negocio para comenzar a aceptar reservas.",
    "dashboard.setupButton": "Configurar tu Negocio",
    "dashboard.viewBookingPage": "Ver Página de Reservas",
    
    "settings.yourBusiness": "Tu Negocio",
    "settings.businessNamePlaceholder": "Nombre de tu Negocio",
    "settings.setupFirst": "Por favor, configura tu perfil de negocio primero.",
    
    "email.bookingConfirmed": "Reserva Confirmada",
    "email.appointmentScheduled": "Tu cita ha sido programada",
    "email.date": "Fecha",
    "email.time": "Hora",
    "email.duration": "Duración",
    "email.price": "Precio",
    "email.minutes": "minutos",
    "email.businessDetails": "Detalles del Negocio",
    "email.needChanges": "¿Necesitas hacer cambios? Contacta a {businessName} directamente.",
    "email.poweredBy": "Desarrollado por FlowLift",
  },
};

async function detectUserCountry(): Promise<string | null> {
  try {
    const response = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const data = await response.json();
      return data.country_code || null;
    }
  } catch {
    // Fallback silently
  }
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("flowlift-language");
    if (saved === "en" || saved === "es") return saved;
    return "en";
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initLanguage = async () => {
      const saved = localStorage.getItem("flowlift-language");
      if (saved) {
        setInitialized(true);
        return;
      }

      const country = await detectUserCountry();
      if (country && SPANISH_SPEAKING_COUNTRIES.includes(country)) {
        setLanguageState("es");
        localStorage.setItem("flowlift-language", "es");
      }
      setInitialized(true);
    };

    initLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("flowlift-language", lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function LanguageSwitcher({ minimal = false }: { minimal?: boolean }) {
  const { language, setLanguage } = useI18n();

  if (minimal) {
    return (
      <button
        onClick={() => setLanguage(language === "en" ? "es" : "en")}
        className="px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-language-switch"
        aria-label={language === "en" ? "Switch to Spanish" : "Switch to English"}
      >
        {language === "en" ? "ES" : "EN"}
      </button>
    );
  }

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-md">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
          language === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="button-language-en"
      >
        English
      </button>
      <button
        onClick={() => setLanguage("es")}
        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
          language === "es"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        data-testid="button-language-es"
      >
        Español
      </button>
    </div>
  );
}
