// Branded HTML templates that get pasted into GHL email templates.
// GHL's /emails/builder API only creates a template shell — the HTML body
// has to be added manually via the GHL UI editor (Marketing → Emails →
// Templates → click template → paste HTML in the source/code view).

const SHELL_STYLES = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f13; color: #e4e4e7; padding: 40px 24px; border-radius: 16px;`;

export interface EmailTemplate {
  key: "welcome" | "subscriber" | "churn";
  name: string;
  subject: string;
  triggerTag: string;
  description: string;
  html: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: "welcome",
    name: "Line Runner — Welcome",
    subject: "Welcome to Line Runner — start your first rehearsal",
    triggerTag: "new-user",
    description: "Sent when a brand-new user registers (Free plan signup).",
    html: `<div style="max-width: 480px; margin: 0 auto; ${SHELL_STYLES}">
  <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Welcome to Line Runner</h1>
  <p style="color: #71717a; font-size: 14px; margin: 0 0 24px;">Hi {{contact.first_name}}, your account is ready.</p>
  <p style="font-size: 15px; line-height: 1.6;">
    Line Runner lets actors and voice artists rehearse with AI scene partners — upload a script, pick your part, and run lines on demand.
  </p>
  <ol style="font-size: 14px; line-height: 1.8; color: #a1a1aa; padding-left: 20px;">
    <li>Upload a PDF or text script</li>
    <li>Pick the character you're playing</li>
    <li>Hit <em>Start Rehearsal</em> — the AI reads every other line aloud</li>
  </ol>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://rehearse-perform-earn.netlify.app/upload" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Upload your first script</a>
  </div>
  <p style="font-size: 13px; color: #71717a;">Free plan includes 1 scene/month and the four core tools (Script Analysis, Line Memory, Bookmarks, Teleprompter). Upgrade anytime for unlimited rehearsals and more voice minutes.</p>
  <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
  <p style="font-size: 12px; color: #52525b; text-align: center;">Line Runner — AI Script Rehearsal · <a href="https://rehearse-perform-earn.netlify.app" style="color: #71717a;">linerunner.app</a></p>
</div>`,
  },
  {
    key: "subscriber",
    name: "Line Runner — Subscriber Welcome",
    subject: "You're in — welcome to Line Runner",
    triggerTag: "subscriber",
    description: "Sent when a Free user upgrades to Pro or Studio via Stripe.",
    html: `<div style="max-width: 480px; margin: 0 auto; ${SHELL_STYLES}">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; font-weight: 600; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px;">Subscription active</div>
  </div>
  <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Thanks, {{contact.first_name}} — you're in.</h1>
  <p style="font-size: 15px; line-height: 1.6;">Your Line Runner subscription is live. Here's what unlocks right now:</p>
  <ul style="font-size: 14px; line-height: 1.8; color: #a1a1aa; padding-left: 20px;">
    <li>Unlimited scene runs (was 1/month on Free)</li>
    <li>10× more voice minutes per month</li>
    <li>More AI voices per script</li>
  </ul>
  <p style="font-size: 14px; color: #a1a1aa;">Some advanced features (AI Performance Coach, Self-Tape Studio, Audition Vault, Scene Exchange) are still rolling out — your subscription locks them in at this price when they ship.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://rehearse-perform-earn.netlify.app/dashboard" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Go to dashboard</a>
  </div>
  <p style="font-size: 13px; color: #71717a;">A receipt has been emailed to you by Stripe. Manage your subscription anytime at <a href="https://rehearse-perform-earn.netlify.app/dashboard/subscription" style="color: #a78bfa;">Account → Subscription</a>.</p>
  <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
  <p style="font-size: 12px; color: #52525b; text-align: center;">Line Runner — AI Script Rehearsal</p>
</div>`,
  },
  {
    key: "churn",
    name: "Line Runner — Churn Winback",
    subject: "You're always welcome back at Line Runner",
    triggerTag: "churned",
    description: "Sent when a paid user cancels their subscription.",
    html: `<div style="max-width: 480px; margin: 0 auto; ${SHELL_STYLES}">
  <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Sorry to see you go, {{contact.first_name}}</h1>
  <p style="font-size: 15px; line-height: 1.6;">Your Line Runner subscription has been cancelled. You'll keep access to paid features until the end of your current billing period — after that, your account moves to the Free plan.</p>
  <p style="font-size: 15px; line-height: 1.6;">If something didn't work for you, we'd love to know. Reply to this email — a real human will read it.</p>
  <p style="font-size: 15px; line-height: 1.6;">Your scripts, rehearsal history, and bookmarks stay safe on your account. Come back any time.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://rehearse-perform-earn.netlify.app/dashboard" style="display: inline-block; background: #6c5ce7; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">Open Line Runner</a>
  </div>
  <hr style="border: none; border-top: 1px solid #27272a; margin: 32px 0;" />
  <p style="font-size: 12px; color: #52525b; text-align: center;">Line Runner — AI Script Rehearsal</p>
</div>`,
  },
];
