// Centralized public-facing email addresses.
//
// All four addresses can be pointed at one inbox via NEXT_PUBLIC_LR_SUPPORT_EMAIL,
// or each role overridden individually. Email addresses are public, so the
// NEXT_PUBLIC_ prefix is intentional — it bakes the value into the client bundle
// at build time so legal pages and contact buttons pick it up everywhere.
//
// Defaults match the original linerunner.app placeholders so nothing breaks if
// no env vars are set (it just keeps showing the placeholder addresses).

const single = process.env.NEXT_PUBLIC_LR_SUPPORT_EMAIL;

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_LR_CONTACT_EMAIL || single || "hello@linerunner.app";
export const PRIVACY_EMAIL = process.env.NEXT_PUBLIC_LR_PRIVACY_EMAIL || single || "privacy@linerunner.app";
export const BILLING_EMAIL = process.env.NEXT_PUBLIC_LR_BILLING_EMAIL || single || "billing@linerunner.app";
export const ENTERPRISE_EMAIL = process.env.NEXT_PUBLIC_LR_ENTERPRISE_EMAIL || single || "enterprise@linerunner.app";
