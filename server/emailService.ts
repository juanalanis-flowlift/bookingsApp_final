import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Booking, Service, Business } from "@shared/schema";

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

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return transporter;
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "Date not available";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return String(date).split('T')[0];
    }
    return d.toLocaleDateString("en-US", {
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
}

function generateCustomerConfirmationHtml(data: BookingEmailData): string {
  const { booking, service, business } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">Booking Confirmed</h1>
        <p style="margin: 8px 0 0; color: #71717a; font-size: 16px;">Your appointment has been scheduled</p>
      </div>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #18181b;">${escapeHtml(service.name)}</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Date:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatDate(booking.date))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Time:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatTime(booking.startTime))} - ${escapeHtml(formatTime(booking.endTime))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Duration:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${service.duration} minutes</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Price:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">$${(service.price / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">Business Details</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          <strong>${escapeHtml(business.name)}</strong><br>
          ${escapeHtml(business.email || "")}
          ${business.phone ? `<br>${escapeHtml(business.phone)}` : ""}
          ${business.address ? `<br>${escapeHtml(business.address)}` : ""}
        </p>
      </div>
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          Need to make changes? Contact ${escapeHtml(business.name)} directly.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
        Powered by FlowLift
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateCustomerConfirmationText(data: BookingEmailData): string {
  const { booking, service, business } = data;

  return `
BOOKING CONFIRMED

Your appointment has been scheduled.

${service.name}
Date: ${formatDate(booking.date)}
Time: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}
Duration: ${service.duration} minutes
Price: $${(service.price / 100).toFixed(2)}

Business Details:
${business.name}
${business.email || ""}
${business.phone || ""}
${business.address || ""}

${booking.notes ? `Notes: ${booking.notes}` : ""}

Need to make changes? Contact ${business.name} directly.

---
Powered by FlowLift
  `.trim();
}

function generateBusinessNotificationHtml(data: BookingEmailData): string {
  const { booking, service, business } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #22c55e; color: white; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
          New Booking
        </div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">You have a new appointment</h1>
      </div>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #18181b;">${escapeHtml(service.name)}</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Date:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatDate(booking.date))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Time:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${escapeHtml(formatTime(booking.startTime))} - ${escapeHtml(formatTime(booking.endTime))}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Duration:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">${service.duration} minutes</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #71717a; font-size: 14px;">Price:</span>
            <span style="color: #18181b; font-size: 14px; font-weight: 500;">$${(service.price / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">Customer Details</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          <strong>${escapeHtml(booking.customerName)}</strong><br>
          ${escapeHtml(booking.customerEmail)}
          ${booking.customerPhone ? `<br>${escapeHtml(booking.customerPhone)}` : ""}
        </p>
      </div>
      
      ${booking.notes ? `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">Customer Notes</h3>
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">${escapeHtml(booking.notes)}</p>
      </div>
      ` : ""}
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          Log in to your FlowLift dashboard to manage this booking.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
        Powered by FlowLift
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateBusinessNotificationText(data: BookingEmailData): string {
  const { booking, service, business } = data;

  return `
NEW BOOKING

You have a new appointment.

${service.name}
Date: ${formatDate(booking.date)}
Time: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}
Duration: ${service.duration} minutes
Price: $${(service.price / 100).toFixed(2)}

Customer Details:
${booking.customerName}
${booking.customerEmail}
${booking.customerPhone || ""}

${booking.notes ? `Notes: ${booking.notes}` : ""}

Log in to your FlowLift dashboard to manage this booking.

---
Powered by FlowLift
  `.trim();
}

export async function sendBookingConfirmationToCustomer(
  data: BookingEmailData
): Promise<boolean> {
  const { booking, service, business } = data;
  const config = getEmailConfig();
  const transport = getTransporter();

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: booking.customerEmail,
    subject: `Booking Confirmed: ${service.name} at ${business.name}`,
    text: generateCustomerConfirmationText(data),
    html: generateCustomerConfirmationHtml(data),
  };

  if (!transport) {
    console.log("=== EMAIL (Customer Confirmation) ===");
    console.log("To:", emailContent.to);
    console.log("Subject:", emailContent.subject);
    console.log("Text:", emailContent.text.substring(0, 200) + "...");
    console.log("=====================================");
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`Email sent to customer: ${booking.customerEmail}`);
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
}

function generateMagicLinkHtml(data: MagicLinkData): string {
  const magicLinkUrl = `${data.baseUrl}/my-bookings?token=${data.token}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to FlowLift</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #18181b;">Sign in to FlowLift</h1>
        <p style="margin: 8px 0 0; color: #71717a; font-size: 16px;">Click the button below to access your bookings</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${magicLinkUrl}" style="display: inline-block; background: #18181b; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
          View My Bookings
        </a>
      </div>
      
      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #52525b; font-size: 14px; line-height: 1.6;">
          <strong>Note:</strong> This link will expire in 1 hour. If you didn't request this email, you can safely ignore it.
        </p>
      </div>
      
      <div style="border-top: 1px solid #e4e4e7; padding-top: 24px; text-align: center;">
        <p style="margin: 0; color: #71717a; font-size: 12px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${magicLinkUrl}" style="color: #3b82f6; word-break: break-all;">${escapeHtml(magicLinkUrl)}</a>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
        Powered by FlowLift
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateMagicLinkText(data: MagicLinkData): string {
  const magicLinkUrl = `${data.baseUrl}/my-bookings?token=${data.token}`;
  
  return `
SIGN IN TO FLOWLIFT

Click the link below to access your bookings:

${magicLinkUrl}

This link will expire in 1 hour. If you didn't request this email, you can safely ignore it.

---
Powered by FlowLift
  `.trim();
}

export async function sendMagicLinkEmail(data: MagicLinkData): Promise<boolean> {
  const config = getEmailConfig();
  const transport = getTransporter();

  const emailContent = {
    from: config?.from || "noreply@flowlift.app",
    to: data.email,
    subject: "Sign in to FlowLift - View Your Bookings",
    text: generateMagicLinkText(data),
    html: generateMagicLinkHtml(data),
  };

  if (!transport) {
    console.log("=== EMAIL (Magic Link) ===");
    console.log("To:", emailContent.to);
    console.log("Subject:", emailContent.subject);
    console.log("Link:", `${data.baseUrl}/my-bookings?token=${data.token}`);
    console.log("==========================");
    return true;
  }

  try {
    await transport.sendMail(emailContent);
    console.log(`Magic link email sent to: ${data.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    return false;
  }
}
