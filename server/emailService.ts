import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Booking, Service, Business } from "@shared/schema";

type Language = "en" | "es";

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
    bookingConfirmed: "Booking Confirmed",
    appointmentScheduled: "Your appointment has been scheduled",
    date: "Date",
    time: "Time",
    duration: "Duration",
    price: "Price",
    minutes: "minutes",
    businessDetails: "Business Details",
    needChanges: "Need to make changes? Contact {businessName} directly.",
    poweredBy: "Powered by FlowLift",
    newBooking: "New Booking",
    newAppointment: "You have a new appointment",
    customerDetails: "Customer Details",
    customerNotes: "Customer Notes",
    loginDashboard: "Log in to your FlowLift dashboard to manage this booking.",
    signInFlowLift: "Sign in to FlowLift",
    clickToAccess: "Click the button below to access your bookings",
    viewMyBookings: "View My Bookings",
    linkExpires: "This link will expire in 1 hour. If you didn't request this email, you can safely ignore it.",
    buttonNotWork: "If the button doesn't work, copy and paste this link into your browser:",
  },
  es: {
    bookingConfirmed: "Reserva Confirmada",
    appointmentScheduled: "Tu cita ha sido programada",
    date: "Fecha",
    time: "Hora",
    duration: "Duración",
    price: "Precio",
    minutes: "minutos",
    businessDetails: "Detalles del Negocio",
    needChanges: "¿Necesitas hacer cambios? Contacta a {businessName} directamente.",
    poweredBy: "Desarrollado por FlowLift",
    newBooking: "Nueva Reserva",
    newAppointment: "Tienes una nueva cita",
    customerDetails: "Detalles del Cliente",
    customerNotes: "Notas del Cliente",
    loginDashboard: "Inicia sesión en tu panel de FlowLift para gestionar esta reserva.",
    signInFlowLift: "Inicia sesión en FlowLift",
    clickToAccess: "Haz clic en el botón de abajo para acceder a tus reservas",
    viewMyBookings: "Ver Mis Reservas",
    linkExpires: "Este enlace expirará en 1 hora. Si no solicitaste este correo, puedes ignorarlo con seguridad.",
    buttonNotWork: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
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

interface BookingEmailData {
  booking: Booking;
  service: Service;
  business: Business;
  language?: Language;
}

function generateCustomerConfirmationHtml(data: BookingEmailData): string {
  const { booking, service, business, language = "en" } = data;
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, language, params);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t("bookingConfirmed")}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">${t("bookingConfirmed")}</h1>
        <p style="margin: 8px 0 0; color: #71717a; font-size: 16px;">${t("appointmentScheduled")}</p>
      </div>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #18181b;">${escapeHtml(service.name)}</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("date")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatDate(booking.bookingDate, language))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("time")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatTime(booking.startTime))} - ${escapeHtml(formatTime(booking.endTime))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("duration")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${service.duration} ${t("minutes")}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("price")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">$${parseFloat(String(service.price)).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">${t("businessDetails")}</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          <strong>${escapeHtml(business.name)}</strong><br>
          ${escapeHtml(business.email || "")}
          ${business.phone ? `<br>${escapeHtml(business.phone)}` : ""}
          ${business.address ? `<br>${escapeHtml(business.address)}` : ""}
        </p>
      </div>
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          ${t("needChanges", { businessName: business.name })}
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

function generateCustomerConfirmationText(data: BookingEmailData): string {
  const { booking, service, business, language = "en" } = data;
  const t = (key: string, params?: Record<string, string>) => getEmailText(key, language, params);

  return `
${t("bookingConfirmed").toUpperCase()}

${t("appointmentScheduled")}

${service.name}
${t("date")}: ${formatDate(booking.bookingDate, language)}
${t("time")}: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}
${t("duration")}: ${service.duration} ${t("minutes")}
${t("price")}: $${parseFloat(String(service.price)).toFixed(2)}

${t("businessDetails")}:
${business.name}
${business.email || ""}
${business.phone || ""}
${business.address || ""}

${booking.customerNotes ? `Notes: ${booking.customerNotes}` : ""}

${t("needChanges", { businessName: business.name })}

---
${t("poweredBy")}
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
          ${t("newBooking")}
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">${t("newAppointment")}</h1>
      </div>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #18181b;">${escapeHtml(service.name)}</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("date")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatDate(booking.bookingDate, lang))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("time")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatTime(booking.startTime))} - ${escapeHtml(formatTime(booking.endTime))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("duration")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${service.duration} ${t("minutes")}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">${t("price")}:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">$${parseFloat(String(service.price)).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">${t("customerDetails")}</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          <strong>${escapeHtml(booking.customerName)}</strong><br>
          ${escapeHtml(booking.customerEmail)}
          ${booking.customerPhone ? `<br>${escapeHtml(booking.customerPhone)}` : ""}
        </p>
      </div>
      
      ${booking.customerNotes ? `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">${t("customerNotes")}</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">${escapeHtml(booking.customerNotes)}</p>
      </div>
      ` : ""}
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          ${t("loginDashboard")}
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
