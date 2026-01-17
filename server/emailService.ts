import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import type { Booking, Service, Business } from "@shared/schema";

type Language = "en" | "es";

// Resend integration via Replit Connectors API
interface ResendConnectionSettings {
  settings: {
    api_key: string;
    from_email?: string;
  };
}

async function getResendCredentials(): Promise<{ apiKey: string; fromEmail: string } | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) {
      console.log("[email] Resend: REPLIT_CONNECTORS_HOSTNAME not available");
      return null;
    }

    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      console.log("[email] Resend: No auth token available (REPL_IDENTITY or WEB_REPL_RENEWAL)");
      return null;
    }

    console.log("[email] Resend: Fetching credentials from connector...");
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    if (!response.ok) {
      console.log(`[email] Resend: Failed to fetch credentials, status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const connectionSettings: ResendConnectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.api_key) {
      console.log("[email] Resend: No API key found in connection settings");
      return null;
    }

    console.log(`[email] Resend: Credentials loaded, fromEmail: ${connectionSettings.settings.from_email || "noreply@flowlift.app"}`);
    return {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email || "noreply@flowlift.app"
    };
  } catch (error) {
    console.log("[email] Resend connector error:", error);
    return null;
  }
}

async function getResendClient(): Promise<{ client: Resend; fromEmail: string } | null> {
  const credentials = await getResendCredentials();
  if (!credentials) {
    return null;
  }
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

// FlowLift logo as base64 data URI for reliable email display
const FLOWLIFT_LOGO_DATA_URI = "data:image/png;base64,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";

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "noreply@flowlift.app";

  if (!host || !port || !user || !pass) {
    return null;
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: { user, pass },
    from,
  };
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const config = getEmailConfig();
  if (!config) {
    console.log("Email service not configured - emails will be logged only");
    return null;
  }

  console.log(`Email service configured: host=${config.host}, port=${config.port}, secure=${config.secure}, user=${config.auth.user}, from=${config.from}`);

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return transporter;
}

export async function verifyEmailConnection(): Promise<{ success: boolean; error?: string; config?: { host: string; port: number; user: string; from: string } }> {
  const config = getEmailConfig();
  
  if (!config) {
    return { 
      success: false, 
      error: "Email not configured. Missing SMTP_HOST, SMTP_PORT, SMTP_USER, or SMTP_PASS environment variables." 
    };
  }

  const testTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  try {
    await testTransporter.verify();
    return { 
      success: true,
      config: { host: config.host, port: config.port, user: config.auth.user, from: config.from }
    };
  } catch (error: any) {
    console.error("SMTP verification failed:", error);
    return { 
      success: false, 
      error: error.message || "Failed to connect to SMTP server",
      config: { host: config.host, port: config.port, user: config.auth.user, from: config.from }
    };
  }
}

const emailTranslations: Record<Language, Record<string, string>> = {
  en: {
    reservationConfirmed: "Your reservation is confirmed",
    youreGoingTo: "You're going to",
    address: "Address",
    guests: "Guests",
    addToCalendar: "Add to Calendar",
    bookAnotherAppointment: "Book Another Appointment",
    viewMyBookings: "View My Bookings",
    localRequirement: "Local Requirement",
    changeReservation: "Change reservation",
    cancelReservation: "Cancel reservation",
    sentWithLove: "Sent with",
    withFlowlift: "with flowlift",
    signUpFree: "Sign up for free",
    bookingConfirmed: "Booking Confirmed",
    appointmentScheduled: "Your appointment has been scheduled",
    date: "Date",
    time: "Time",
    duration: "Duration",
    price: "Price",
    minutes: "minutes",
    businessDetails: "Business Details",
    poweredBy: "Powered by FlowLift",
    newBooking: "New Booking",
    newAppointment: "You have a new appointment",
    customerDetails: "Customer Details",
    customerNotes: "Customer Notes",
    loginDashboard: "Log in to your FlowLift dashboard to manage this booking.",
    signInFlowLift: "Sign in to FlowLift",
    clickToAccess: "Click the button below to access your bookings",
    linkExpires: "This link will expire in 1 hour. If you didn't request this email, you can safely ignore it.",
    buttonNotWork: "If the button doesn't work, copy and paste this link into your browser:",
    modificationRequested: "Booking Modification Requested",
    modificationRequestDesc: "{businessName} has requested to modify your appointment",
    currentAppointment: "Current Appointment",
    proposedNewTime: "Proposed New Time",
    modificationReason: "Reason for Change",
    confirmModification: "Confirm Modification",
    modificationExpires: "Please respond within 48 hours. If you don't confirm, the original appointment will remain unchanged.",
    manageBooking: "MANAGE YOUR BOOKING",
    modifyBooking: "Modify Booking",
    cancelBooking: "Cancel Booking",
    termsAndConditions: "Terms & Conditions",
    contact: "Contact",
    phone: "Phone",
  },
  es: {
    reservationConfirmed: "Tu reservación está confirmada",
    youreGoingTo: "Vas a",
    address: "Dirección",
    guests: "Invitados",
    addToCalendar: "Agregar al Calendario",
    bookAnotherAppointment: "Reservar Otra Cita",
    viewMyBookings: "Ver Mis Reservaciones",
    localRequirement: "Requisito Local",
    changeReservation: "Cambiar reservación",
    cancelReservation: "Cancelar reservación",
    sentWithLove: "Enviado con",
    withFlowlift: "con flowlift",
    signUpFree: "Regístrate gratis",
    bookingConfirmed: "Reservación Confirmada",
    appointmentScheduled: "Tu cita ha sido programada",
    date: "Fecha",
    time: "Hora",
    duration: "Duración",
    price: "Precio",
    minutes: "minutos",
    businessDetails: "Detalles del Negocio",
    poweredBy: "Desarrollado por FlowLift",
    newBooking: "Nueva Reservación",
    newAppointment: "Tienes una nueva cita",
    customerDetails: "Detalles del Cliente",
    customerNotes: "Notas del Cliente",
    loginDashboard: "Inicia sesión en tu panel de FlowLift para gestionar esta reservación.",
    signInFlowLift: "Inicia sesión en FlowLift",
    clickToAccess: "Haz clic en el botón de abajo para acceder a tus reservaciones",
    linkExpires: "Este enlace expirará en 1 hora. Si no solicitaste este correo, puedes ignorarlo con seguridad.",
    buttonNotWork: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    modificationRequested: "Solicitud de Modificación de Reservación",
    modificationRequestDesc: "{businessName} ha solicitado modificar tu cita",
    currentAppointment: "Cita Actual",
    proposedNewTime: "Nueva Hora Propuesta",
    modificationReason: "Razón del Cambio",
    confirmModification: "Confirmar Modificación",
    modificationExpires: "Por favor responde en un plazo de 48 horas. Si no confirmas, la cita original permanecerá sin cambios.",
    manageBooking: "GESTIONAR TU RESERVACIÓN",
    modifyBooking: "Modificar Reservación",
    cancelBooking: "Cancelar Reservación",
    termsAndConditions: "Términos y Condiciones",
    contact: "Contacto",
    phone: "Teléfono",
  },
};

function getEmailText(key: string, lang: Language, params?: Record<string, string>): string {
  let text = emailTranslations[lang][key] || emailTranslations.en[key] || key;
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, value);
    });
  }
  return text;
}

function formatDate(date: Date | string | undefined | null, lang: Language = "en"): string {
  if (!date) return lang === "es" ? "Fecha no disponible" : "Date not available";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return String(date).split('T')[0];
    }
    return d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(date).split('T')[0];
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatDateShort(date: Date | string | undefined | null, lang: Language = "en"): { day: string; fullDate: string } {
  if (!date) return { day: "", fullDate: "" };
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return { day: "", fullDate: String(date) };
    }
    const day = d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { weekday: "long" });
    const fullDate = d.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { day, fullDate };
  } catch {
    return { day: "", fullDate: String(date) };
  }
}

interface CalendarLinks {
  google: string;
  outlook: string;
  apple: string;
}

function generateCalendarLinks(
  booking: Booking & { customerActionToken?: string | null },
  service: Service,
  business: Business,
  baseUrl: string
): CalendarLinks {
  const bookingDate = new Date(booking.bookingDate);
  const [startHour, startMin] = booking.startTime.split(":").map(Number);
  const [endHour, endMin] = booking.endTime.split(":").map(Number);

  const startDateTime = new Date(bookingDate);
  startDateTime.setHours(startHour, startMin, 0, 0);
  
  const endDateTime = new Date(bookingDate);
  endDateTime.setHours(endHour, endMin, 0, 0);

  const formatForGoogle = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const formatForOutlook = (d: Date) => d.toISOString();

  const title = encodeURIComponent(`${service.name} at ${business.name}`);
  const location = encodeURIComponent(business.address || "");
  const description = encodeURIComponent(`Booking for ${service.name}\nDuration: ${service.duration} minutes`);

  const googleStart = formatForGoogle(startDateTime);
  const googleEnd = formatForGoogle(endDateTime);
  const googleLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${googleStart}/${googleEnd}&location=${location}&details=${description}`;

  const outlookStart = formatForOutlook(startDateTime);
  const outlookEnd = formatForOutlook(endDateTime);
  const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${outlookStart}&enddt=${outlookEnd}&location=${location}&body=${description}`;

  // Apple Calendar requires the customer action token for security
  const appleLink = booking.customerActionToken 
    ? `${baseUrl}/api/calendar/ics/${booking.id}?token=${booking.customerActionToken}`
    : "";

  return {
    google: googleLink,
    outlook: outlookLink,
    apple: appleLink,
  };
}

interface BookingEmailData {
  booking: Booking;
  service: Service;
  business: Business;
  language?: Language;
  baseUrl?: string;
}

function generateCustomerConfirmationHtml(data: BookingEmailData): string {
  const { booking, service, business, language = "en", baseUrl = "" } = data;
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, language, params);

  const customerActionToken = (booking as any).customerActionToken;
  const cancelUrl = customerActionToken ? `${baseUrl}/customer-cancel?token=${customerActionToken}` : "";
  const modifyUrl = customerActionToken ? `${baseUrl}/customer-modify?token=${customerActionToken}` : "";
  const bookingPageUrl = `${baseUrl}/book/${business.slug}`;
  
  const calendarLinks = generateCalendarLinks(booking, service, business, baseUrl);
  const dateInfo = formatDateShort(booking.bookingDate, language);
  const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
  
  // Convert relative URLs to absolute URLs for email compatibility
  const getAbsoluteUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  
  const businessLogoUrl = getAbsoluteUrl(business.logoUrl);
  const businessCoverUrl = getAbsoluteUrl(business.coverImageUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("reservationConfirmed")}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; color: #18181b;">
  <div style="max-width: 500px; margin: 0 auto; padding: 24px 16px;">
    
    <!-- FlowLift Logo -->
    <div style="margin-bottom: 24px;">
      <img src="${FLOWLIFT_LOGO_DATA_URI}" alt="flowlift" style="height: 32px; width: auto; display: block;" />
    </div>
    
    <!-- Main Title -->
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #18181b;">${t("reservationConfirmed")}</h1>
    
    ${businessCoverUrl ? `
    <!-- Cover Image -->
    <div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden;">
      <img src="${escapeHtml(businessCoverUrl)}" alt="${escapeHtml(business.name)}" style="width: 100%; height: auto; display: block; max-height: 200px; object-fit: cover;" />
    </div>
    ` : ""}
    
    <!-- Business Name & Logo -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">${escapeHtml(business.name)}</p>
      ${businessLogoUrl ? `
      <img src="${escapeHtml(businessLogoUrl)}" alt="${escapeHtml(business.name)} logo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
      ` : ""}
    </div>
    
    <!-- Appointment Date/Time -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #18181b;">${escapeHtml(service.name)}</p>
      <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #18181b;">${escapeHtml(dateInfo.day)},</p>
      <p style="margin: 0 0 4px; font-size: 16px; color: #18181b;">${escapeHtml(dateInfo.fullDate)}</p>
      <p style="margin: 0; font-size: 14px; color: #71717a;">Your appointment is at: ${escapeHtml(timeRange)}</p>
    </div>
    
    ${business.address || business.city || business.country ? `
    <!-- Address -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #71717a;">${t("address")}</p>
      ${business.address ? `<p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.5;">${escapeHtml(business.address)}</p>` : ""}
      ${business.city ? `<p style="margin: 4px 0 0; font-size: 14px; color: #18181b;">${escapeHtml(business.city)}</p>` : ""}
      ${business.country ? `<p style="margin: 4px 0 0; font-size: 14px; color: #18181b;">${escapeHtml(business.country)}</p>` : ""}
    </div>
    ` : ""}
    
    ${business.phone || business.email || business.socialFacebook || business.socialInstagram || business.socialTwitter || business.socialLinkedin || business.socialYoutube || business.socialTiktok || business.socialWhatsapp ? `
    <!-- Contact -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #71717a;">${t("contact")}</p>
      ${business.phone ? `<p style="margin: 0 0 4px; font-size: 14px; color: #18181b;"><a href="tel:${escapeHtml(business.phone)}" style="color: #18181b; text-decoration: none;">${escapeHtml(business.phone)}</a></p>` : ""}
      ${business.email ? `<p style="margin: 0 0 12px; font-size: 14px; color: #18181b;"><a href="mailto:${escapeHtml(business.email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(business.email)}</a></p>` : ""}
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${business.socialFacebook ? `<a href="https://facebook.com/${escapeHtml(business.socialFacebook)}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMTg3N0YyIiBkPSJNMjQgMTJjMC02LjYyNy01LjM3My0xMi0xMi0xMlMwIDUuMzczIDAgMTJjMCA1Ljk5IDQuMzg4IDEwLjk1NCAxMC4xMjUgMTEuODU0di04LjM4NUg3LjA3OFYxMmgzLjA0N1Y5LjM1NmMwLTMuMDA3IDEuNzkyLTQuNjY4IDQuNTMzLTQuNjY4IDEuMzEyIDAgMi42ODYuMjM0IDIuNjg2LjIzNHYyLjk1M0gxNS44M2MtMS40OTEgMC0xLjk1Ni45MjYtMS45NTYgMS44NzRWMTJoMy4zMjhsLS41MzIgMy40NjloLTIuNzk2djguMzg1QzE5LjYxMiAyMi45NTQgMjQgMTcuOTkgMjQgMTJ6Ii8+PC9zdmc+" alt="Facebook" style="width: 28px; height: 28px;" /></a>` : ""}
        ${business.socialInstagram ? `<a href="https://instagram.com/${escapeHtml(business.socialInstagram)}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9Imluc3RhR3JhZCIgeDE9IjAlIiB5MT0iMTAwJSIgeDI9IjEwMCUiIHkyPSIwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZGREMwMCIvPjxzdG9wIG9mZnNldD0iMjUlIiBzdG9wLWNvbG9yPSIjRkQ1OTQ5Ii8+PHN0b3Agb2Zmc2V0PSI1MCUiIiBzdG9wLWNvbG9yPSIjRDYyNDlGIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjODg1QUNGIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNpbnN0YUdyYWQpIiBkPSJNMTIgMi4xNjNjMy4yMDQgMCAzLjU4NC4wMTIgNC44NS4wNyAzLjI1Mi4xNDggNC43NzEgMS42OTEgNC45MTkgNC45MTkuMDU4IDEuMjY1LjA2OSAxLjY0NS4wNjkgNC44NDkgMCAzLjIwNS0uMDEyIDMuNTg0LS4wNjkgNC44NDktLjE0OSAzLjIyNS0xLjY2NCA0Ljc3MS00LjkxOSA0LjkxOS0xLjI2Ni4wNTgtMS42NDQuMDctNC44NS4wNy0zLjIwNCAwLTMuNTg0LS4wMTItNC44NDktLjA3LTMuMjYtLjE0OS00Ljc3MS0xLjY5OS00LjkxOS00LjkyLS4wNTgtMS4yNjUtLjA3LTEuNjQ0LS4wNy00Ljg0OSAwLTMuMjA0LjAxMy0zLjU4My4wNy00Ljg0OS4xNDktMy4yMjcgMS42NjQtNC43NzEgNC45MTktNC45MTkgMS4yNjYtLjA1NyAxLjY0NS0uMDY5IDQuODQ5LS4wNjl6TTEyIDBoLTIuMDU2Yy0yLjc0NSAwLTMuMDk0LjAxLTQuMTc0LjA2Ni00LjcyOC4yMTQtNy4yMjIgMi42OTctNy40MzYgNy40MzZDLjI3NCA4LjEzLjI2NCA4LjQ3OS4yNjQgMTFjMCAyLjUyMS4wMSAyLjg3LjA2NiAzLjk1LjIxNCA0LjczOCAyLjcwOCA3LjIyMiA3LjQzNiA3LjQzNiAxLjA4LjA1NSAxLjQyOS4wNjUgNEIuOTUuMDY1IDIuNTIgMCAyLjg3LS4wMSAzLjk1LS4wNjYgNC43MjktLjIxMyA3LjIyMi0yLjY5OCA3LjQzNy03LjQzNi4wNTYtMS4wOC4wNjYtMS40MjkuMDY2LTMuOTUgMC0yLjUyMS0uMDEtMi44Ny0uMDY2LTMuOTQ5LS4yMTUtNC43MzgtMi43MDgtNy4yMjItNy40MzctNy40MzZDMTQuOTM0LjI3NCAxNC41ODQuMjY0IDEyLjA2My4yNjRIMTJ6bTAgNS44MzhhNi4xNjIgNi4xNjIgMCAxIDAgMCAxMi4zMjQgNi4xNjIgNi4xNjIgMCAwIDAgMC0xMi4zMjR6TTEyIDE2YTQgNCAwIDEgMSAwLTggNCA0IDAgMCAxIDAgOHptNi40MDYtMTEuODQ1YTEuNDQgMS40NCAwIDEgMCAwIDIuODgxIDEuNDQgMS40NCAwIDAgMCAwLTIuODgxeiIvPjwvc3ZnPg==" alt="Instagram" style="width: 28px; height: 28px;" /></a>` : ""}
        ${business.socialTwitter ? `<a href="https://x.com/${escapeHtml(business.socialTwitter)}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNMTguMjQ0IDIuMjVoMy4zMDhsLTcuMjI3IDguMjYgOC41MDIgMTEuMjRIMTYuMTdsLTUuMjE0LTYuODE3TDQuOTkgMjEuNzVIMS42OGw3LjczLTguODM1TDEuMjU0IDIuMjVINy44bDQuNzEzIDYuMjMxem0tMS4xNjEgMTcuNTJoMS44MzNMNy4wODQgNC4xMjZINS4xMTd6Ii8+PC9zdmc+" alt="X" style="width: 28px; height: 28px;" /></a>` : ""}
        ${business.socialLinkedin ? `<a href="https://linkedin.com/in/${escapeHtml(business.socialLinkedin)}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDA3N0I1IiBkPSJNMjAuNDQ3IDIwLjQ1MmgtMy41NTR2LTUuNTY5YzAtMS4zMjgtLjAyNy0zLjAzNy0xLjg1Mi0zLjAzNy0xLjg1MyAwLTIuMTM2IDEuNDQ1LTIuMTM2IDIuOTM5djUuNjY3SDkuMzUxVjloMy40MTR2MS41NjFoLjA0NmMuNDc3LS45IDEuNjM3LTEuODUgMy4zNy0xLjg1IDMuNjAxIDAgNC4yNjcgMi4zNyA0LjI2NyA1LjQ1NXY2LjI4NnpNNS4zMzcgNy40MzNhMi4wNjIgMi4wNjIgMCAwIDEtMi4wNjMtMi4wNjUgMi4wNjQgMi4wNjQgMCAxIDEgMi4wNjMgMi4wNjV6bTEuNzgyIDEzLjAxOUgzLjU1NVY5aDMuNTY0djExLjQ1MnpNMjIuMjI1IDBIMS43NzFDLjc5MiAwIDAgLjc3NCAwIDEuNzI5djIwLjU0MkMwIDIzLjIyNy43OTIgMjQgMS43NzEgMjRoMjAuNDUxQzIzLjIgMjQgMjQgMjMuMjI3IDI0IDIyLjI3MVYxLjcyOUMyNCAuNzc0IDIzLjIgMCAyMi4yMjIgMGguMDAzeiIvPjwvc3ZnPg==" alt="LinkedIn" style="width: 28px; height: 28px;" /></a>` : ""}
        ${business.socialYoutube ? `<a href="https://youtube.com/@${escapeHtml(business.socialYoutube)}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjRkYwMDAwIiBkPSJNMjMuNDk4IDYuMTg2YTMuMDE2IDMuMDE2IDAgMCAwLTIuMTIyLTIuMTM2QzE5LjUwNSAzLjU0NSAxMiAzLjU0NSAxMiAzLjU0NXMtNy41MDUgMC05LjM3Ny41MDVBMy4wMTcgMy4wMTcgMCAwIDAgLjUwMiA2LjE4NkMwIDguMDcgMCAxMiAwIDEyczAgMy45My41MDIgNS44MTRhMy4wMTYgMy4wMTYgMCAwIDAgMi4xMjIgMi4xMzZjMS44NzEuNTA1IDkuMzc2LjUwNSA5LjM3Ni41MDVzNy41MDUgMCA5LjM3Ny0uNTA1YTMuMDE1IDMuMDE1IDAgMCAwIDIuMTIyLTIuMTM2QzI0IDE1LjkzIDI0IDEyIDI0IDEyczAtMy45My0uNTAyLTUuODE0ek05LjU0NSAxNS41NjhWOC40MzJMMTUuODE4IDEybC02LjI3MyAzLjU2OHoiLz48L3N2Zz4=" alt="YouTube" style="width: 28px; height: 28px;" /></a>` : ""}
        ${business.socialTiktok ? `<a href="https://tiktok.com/@${escapeHtml(business.socialTiktok)}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNMTIuNTI1LjAyYzEuMzEtLjAyIDIuNjEtLjAxIDMuOTEtLjAyLjA4IDEuNTMuNjMgMy4wOSAxLjc1IDQuMTcgMS4xMiAxLjExIDIuNyAxLjYyIDQuMjQgMS43OXYuMDl2NC4xNmMtMS40OS0uMDUtMi45OS0uMzktNC4yOC0xLjA4LS43Mi0uMzktMS4zOC0uODctMS45Ny0xLjQyLS4wMSAzLjQ2LjAxIDYuOTItLjAyIDEwLjM3LS4wNSAxLjUyLS40OCAzLjAyLTEuMjQgNC4zMS0xLjI0IDIuMTYtMy40IDMuNzktNS44MyA0LjMtMS40OC4zLTMuMDQuMjQtNC41LS4xNy0yLjM4LS42OC00LjQ1LTIuMzMtNS41Ny00LjU2LTEuMDEtMi4wOS0xLjE0LTQuNTMtLjI4LTYuNjguOTUtMi40IDMuMDEtNC4zNCA1LjQ4LTUuMTUgMS41My0uNTEgMy4xNy0uNTMgNC43NS0uMjYuMDEgMS40NS0uMDEgMi45LS4wMSA0LjM1LS45My0uMjUtMS45My0uMTgtMi44LjIyLTEuMDMuNDQtMS44NyAxLjI5LTIuMjcgMi4zNC0uMzIuODMtLjMxIDEuNzgtLjAxIDIuNjIuNTggMS42IDIuMTEgMi44IDMuODMgMi44MyAxLjA4LjAzIDIuMTYtLjM0IDIuOTktMS4wNS43NC0uNjEgMS4yNS0xLjQ1IDEuNDUtMi4zNS4xLTEuMDIuMDYtMi4wNS4wNy0zLjA3VjB6Ii8+PC9zdmc+" alt="TikTok" style="width: 28px; height: 28px;" /></a>` : ""}
        ${business.socialWhatsapp ? `<a href="https://wa.me/${escapeHtml(business.socialWhatsapp.replace(/[^0-9]/g, ''))}" target="_blank" style="display: inline-block; width: 28px; height: 28px;"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMjVENjY2IiBkPSJNMTcuNDcyIDE0LjM4MmMtLjI5Ny0uMTQ5LTEuNzU4LS44NjctMi4wMy0uOTY3LS4yNzMtLjA5OS0uNDcxLS4xNDgtLjY3LjE1LS4xOTcuMjk3LS43NjcuOTY2LS45NCAxLjE2NC0uMTczLjE5OS0uMzQ3LjIyMy0uNjQ0LjA3NS0uMjk3LS4xNS0xLjI1NS0uNDYzLTIuMzktMS40NzUtLjg4My0uNzg4LTEuNDgtMS43NjEtMS42NTMtMi4wNTktLjE3My0uMjk3LS4wMTgtLjQ1OC4xMy0uNjA2LjEzNC0uMTMzLjI5Ny0uMzQ3LjQ0Ni0uNTIxLjE1MS0uMTcyLjItLjI5Ni4zLS40OTUuMDk5LS4xOTguMDUtLjM3MS0uMDI1LS41Mi0uMDc1LS4xNDktLjY2OS0xLjYxMi0uOTE2LTIuMjA3LS4yNDItLjU3OS0uNDg3LS41LS42NjktLjUxLS4xNzMtLjAwOC0uMzcxLS4wMS0uNTctLjAxLS4xOTggMC0uNTIuMDc0LS43OTIuMzcyLS4yNzIuMjk3LTEuMDQgMS4wMTYtMS4wNCAxLjQ3OSAwIC40NjMuNzY5IDEuOTExIDEuNzQ4IDMuMjAzLjk3OSAxLjI5MiAyLjM2NyAyLjI2MyAzLjAzNCAyLjUxLjY2Ni4yNDcgMS4wOTcuMjEgMS41MDEuMTI2LjQwNC0uMDg0IDEuMjk4LS41MzEgMS40ODEtMS4wNDMuMTgyLS41MTMuMTgyLS45NTIuMTI4LTEuMDQzLS4wNS0uMDkxLS4xOTgtLjE0Ni0uNDE5LS4yNDl6bS01LjQ2MSA3LjQwM2gtLjAwNGMtMS44IDAtMy41NjYtLjQ4My01LjEwNS0xLjM5MkwzLjE3OCAyMS44bDEuNDQzLTUuMjY4Yy0uOTk5LTEuNjI5LTEuNTI2LTMuNDc4LTEuNTI2LTUuNDA4IDAtNS42MyA0LjU4NC0xMC4yMTMgMTAuMjE0LTEwLjIxMyAyLjcyNyAwIDUuMjkgMS4wNjMgNy4yMTQgMi45OTMgMS45MjQgMS45MyAyLjk4MyA0LjQ5NiAyLjk4MiA3LjIyMy0uMDAxIDUuNjMtNC41ODUgMTAuMjE0LTEwLjIxNCAxMC4yMTR6bTguNjg5LTE4LjkxM0MyMC41MyAyLjY5NiAxNy42MDcuNSAxMi4wMTEuNSA1LjUwMy41LjUgNS40OTguNSAxMi4wMDZjMCAyLjAzMy41MyAzLjk4IDEuNTI5IDUuNzE2bC0xLjYyNiA1LjkzOCA2LjA3NC0xLjU5M2MxLjY4NC44MjIgMy41ODQgMS4yNTcgNS41MzMgMS4yNTcgNi41MDcgMCAxMS44MDUtNS4yOTkgMTEuODA2LTExLjgwNi4wMDEtMy4xNTQtMS4yMjctNi4xMi0zLjQ1Ni04LjM0OXoiLz48L3N2Zz4=" alt="WhatsApp" style="width: 28px; height: 28px;" /></a>` : ""}
      </div>
    </div>
    ` : ""}
    
    <!-- Guests -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #71717a;">${t("guests")}</p>
      <p style="margin: 0; font-size: 14px; color: #18181b;">${escapeHtml(booking.customerName)}</p>
      ${booking.customerPhone ? `<p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${escapeHtml(booking.customerPhone)}</p>` : ""}
      <p style="margin: 4px 0 0; font-size: 14px; color: #71717a;">${escapeHtml(booking.customerEmail)}</p>
    </div>
    
    <!-- Add to Calendar -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 24px;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #18181b; text-align: center;">${t("addToCalendar")}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        <tr>
          <td style="${calendarLinks.apple ? "width: 33.33%;" : "width: 50%;"} text-align: center; padding: 0 4px;">
            <a href="${calendarLinks.google}" target="_blank" style="display: inline-block; padding: 10px 12px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 11px; color: #18181b; font-weight: 500;">
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjNDI4NWY0IiBkPSJNMjIuNTYgMTIuMjVjMC0uNzgtLjA3LTEuNTMtLjItMi4yNUgxMnY0LjI2aDUuOTJjLS4yNiAxLjM3LTEuMDQgMi41My0yLjIxIDMuMzF2Mi43N2gzLjU3YzIuMDgtMS45MiAzLjI4LTQuNzQgMy4yOC04LjA5eiIvPjxwYXRoIGZpbGw9IiMzNGE4NTMiIGQ9Ik0xMiAyM2MyLjk3IDAgNS40Ni0uOTggNy4yOC0yLjY2bC0zLjU3LTIuNzdjLS45OC42Ni0yLjIzIDEuMDYtMy43MSAxLjA2LTIuODYgMC01LjI5LTEuOTMtNi4xNi00LjUzSDIuMTh2Mi44NEMzLjk5IDIwLjUzIDcuNyAyMyAxMiAyM3oiLz48cGF0aCBmaWxsPSIjZmJiYzA1IiBkPSJNNS44NCAxNC4wOWMtLjIyLS42Ni0uMzUtMS4zNi0uMzUtMi4wOXMuMTMtMS40My4zNS0yLjA5VjcuMDdIMi4xOEMxLjQzIDguNTUgMSAxMC4yMiAxIDEyczQuNDMgMy40NSAxLjE4IDQuOTNsMy42NiAyLjE2eiIvPjxwYXRoIGZpbGw9IiNlYTQzMzUiIGQ9Ik0xMiA1LjM4YzEuNjIgMCAzLjA2LjU2IDQuMjEgMS42NGwzLjE1LTMuMTVDMTcuNDUgMi4wOSAxNC45NyAxIDEyIDEgNy43IDEgMy45OSAzLjQ3IDIuMTggNy4wN2wzLjY2IDIuODRjLjg3LTIuNiAzLjMtNC41MyA2LjE2LTQuNTN6Ii8+PC9zdmc+" alt="Google" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;" />Google
            </a>
          </td>
          <td style="${calendarLinks.apple ? "width: 33.33%;" : "width: 50%;"} text-align: center; padding: 0 4px;">
            <a href="${calendarLinks.outlook}" target="_blank" style="display: inline-block; padding: 10px 12px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 11px; color: #18181b; font-weight: 500;">
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDA3OGQ0IiBkPSJNMjQgNy4zODd2MTAuNDc4YzAgLjIzLS4wODkuNDU0LS4yNDguNjItLjE1OS4xNjctLjM3Ny4yNi0uNjA5LjI2SDguNDI5bC0uMDI5LTIuMzQ5IDguMjYxLS4wMjlWOS43MjVsLjAxNS0uMDA3IDcuMDktMy45MzNjLjA4OC0uMDQ4LjE4NS0uMDgxLjI4Ny0uMDk2LjA0MS0uMDA2LjA4My0uMDEuMTI1LS4wMS4xMzUgMCAuMjY2LjA0LjM3OS4xMTYuMTczLjExNi4yOTQuMjk1LjM1LjUwNC4wMzcuMTM3LjA1NS4yNzkuMDU1LjQyMWwtLjAxNi42NDUtLjAzOS4wMjJ6Ii8+PHBhdGggZmlsbD0iIzAwNTJiNCIgZD0iTTguMzk5IDE2LjM5N3YyLjM1bDguMjYxLS4wM3YtMi4zMmgtOC4yNjF6Ii8+PHBhdGggZmlsbD0iIzAzNjRiOCIgZD0iTTI0IDYuNzQydjEuMjlsLTcuMzE1IDMuOTEtOC4yODQtLjAxMy4wMy0yLjIwNCA3LjMzIDMuMDYgOC4xNTQtNC42di0uNjQzbC4wMDEtLjgwMXpNMTQuOTk3IDEyLjMzNGwtLjA4NiA0LjA2MnYuMDAySDguNFYxNC4wNWw2LjU5Ny0xLjcxN3oiLz48cGF0aCBmaWxsPSIjMGE3OGQ0IiBkPSJNMTQuOTExIDQuMDA2djcuNDU0bC04LjUxMSAyLjU4OFY2LjI2MWw4LjUxMS0yLjI1NXoiLz48cGF0aCBmaWxsPSIjMjhBOEVBIiBkPSJNMCAxNC45NTZjMCAuMjM3LjA5NC40NjMuMjYyLjYzLjE2Ny4xNjYuMzk0LjI2LjYzLjI2aDkuMzE4bC4xODkgMi41MTZIOTguNzE3di0yLjQ5bC0uMDI5LS4wMTFIMFYxNS45NTZ6Ii8+PHBhdGggZmlsbD0iIzE0NjZDMCIgZD0iTTEyLjM2OCA0Ljg1bC0yLjg4Ny43NjIgMS40NDQtMS4xMjcgMS40NDMuMzY1eiIvPjxwYXRoIGZpbGw9IiMyOEE4RUEiIGQ9Ik0xNS43MTcgMy4wNDRsLjAyMi4wMDIuMDE4LjAwNiAxLjE0Mi40MDV2LjAwN0wxNC45OTcgNS4yNlY0LjY5bC43Mi0xLjY0NnoiLz48cGF0aCBmaWxsPSIjMDM2NGI4IiBkPSJNMTQuOTk3IDUuMjZsMS45MDIgMS43OTQtLjc3NS4zNjhWNS4yNnoiLz48cGF0aCBmaWxsPSIjMDA3OGQ0IiBkPSJNLjg5MyA0LjcyOEMuMzk5IDQuNzI4IDAgNS4xMjcgMCA1LjYyMXY4LjQ0MmgxNC45OTd2LTEuMDQ1SDEuOTM0VjYuMjE1aDEzLjA2M3YtLjU5NEMxNS4wMzIgNS4xMjggMTQuNjIgNC43MjggMTQuMTA0IDQuNzI4SC44OTN6Ii8+PHBhdGggZmlsbD0iIzAwNTJCNCIgZD0iTTEzLjk2OSAyLjEyMmMuNjQxIDAgMS4xNjIuNTIgMS4xNjIgMS4xNjN2MS41MjJsLTIuMDMyLTEuNzA2VjMuMTZjMC0uNTggLjM5Mi0xLjAzOS45MzgtMS4wMzloLS4wNjh6Ii8+PC9zdmc+" alt="Outlook" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;" />Outlook
            </a>
          </td>
          ${calendarLinks.apple ? `
          <td style="width: 33.33%; text-align: center; padding: 0 4px;">
            <a href="${calendarLinks.apple}" target="_blank" style="display: inline-block; padding: 10px 12px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 11px; color: #18181b; font-weight: 500;">
              <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjMDAwMDAwIiBkPSJNMTguNzEgMTkuNWMtLjgzIDEuMjQtMS43MSAyLjQ1LTMuMDUgMi40Ny0xLjM0LjAzLTEuNzctLjc5LTMuMjktLjc5LTEuNTMgMC0yIC43Ny0zLjI3Ljgxcy0yLjE0LTEuMzMtMi45Ny0yLjU3Yy0xLjctMi40NS0zLTYuOTItMS4yNS05Ljk0LjgyLTEuNDggMi4yOS0yLjQxIDMuOTItMi40NCAxLjMtLjAyIDIuNTIuODcgMy4zMi44NzcgLjc4IDAgMi4yNi0xLjA3IDMuODEtLjkxLjY1LjAzIDIuNDcuMjYgMy42NCAxLjk4LS4wOS4wNi0yLjE3IDEuMjgtMi4xNSAzLjgxLjAzIDMuMDIgMi42NSA0LjAzIDIuNjggNC4wNC0uMDMuMDctLjQyIDEuNDQtMS4zOSAyLjg1ek0xMyAzLjVjLjczLS44MyAxLjk0LTEuNDYgMi45NC0xLjUuMTMgMS4xNy0uMzQgMi4zNS0xLjA0IDMuMTktLjY5Ljg1LTEuODMgMS41MS0yLjk1IDEuNDItLjE1LTEuMTUuNDEtMi4zNSAxLjA1LTMuMTF6Ii8+PC9zdmc+" alt="Apple" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;" />Apple
            </a>
          </td>
          ` : ""}
        </tr>
      </table>
    </div>
    
    <!-- Action Buttons -->
    <div style="margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        <tr>
          <td style="width: 50%; padding-right: 8px; vertical-align: top;">
            <a href="${bookingPageUrl}" style="display: block; padding: 14px 8px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 14px; color: #18181b; font-weight: 500; text-align: center; min-height: 48px; line-height: 20px; box-sizing: border-box;">
              ${t("bookAnotherAppointment")}
            </a>
          </td>
          <td style="width: 50%; padding-left: 8px; vertical-align: top;">
            <a href="${baseUrl}/my-bookings" style="display: block; padding: 14px 8px; background-color: #22c55e; border-radius: 8px; text-decoration: none; font-size: 14px; color: #ffffff; font-weight: 500; text-align: center; min-height: 48px; line-height: 20px; box-sizing: border-box;">
              ${t("viewMyBookings")}
            </a>
          </td>
        </tr>
      </table>
    </div>
    
    ${business.showTermsInEmail && business.termsAndConditions ? `
    <!-- Terms and Conditions -->
    <div style="margin-bottom: 24px; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">📋</span>
        <div>
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #18181b;">${t("termsAndConditions")}</p>
          <p style="margin: 0; font-size: 13px; color: #52525b; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(business.termsAndConditions)}</p>
        </div>
      </div>
    </div>
    ` : ""}
    
    ${modifyUrl ? `
    <!-- Change Reservation -->
    <div style="margin-bottom: 12px;">
      <a href="${modifyUrl}" style="display: block; padding: 14px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 14px; color: #18181b; font-weight: 500; text-align: center;">
        ${t("changeReservation")}
      </a>
    </div>
    ` : ""}
    
    ${cancelUrl ? `
    <!-- Cancel Reservation -->
    <div style="margin-bottom: 32px;">
      <a href="${cancelUrl}" style="display: block; padding: 14px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; text-decoration: none; font-size: 14px; color: #dc2626; font-weight: 500; text-align: center;">
        ${t("cancelReservation")}
      </a>
    </div>
    ` : ""}
    
    <!-- Footer -->
    <div style="padding-top: 24px; border-top: 1px solid #e4e4e7;">
      <p style="margin: 0 0 4px; font-size: 14px; color: #18181b;">
        ${t("sentWithLove")} <span style="color: #ef4444;">&#10084;</span> ${t("withFlowlift")}
      </p>
      <p style="margin: 0 0 4px; font-size: 14px; color: #71717a;">Saltillo, Mexico</p>
      <p style="margin: 0;">
        <a href="https://flowlift.co" style="font-size: 14px; color: #2563eb; text-decoration: none;">${t("signUpFree")}</a>
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
}

function generateCustomerConfirmationText(data: BookingEmailData): string {
  const { booking, service, business, language = "en", baseUrl = "" } = data;
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, language, params);
  
  const dateInfo = formatDateShort(booking.bookingDate, language);
  const timeRange = `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
  const customerActionToken = (booking as any).customerActionToken;
  const cancelUrl = customerActionToken ? `${baseUrl}/customer-cancel?token=${customerActionToken}` : "";
  const modifyUrl = customerActionToken ? `${baseUrl}/customer-modify?token=${customerActionToken}` : "";
  
  // Generate calendar links for text email
  const calendarLinks = generateCalendarLinks(booking as any, service, business, baseUrl);
  
  // Build calendar section with only available options
  const calendarOptions = [
    `- Google Calendar: ${calendarLinks.google}`,
    `- Outlook: ${calendarLinks.outlook}`,
  ];
  if (calendarLinks.apple) {
    calendarOptions.push(`- Apple Calendar: ${calendarLinks.apple}`);
  }

  return `
FLOWLIFT

${t("reservationConfirmed").toUpperCase()}

---

${business.name}

${service.name}
${dateInfo.day}, ${dateInfo.fullDate}
Your appointment is at: ${timeRange}

${business.address || business.city || business.country ? `${t("address")}:
${business.address || ""}${business.city ? `\n${business.city}` : ""}${business.country ? `\n${business.country}` : ""}` : ""}

${business.phone || business.email ? `${t("contact")}:
${business.phone ? `${t("phone")}: ${business.phone}` : ""}${business.email ? `\nEmail: ${business.email}` : ""}
` : ""}${t("guests")}:
${booking.customerName}
${booking.customerPhone || ""}
${booking.customerEmail}

---

${t("addToCalendar")}:
${calendarOptions.join("\n")}

${t("bookAnotherAppointment")}: ${baseUrl}/book/${business.slug}
${t("viewMyBookings")}: ${baseUrl}/my-bookings

${business.showTermsInEmail && business.termsAndConditions ? `${t("termsAndConditions").toUpperCase()}:
${business.termsAndConditions}

` : ""}${modifyUrl ? `${t("changeReservation")}: ${modifyUrl}` : ""}
${cancelUrl ? `${t("cancelReservation")}: ${cancelUrl}` : ""}

---
${t("sentWithLove")} with ${t("withFlowlift")}
Saltillo, Mexico
${t("signUpFree")}: https://flowlift.co
  `.trim();
}

function generateBusinessNotificationHtml(data: BookingEmailData): string {
  const { booking, service, business } = data;
  const lang: Language = "en";
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, lang, params);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("newBooking")}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Checkmark Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: #dcfce7; border-radius: 50%;">
        <span style="font-size: 40px; color: #22c55e;">✓</span>
      </div>
    </div>

    <!-- Title -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #18181b;">${t("newBooking")}</h1>
      <p style="margin: 0; color: #71717a; font-size: 16px;">${t("newAppointment")}</p>
    </div>
    
    <!-- Booking Details Card -->
    <div style="border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 16px;">
        <span style="font-size: 18px; margin-right: 12px;">📅</span>
        <span style="font-size: 16px; color: #18181b; font-weight: 500;">${escapeHtml(formatDate(booking.bookingDate, lang))}</span>
      </div>
      <div style="margin-bottom: 16px;">
        <span style="font-size: 18px; margin-right: 12px;">🕐</span>
        <span style="font-size: 16px; color: #18181b; font-weight: 500;">${escapeHtml(formatTime(booking.startTime))} - ${escapeHtml(formatTime(booking.endTime))}</span>
      </div>
      <div>
        <span style="font-size: 18px; margin-right: 12px;">🏷️</span>
        <span style="font-size: 16px; color: #18181b; font-weight: 500;">${escapeHtml(service.name)}</span>
      </div>
    </div>
    
    <!-- Green Confirmation Message -->
    <div style="border-left: 4px solid #22c55e; background: #f0fdf4; padding: 16px; margin-bottom: 32px;">
      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
        A confirmation email has been sent to <a href="mailto:${escapeHtml(booking.customerEmail)}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(booking.customerEmail)}</a>. You can manage all your bookings from your account.
      </p>
    </div>
    
    <!-- Customer Details -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #18181b; text-transform: uppercase; letter-spacing: 0.5px;">CUSTOMER DETAILS</h3>
      <p style="margin: 0; color: #18181b; font-size: 15px; line-height: 1.8;">
        <strong>${escapeHtml(booking.customerName)}</strong><br>
        <a href="mailto:${escapeHtml(booking.customerEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(booking.customerEmail)}</a>
        ${booking.customerPhone ? `<br><a href="tel:${escapeHtml(booking.customerPhone)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(booking.customerPhone)}</a>` : ""}
      </p>
    </div>
    
    ${booking.customerNotes ? `
    <!-- Customer Notes -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #18181b; text-transform: uppercase; letter-spacing: 0.5px;">CUSTOMER NOTES</h3>
      <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">${escapeHtml(booking.customerNotes)}</p>
    </div>
    ` : ""}
    
    <!-- Footer Message -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="margin: 0; color: #71717a; font-size: 14px;">
        ${t("loginDashboard")}
      </p>
    </div>
    
    <!-- Powered By -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #f4f4f5;">
      <p style="margin: 0; color: #a1a1aa; font-size: 13px;">
        ${t("poweredBy")}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateBusinessNotificationText(data: BookingEmailData): string {
  const { booking, service } = data;
  const t = (key: string) => getEmailText(key, "en");

  return `
${t("newBooking").toUpperCase()}

${t("newAppointment")}

${service.name}
${t("date")}: ${formatDate(booking.bookingDate, "en")}
${t("time")}: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}
${t("duration")}: ${service.duration} ${t("minutes")}
${t("price")}: $${parseFloat(String(service.price)).toFixed(2)}

${t("customerDetails")}:
${booking.customerName}
${booking.customerEmail}
${booking.customerPhone || ""}

${booking.customerNotes ? `${t("customerNotes")}: ${booking.customerNotes}` : ""}

${t("loginDashboard")}

---
${t("poweredBy")}
  `.trim();
}

export async function sendBookingConfirmationToCustomer(
  data: BookingEmailData
): Promise<boolean> {
  const { booking, service, business, language = "en" } = data;
  const t = (key: string) => getEmailText(key, language);

  const subject = `${t("bookingConfirmed")}: ${service.name} - ${business.name}`;
  const text = generateCustomerConfirmationText(data);
  const html = generateCustomerConfirmationHtml(data);

  // Try Resend first (via Replit connector)
  const resend = await getResendClient();
  if (resend) {
    try {
      await resend.client.emails.send({
        from: resend.fromEmail,
        to: booking.customerEmail,
        subject,
        text,
        html,
      });
      console.log(`Email sent via Resend to customer: ${booking.customerEmail} (lang: ${language})`);
      return true;
    } catch (error) {
      console.error("Resend failed, falling back to SMTP:", error);
    }
  }

  // Fall back to SMTP
  const config = getEmailConfig();
  const transport = getTransporter();

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: booking.customerEmail,
    subject,
    text,
    html,
  };

  if (!transport) {
    console.log("=== EMAIL (Customer Confirmation) ===");
    console.log("To:", emailContent.to);
    console.log("Subject:", emailContent.subject);
    console.log("Language:", language);
    console.log("Text:", emailContent.text.substring(0, 200) + "...");
    console.log("=====================================");
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`Email sent via SMTP to customer: ${booking.customerEmail} (lang: ${language})`);
    return true;
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
    return false;
  }
}

export async function sendBookingNotificationToBusiness(
  data: BookingEmailData
): Promise<boolean> {
  const { booking, service, business } = data;

  if (!business.email) {
    console.log("Business has no email configured, skipping notification");
    return true;
  }

  const subject = `New Booking: ${service.name} from ${booking.customerName}`;
  const text = generateBusinessNotificationText(data);
  const html = generateBusinessNotificationHtml(data);

  // Try Resend first (via Replit connector)
  const resend = await getResendClient();
  if (resend) {
    try {
      await resend.client.emails.send({
        from: resend.fromEmail,
        to: business.email,
        subject,
        text,
        html,
      });
      console.log(`Email sent via Resend to business: ${business.email}`);
      return true;
    } catch (error) {
      console.error("Resend failed, falling back to SMTP:", error);
    }
  }

  // Fall back to SMTP
  const config = getEmailConfig();
  const transport = getTransporter();

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: business.email,
    subject,
    text,
    html,
  };

  if (!transport) {
    console.log("=== EMAIL (Business Notification) ===");
    console.log("To:", emailContent.to);
    console.log("Subject:", emailContent.subject);
    console.log("Text:", emailContent.text.substring(0, 200) + "...");
    console.log("======================================");
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`Email sent via SMTP to business: ${business.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send business notification email:", error);
    return false;
  }
}

export async function sendBookingEmails(
  data: BookingEmailData
): Promise<{ customerSent: boolean; businessSent: boolean }> {
  const [customerSent, businessSent] = await Promise.all([
    sendBookingConfirmationToCustomer(data),
    sendBookingNotificationToBusiness(data),
  ]);

  return { customerSent, businessSent };
}

interface MagicLinkData {
  email: string;
  token: string;
  baseUrl: string;
  language?: Language;
}

function generateMagicLinkHtml(data: MagicLinkData): string {
  const { baseUrl, token, language = "en" } = data;
  const magicLinkUrl = `${baseUrl}/my-bookings?token=${token}`;
  const t = (key: string) => getEmailText(key, language);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("signInFlowLift")}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">${t("signInFlowLift")}</h1>
        <p style="margin: 8px 0 0; color: #71717a; font-size: 16px;">${t("clickToAccess")}</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${magicLinkUrl}" style="display: inline-block; background: #18181b; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
          ${t("viewMyBookings")}
        </a>
      </div>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          <strong>Note:</strong> ${t("linkExpires")}
        </p>
      </div>
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          ${t("buttonNotWork")}<br>
          <a href="${magicLinkUrl}" style="color: #3b82f6; word-break: break-all;">${escapeHtml(magicLinkUrl)}</a>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
        ${t("poweredBy")}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateMagicLinkText(data: MagicLinkData): string {
  const { baseUrl, token, language = "en" } = data;
  const magicLinkUrl = `${baseUrl}/my-bookings?token=${token}`;
  const t = (key: string) => getEmailText(key, language);
  
  return `
${t("signInFlowLift").toUpperCase()}

${t("clickToAccess")}

${magicLinkUrl}

${t("linkExpires")}

---
${t("poweredBy")}
  `.trim();
}

export async function sendMagicLinkEmail(data: MagicLinkData): Promise<boolean> {
  const { language = "en" } = data;
  const t = (key: string) => getEmailText(key, language);

  const subject = `${t("signInFlowLift")} - ${t("viewMyBookings")}`;
  const text = generateMagicLinkText(data);
  const html = generateMagicLinkHtml(data);

  // Try Resend first (via Replit connector)
  const resend = await getResendClient();
  if (resend) {
    try {
      await resend.client.emails.send({
        from: resend.fromEmail,
        to: data.email,
        subject,
        text,
        html,
      });
      console.log(`Magic link email sent via Resend to: ${data.email} (lang: ${language})`);
      return true;
    } catch (error) {
      console.error("Resend failed, falling back to SMTP:", error);
    }
  }

  // Fall back to SMTP
  const config = getEmailConfig();
  const transport = getTransporter();

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: data.email,
    subject,
    text,
    html,
  };

  if (!transport) {
    console.log("=== EMAIL (Magic Link) ===");
    console.log("To:", emailContent.to);
    console.log("Subject:", emailContent.subject);
    console.log("Language:", language);
    console.log("Link:", `${data.baseUrl}/my-bookings?token=${data.token}`);
    console.log("==========================");
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`Magic link email sent via SMTP to: ${data.email} (lang: ${language})`);
    return true;
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    return false;
  }
}

interface ModificationEmailData {
  booking: Booking;
  service: Service;
  business: Business;
  proposedDate: Date;
  proposedStartTime: string;
  proposedEndTime: string;
  modificationReason?: string;
  modificationToken: string;
  baseUrl: string;
  language?: Language;
}

function generateModificationRequestHtml(data: ModificationEmailData): string {
  const { booking, service, business, proposedDate, proposedStartTime, proposedEndTime, modificationReason, modificationToken, baseUrl, language = "en" } = data;
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, language, params);
  const confirmUrl = `${baseUrl}/confirm-modification?token=${modificationToken}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("modificationRequested")}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Warning Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: #fef3c7; border-radius: 50%;">
        <span style="font-size: 40px;">⚠️</span>
      </div>
    </div>

    <!-- Title -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #18181b;">${t("modificationRequested")}</h1>
      <p style="margin: 0; color: #71717a; font-size: 16px;">${t("modificationRequestDesc", { businessName: business.name })}</p>
    </div>
    
    <!-- Current Appointment Card (Red/Strikethrough) -->
    <div style="border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #fef2f2;">
      <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #991b1b; text-transform: uppercase;">${t("currentAppointment")}</h3>
      <div style="margin-bottom: 12px;">
        <span style="font-size: 18px; margin-right: 12px;">📅</span>
        <span style="font-size: 16px; color: #71717a; font-weight: 500; text-decoration: line-through;">${escapeHtml(formatDate(booking.bookingDate, language))}</span>
      </div>
      <div style="margin-bottom: 12px;">
        <span style="font-size: 18px; margin-right: 12px;">🕐</span>
        <span style="font-size: 16px; color: #71717a; font-weight: 500; text-decoration: line-through;">${escapeHtml(formatTime(booking.startTime))} - ${escapeHtml(formatTime(booking.endTime))}</span>
      </div>
      <div>
        <span style="font-size: 18px; margin-right: 12px;">🏷️</span>
        <span style="font-size: 16px; color: #71717a; font-weight: 500;">${escapeHtml(service.name)}</span>
      </div>
    </div>
    
    <!-- Proposed New Time Card (Green) -->
    <div style="border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 24px; background: #f0fdf4;">
      <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #166534; text-transform: uppercase;">${t("proposedNewTime")}</h3>
      <div style="margin-bottom: 12px;">
        <span style="font-size: 18px; margin-right: 12px;">📅</span>
        <span style="font-size: 16px; color: #18181b; font-weight: 600;">${escapeHtml(formatDate(proposedDate, language))}</span>
      </div>
      <div style="margin-bottom: 12px;">
        <span style="font-size: 18px; margin-right: 12px;">🕐</span>
        <span style="font-size: 16px; color: #18181b; font-weight: 600;">${escapeHtml(formatTime(proposedStartTime))} - ${escapeHtml(formatTime(proposedEndTime))}</span>
      </div>
      <div>
        <span style="font-size: 18px; margin-right: 12px;">🏷️</span>
        <span style="font-size: 16px; color: #18181b; font-weight: 500;">${escapeHtml(service.name)}</span>
      </div>
    </div>
    
    ${modificationReason ? `
    <!-- Reason -->
    <div style="border-left: 4px solid #f59e0b; background: #fffbeb; padding: 16px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #92400e; text-transform: uppercase;">${t("modificationReason")}</h3>
      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">${escapeHtml(modificationReason)}</p>
    </div>
    ` : ""}
    
    <!-- Confirm Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${confirmUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        ${t("confirmModification")}
      </a>
    </div>
    
    <!-- Warning Message -->
    <div style="border-left: 4px solid #f59e0b; background: #fffbeb; padding: 16px; margin-bottom: 32px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>Note:</strong> ${t("modificationExpires")}
      </p>
    </div>
    
    <!-- Business Details -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #18181b; text-transform: uppercase; letter-spacing: 0.5px;">BUSINESS DETAILS</h3>
      <p style="margin: 0; color: #18181b; font-size: 15px; line-height: 1.8;">
        <strong>${escapeHtml(business.name)}</strong><br>
        ${business.email ? `<a href="mailto:${escapeHtml(business.email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(business.email)}</a><br>` : ""}
        ${business.phone ? `<a href="tel:${escapeHtml(business.phone)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(business.phone)}</a><br>` : ""}
        ${business.address ? `<span style="color: #52525b;">${escapeHtml(business.address)}</span>` : ""}
      </p>
    </div>
    
    <!-- Link Fallback -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; color: #71717a; font-size: 12px;">
        ${t("buttonNotWork")}<br>
        <a href="${confirmUrl}" style="color: #2563eb; word-break: break-all;">${escapeHtml(confirmUrl)}</a>
      </p>
    </div>
    
    <!-- Powered By -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #f4f4f5;">
      <p style="margin: 0; color: #a1a1aa; font-size: 13px;">
        ${t("poweredBy")}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateModificationRequestText(data: ModificationEmailData): string {
  const { booking, service, business, proposedDate, proposedStartTime, proposedEndTime, modificationReason, modificationToken, baseUrl, language = "en" } = data;
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, language, params);
  const confirmUrl = `${baseUrl}/confirm-modification?token=${modificationToken}`;

  return `
${t("modificationRequested").toUpperCase()}

${t("modificationRequestDesc", { businessName: business.name })}

${service.name}

${t("currentAppointment")}:
${t("date")}: ${formatDate(booking.bookingDate, language)}
${t("time")}: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}

${t("proposedNewTime")}:
${t("date")}: ${formatDate(proposedDate, language)}
${t("time")}: ${formatTime(proposedStartTime)} - ${formatTime(proposedEndTime)}

${modificationReason ? `${t("modificationReason")}: ${modificationReason}` : ""}

${t("confirmModification")}: ${confirmUrl}

${t("modificationExpires")}

---
${t("poweredBy")}
  `.trim();
}

export async function sendModificationRequestEmail(data: ModificationEmailData): Promise<boolean> {
  const { booking, service, business, language = "en" } = data;
  const t = (key: string) => getEmailText(key, language);

  const subject = `${t("modificationRequested")}: ${service.name} - ${business.name}`;
  const text = generateModificationRequestText(data);
  const html = generateModificationRequestHtml(data);

  // Try Resend first (via Replit connector)
  const resend = await getResendClient();
  if (resend) {
    try {
      await resend.client.emails.send({
        from: resend.fromEmail,
        to: booking.customerEmail,
        subject,
        text,
        html,
      });
      console.log(`Modification request email sent via Resend to: ${booking.customerEmail} (lang: ${language})`);
      return true;
    } catch (error) {
      console.error("Resend failed, falling back to SMTP:", error);
    }
  }

  // Fall back to SMTP
  const config = getEmailConfig();
  const transport = getTransporter();

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: booking.customerEmail,
    subject,
    text,
    html,
  };

  if (!transport) {
    console.log("=== EMAIL (Modification Request) ===");
    console.log("To:", emailContent.to);
    console.log("Subject:", emailContent.subject);
    console.log("Language:", language);
    console.log("Confirm URL:", `${data.baseUrl}/confirm-modification?token=${data.modificationToken}`);
    console.log("=====================================");
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`Modification request email sent via SMTP to: ${booking.customerEmail} (lang: ${language})`);
    return true;
  } catch (error) {
    console.error("Failed to send modification request email:", error);
    return false;
  }
}
