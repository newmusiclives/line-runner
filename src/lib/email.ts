import { getSetting } from "@/lib/db/integrations";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try SMTP via fetch to avoid needing nodemailer dependency
  // Use GoHighLevel if SMTP not configured
  const smtpHost = await getSetting("smtp_host");
  const smtpUser = await getSetting("smtp_user");
  const smtpPass = await getSetting("smtp_pass");
  const smtpPort = await getSetting("smtp_port");
  const fromEmail = await getSetting("smtp_from_email") || "noreply@linerunner.app";
  const fromName = await getSetting("smtp_from_name") || "Line Runner";

  if (smtpHost && smtpUser && smtpPass) {
    // Use direct SMTP via a lightweight approach
    // Since we're serverless (Netlify), use a raw SMTP fetch or GoHighLevel
    // For now, try GoHighLevel email endpoint first as that's the primary CRM
    return sendViaGhl(options, fromEmail, fromName);
  }

  // Fallback to GoHighLevel
  return sendViaGhl(options, fromEmail, fromName);
}

async function sendViaGhl(
  options: EmailOptions,
  fromEmail: string,
  fromName: string
): Promise<boolean> {
  try {
    const apiKey = await getSetting("gohighlevel_api_key");
    const locationId = await getSetting("gohighlevel_location_id");
    if (!apiKey || !locationId) return false;

    // First ensure contact exists
    await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        locationId,
        email: options.to,
        source: "Line Runner",
      }),
    });

    // Search for contact to get ID
    const searchRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(options.to)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: "2021-07-28",
        },
      }
    );

    if (!searchRes.ok) return false;
    const searchData = await searchRes.json();
    const contactId = searchData?.contact?.id;
    if (!contactId) return false;

    // Send email via GHL
    const emailRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/campaigns/email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Version: "2021-07-28",
        },
        body: JSON.stringify({
          emailFrom: fromEmail,
          emailFromName: fromName,
          emailTo: options.to,
          subject: options.subject,
          body: options.html,
        }),
      }
    );

    return emailRes.ok;
  } catch {
    return false;
  }
}

// Email templates
export function passwordResetEmail(resetLink: string, userName: string): { subject: string; html: string } {
  return {
    subject: "Reset your Line Runner password",
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e4e4e7; padding: 40px 24px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Line Runner</h1>
          <p style="color: #71717a; font-size: 14px; margin: 0;">Password Reset Request</p>
        </div>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hi ${userName},<br><br>
          We received a request to reset your password. Click the button below to choose a new one:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #71717a; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
        <p style="font-size: 12px; color: #52525b; text-align: center;">
          Line Runner &mdash; AI-Powered Rehearsal Platform
        </p>
      </div>
    `,
  };
}

export function welcomeEmail(userName: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Line Runner!",
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e4e4e7; padding: 40px 24px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Welcome to Line Runner</h1>
        </div>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          Hi ${userName},<br><br>
          Your account is ready. Here's how to get started:
        </p>
        <ol style="font-size: 14px; line-height: 1.8; color: #a1a1aa; padding-left: 20px;">
          <li>Upload a script (PDF or text)</li>
          <li>Choose your character and assign voices</li>
          <li>Start rehearsing with 10 different modes</li>
        </ol>
        <p style="font-size: 14px; color: #71717a; margin-top: 24px;">
          Explore all 30 features from your dashboard &mdash; voice tools, marketplace, scene exchange, and more.
        </p>
        <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
        <p style="font-size: 12px; color: #52525b; text-align: center;">
          Line Runner &mdash; AI-Powered Rehearsal Platform
        </p>
      </div>
    `,
  };
}
