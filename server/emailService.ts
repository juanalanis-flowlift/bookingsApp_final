import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Booking, Service, Business } from "@shared/schema";

type Language = "en" | "es";

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
  
  const businessLocation = [business.city, business.country].filter(Boolean).join(", ");

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
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #18181b;">${t("reservationConfirmed")}</h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #71717a;">
      ${t("youreGoingTo")} <strong style="color: #18181b;">${escapeHtml(service.name)}</strong>
    </p>
    
    ${business.coverImageUrl ? `
    <!-- Cover Image -->
    <div style="margin-bottom: 16px; border-radius: 12px; overflow: hidden;">
      <img src="${escapeHtml(business.coverImageUrl)}" alt="${escapeHtml(business.name)}" style="width: 100%; height: auto; display: block; max-height: 200px; object-fit: cover;" />
    </div>
    ` : ""}
    
    <!-- Business Name & Logo -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #18181b;">${escapeHtml(business.name)}</p>
      ${business.logoUrl ? `
      <img src="${escapeHtml(business.logoUrl)}" alt="${escapeHtml(business.name)} logo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
      ` : ""}
    </div>
    
    <!-- Appointment Date/Time -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #18181b;">${escapeHtml(dateInfo.day)},</p>
      <p style="margin: 0 0 4px; font-size: 16px; color: #18181b;">${escapeHtml(dateInfo.fullDate)}</p>
      <p style="margin: 0; font-size: 14px; color: #71717a;">Check-in time is ${escapeHtml(timeRange)}</p>
    </div>
    
    ${business.address ? `
    <!-- Address -->
    <div style="margin-bottom: 24px; border-bottom: 1px solid #e4e4e7; padding-bottom: 16px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #71717a;">${t("address")}</p>
      <p style="margin: 0; font-size: 14px; color: #18181b; line-height: 1.5;">${escapeHtml(business.address)}</p>
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
            <a href="${calendarLinks.google}" target="_blank" style="display: inline-block; padding: 10px 16px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 12px; color: #18181b; font-weight: 500;">
              <span style="color: #4285f4;">G</span> Google Calendar
            </a>
          </td>
          <td style="${calendarLinks.apple ? "width: 33.33%;" : "width: 50%;"} text-align: center; padding: 0 4px;">
            <a href="${calendarLinks.outlook}" target="_blank" style="display: inline-block; padding: 10px 16px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 12px; color: #18181b; font-weight: 500;">
              <span style="color: #0078d4;">📧</span> Outlook
            </a>
          </td>
          ${calendarLinks.apple ? `
          <td style="width: 33.33%; text-align: center; padding: 0 4px;">
            <a href="${calendarLinks.apple}" target="_blank" style="display: inline-block; padding: 10px 16px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 12px; color: #18181b; font-weight: 500;">
              <span style="color: #000;">🍎</span> Apple Calendar
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
          <td style="width: 50%; padding-right: 8px;">
            <a href="${bookingPageUrl}" style="display: block; padding: 14px; border: 1px solid #e4e4e7; border-radius: 8px; text-decoration: none; font-size: 14px; color: #18181b; font-weight: 500; text-align: center;">
              ${t("bookAnotherAppointment")}
            </a>
          </td>
          <td style="width: 50%; padding-left: 8px;">
            <a href="${baseUrl}/my-bookings" style="display: block; padding: 14px; background-color: #22c55e; border-radius: 8px; text-decoration: none; font-size: 14px; color: #ffffff; font-weight: 500; text-align: center;">
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
        ${t("sentWithLove")} <span style="color: #ef4444;">❤️</span> ${t("withFlowlift")}
      </p>
      ${businessLocation ? `<p style="margin: 0 0 4px; font-size: 14px; color: #71717a;">${escapeHtml(businessLocation)} 🇲🇽</p>` : ""}
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
  const businessLocation = [business.city, business.country].filter(Boolean).join(", ");
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
${t("youreGoingTo")} ${service.name}

---

${business.name}

${dateInfo.day}, ${dateInfo.fullDate}
Check-in time is ${timeRange}

${business.address ? `${t("address")}:
${business.address}` : ""}

${t("guests")}:
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
${t("sentWithLove")} ❤️ ${t("withFlowlift")}
${businessLocation}
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
  const config = getEmailConfig();
  const transport = getTransporter();
  const t = (key: string) => getEmailText(key, language);

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: booking.customerEmail,
    subject: `${t("bookingConfirmed")}: ${service.name} - ${business.name}`,
    text: generateCustomerConfirmationText(data),
    html: generateCustomerConfirmationHtml(data),
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
    console.log(`Email sent to customer: ${booking.customerEmail} (lang: ${language})`);
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
  const config = getEmailConfig();
  const transport = getTransporter();

  if (!business.email) {
    console.log("Business has no email configured, skipping notification");
    return true;
  }

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: business.email,
    subject: `New Booking: ${service.name} from ${booking.customerName}`,
    text: generateBusinessNotificationText(data),
    html: generateBusinessNotificationHtml(data),
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
    console.log(`Email sent to business: ${business.email}`);
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
  const config = getEmailConfig();
  const transport = getTransporter();
  const { language = "en" } = data;
  const t = (key: string) => getEmailText(key, language);

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: data.email,
    subject: `${t("signInFlowLift")} - ${t("viewMyBookings")}`,
    text: generateMagicLinkText(data),
    html: generateMagicLinkHtml(data),
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
    console.log(`Magic link email sent to: ${data.email} (lang: ${language})`);
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
  const config = getEmailConfig();
  const transport = getTransporter();
  const t = (key: string) => getEmailText(key, language);

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: booking.customerEmail,
    subject: `${t("modificationRequested")}: ${service.name} - ${business.name}`,
    text: generateModificationRequestText(data),
    html: generateModificationRequestHtml(data),
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
    console.log(`Modification request email sent to: ${booking.customerEmail} (lang: ${language})`);
    return true;
  } catch (error) {
    console.error("Failed to send modification request email:", error);
    return false;
  }
}
