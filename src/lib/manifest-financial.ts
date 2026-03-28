import { PricingPlan } from "@/types";

// ── ElevenLabs cost model ──────────────────────────────────────────
// ~1,000 characters of text ≈ 1 minute of generated audio.
// At Pro-tier overage: $0.24 per 1,000 chars → $0.24 / min of audio.
// We use the Pro-tier rate as our wholesale cost basis.
//
// Typical script stats (dialogue only, excluding stage directions):
//   Short episode  (~15 pp):  ~15 min audio,  2-5 AI voices
//   One act        (~40 pp):  ~40 min audio,  4-10 AI voices
//   Three acts    (~120 pp): ~120 min audio,  8-20 AI voices
//
// Each additional unique voice requires its own ElevenLabs voice-clone
// slot on higher plans. We factor in a per-voice overhead.
//
// Our cost per generated minute: $0.24
// Per-voice overhead per session: $0.10 (clone slot / processing)
// We target a ~60-70% gross margin on one-time, ~75% on subscriptions.
// ────────────────────────────────────────────────────────────────────

const COST_PER_MIN = 0.24; // ElevenLabs Pro-tier rate per minute
const PER_VOICE_OVERHEAD = 0.10; // per unique AI voice per session

export function estimateVoiceCost(minutes: number, voices: number): number {
  return minutes * COST_PER_MIN + voices * PER_VOICE_OVERHEAD;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "single-script",
    name: "Short Episode",
    price: 10,
    period: "one-time",
    description:
      "One short episode or scene — up to 15 min of AI audio with up to 5 voices",
    features: [
      "1 script upload",
      "Up to 15 minutes of AI dialogue",
      "Up to 5 AI voices included",
      "Voice customization (age, accent, gender)",
      "Unlimited replays for 30 days",
    ],
    scriptLengths: ["Short episode (up to 15 pages / ~15 min)"],
    maxCharacters: 5,
    maxMinutes: 15,
    costBreakdown: {
      voiceCostPerMin: COST_PER_MIN,
      includedMinutes: 15,
      includedVoices: 5,
      overagePerMin: 0.50,
    },
  },
  {
    id: "one-act-pass",
    name: "One Act",
    price: 20,
    period: "one-time",
    description:
      "A single-act play — up to 40 min of AI audio with up to 10 voices",
    features: [
      "1 script upload (up to 1 act)",
      "Up to 40 minutes of AI dialogue",
      "Up to 10 AI voices included",
      "Voice customization (age, accent, gender)",
      "Unlimited replays for 45 days",
      "Priority voice processing",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages / ~15 min)",
      "One act (up to 40 pages / ~40 min)",
    ],
    maxCharacters: 10,
    maxMinutes: 40,
    costBreakdown: {
      voiceCostPerMin: COST_PER_MIN,
      includedMinutes: 40,
      includedVoices: 10,
      overagePerMin: 0.45,
    },
  },
  {
    id: "three-act-pass",
    name: "Three Acts",
    price: 60,
    period: "one-time",
    description:
      "A full-length play — up to 120 min of AI audio with up to 20 voices",
    features: [
      "1 full-length script (up to 3 acts)",
      "Up to 120 minutes of AI dialogue",
      "Up to 20 AI voices included",
      "Voice customization (age, accent, gender)",
      "Unlimited replays for 60 days",
      "Priority voice processing",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages / ~15 min)",
      "One act (up to 40 pages / ~40 min)",
      "Three acts (up to 120 pages / ~120 min)",
    ],
    maxCharacters: 20,
    maxMinutes: 120,
    costBreakdown: {
      voiceCostPerMin: COST_PER_MIN,
      includedMinutes: 120,
      includedVoices: 20,
      overagePerMin: 0.40,
    },
    highlighted: true,
  },
  {
    id: "monthly",
    name: "Monthly Unlimited",
    price: 100,
    period: "monthly",
    description:
      "Unlimited scripts — up to 500 min/mo of AI audio with up to 25 voices",
    features: [
      "Unlimited script uploads",
      "500 minutes of AI dialogue per month",
      "Up to 25 AI voices per script",
      "All script lengths supported",
      "Premium ElevenLabs voices",
      "Voice customization (age, accent, gender)",
      "Priority voice processing",
      "Script history & favorites",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages / ~15 min)",
      "One act (up to 40 pages / ~40 min)",
      "Three acts (up to 120 pages / ~120 min)",
    ],
    maxCharacters: 25,
    maxMinutes: 500,
    costBreakdown: {
      voiceCostPerMin: COST_PER_MIN,
      includedMinutes: 500,
      includedVoices: 25,
      overagePerMin: 0.35,
    },
  },
  {
    id: "annual",
    name: "Annual Unlimited",
    price: 960,
    period: "annual",
    description:
      "Best value — 500 min/mo, 25 voices, save $240/yr vs monthly",
    features: [
      "Everything in Monthly Unlimited",
      "Save $240/year (20% off monthly)",
      "6,000 minutes of AI dialogue per year",
      "Up to 25 AI voices per script",
      "Early access to new voices",
      "Dedicated support",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages / ~15 min)",
      "One act (up to 40 pages / ~40 min)",
      "Three acts (up to 120 pages / ~120 min)",
    ],
    maxCharacters: 25,
    maxMinutes: 500,
    costBreakdown: {
      voiceCostPerMin: COST_PER_MIN,
      includedMinutes: 500,
      includedVoices: 25,
      overagePerMin: 0.30,
    },
    highlighted: true,
  },
];

// Manifest Financial payment processing
export interface ManifestPaymentIntent {
  planId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface ManifestSubscription {
  planId: string;
  customerEmail: string;
  status: "active" | "cancelled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export async function createPaymentIntent(
  plan: PricingPlan,
  customerEmail: string,
  customerName: string
): Promise<ManifestPaymentIntent> {
  // Integration point for Manifest Financial API
  // Replace this URL with your Manifest Financial endpoint
  const MANIFEST_API_URL =
    process.env.NEXT_PUBLIC_MANIFEST_FINANCIAL_API_URL ||
    "https://api.manifestfinancial.com/v1";

  const response = await fetch(`${MANIFEST_API_URL}/payments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MANIFEST_FINANCIAL_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: Math.round(plan.price * 100), // cents
      currency: "usd",
      description: `Line Runner - ${plan.name}`,
      customer_email: customerEmail,
      customer_name: customerName,
      metadata: {
        plan_id: plan.id,
        plan_period: plan.period,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Payment creation failed");
  }

  return response.json();
}

export async function createSubscription(
  plan: PricingPlan,
  customerEmail: string,
  paymentMethodId: string
): Promise<ManifestSubscription> {
  const MANIFEST_API_URL =
    process.env.NEXT_PUBLIC_MANIFEST_FINANCIAL_API_URL ||
    "https://api.manifestfinancial.com/v1";

  const response = await fetch(`${MANIFEST_API_URL}/subscriptions/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MANIFEST_FINANCIAL_SECRET_KEY}`,
    },
    body: JSON.stringify({
      plan_id: plan.id,
      customer_email: customerEmail,
      payment_method_id: paymentMethodId,
      interval: plan.period === "annual" ? "year" : "month",
      amount: Math.round(plan.price * 100),
      currency: "usd",
    }),
  });

  if (!response.ok) {
    throw new Error("Subscription creation failed");
  }

  return response.json();
}
