import { PricingPlan, CreditBlock } from "@/types";

// ── Gemini TTS cost model ─────────────────────────────────────────
// Gemini 2.5 Flash TTS billed per character via Google AI API.
// 1,000 credits == 1 minute of generated audio.
// Cost basis: $0.08 / minute (Gemini Flash GA pricing, conservative).
// All published plans target ≥50% net margin after Stripe fees.
// ────────────────────────────────────────────────────────────────────

const COST_PER_1K_CREDITS = 0.08;

export function estimateCreditCost(credits: number): number {
  return (credits / 1000) * COST_PER_1K_CREDITS;
}

// ── Pay-per-use credit blocks ─────────────────────────────────────
// Available to ANY logged-in user (subscribers and non-subscribers).
// Per-minute rates are 2-3x subscription rate to anchor subscriptions
// as the obviously-better deal for any regular user.
//   Pro effective rate: $20 / 110 min  = $0.18/min
//   Cheapest PPU rate: $5 / 10 min     = $0.50/min  (~2.7x Pro)
export const CREDIT_BLOCKS: CreditBlock[] = [
  {
    id: "block_10",
    credits: 10_000,
    minutes: 10,
    price: 5,           // cost $0.80 + Stripe ~$0.45 → margin $3.75 (75%)
    perMinute: 0.50,
    savings: "",
  },
  {
    id: "block_40",
    credits: 40_000,
    minutes: 40,
    price: 15,          // cost $3.20 + Stripe ~$0.74 → margin $11.06 (74%)
    perMinute: 0.375,
    savings: "Save 25%",
  },
  {
    id: "block_100",
    credits: 100_000,
    minutes: 100,
    price: 30,          // cost $8.00 + Stripe ~$1.17 → margin $20.83 (69%)
    perMinute: 0.30,
    savings: "Best value",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "monthly",
    description: "Browse the demo library and try one of your own scripts — no credit card required",
    features: [
      "Full demo library (pre-recorded scenes, no signup)",
      "1 personal script upload",
      "5 minutes of AI audio for your own script",
      "Basic AI voice options (6 presets)",
      "Script analysis on upload",
      "Standard rehearsal mode",
      "Line Memory Tracker",
    ],
    scriptLengths: ["Short episode (up to 15 pages)"],
    maxCharacters: 3,
    maxMinutes: 5,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 5,   // cost: $0.40
      includedVoices: 6,
      overagePerMin: 0,     // no overage on free — they buy a block or subscribe
    },
  },
  {
    id: "monthly",
    name: "Pro",
    price: 20,
    period: "monthly",
    // 110 min: cost 110 × $0.08 = $8.80 + Stripe $0.88 → net $10.32 (51.6%)
    description: "110 minutes of AI audio per month — all rehearsal modes, AI coaching, and recording tools",
    features: [
      "110 minutes of AI audio per month",
      "Unlimited scene runs and uploads",
      "All 10 rehearsal modes",
      "Full voice customisation (age, accent, gender, pitch, speed)",
      "Up to 10 AI voices per script",
      "AI Performance Coach (notes after every take)",
      "Script Analysis, Subtext Mode, Wildcard Mode",
      "Objective & Obstacle, Relationship Dynamics",
      "Emotional Arc Mapping",
      "Line Memory Tracker with warm-up drills",
      "Annotation Layer (8 types + voice memos)",
      "Audition Vault (searchable archive)",
      "Self-Tape Studio with 1080p export",
      "Pre-Audition Ritual & Sleep Learning Mode",
      "Scene Exchange (human partners)",
      "Cold Read & Director's Cut Mode",
      "Buy credit blocks when you need more",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages)",
      "One act (up to 40 pages)",
      "Three acts (up to 120 pages)",
    ],
    maxCharacters: 10,
    maxMinutes: 110,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 110,
      includedVoices: 10,
      overagePerMin: 0.50,    // smallest block rate
      creditBlocks: CREDIT_BLOCKS,
    },
    highlighted: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 70,
    period: "monthly",
    // 400 min: cost 400 × $0.08 = $32.00 + Stripe $2.33 → net $35.67 (51.0%)
    description: "400 minutes of AI audio per month — the complete professional platform with VO tools, income streams, and business dashboard",
    features: [
      "400 minutes of AI audio per month",
      "Everything in Pro",
      "Up to 25 AI voices per script",
      "Voice Actor Professional Suite (10 tools)",
      "Audio Quality Monitor",
      "Pronunciation Coach + dictionary",
      "Breath & Plosive Detector",
      "ADR & Dubbing Mode",
      "Copy Timing Calibrator",
      "Character Voice Consistency Checker",
      "Demo Reel Producer (7 genres + music beds)",
      "Client Delivery Portal (invoice + usage rights)",
      "Rate Calculator & Negotiation Coach",
      "VO Genre Training Curriculum (7 genres, 5 levels)",
      "Monologue Masterclass (sell your takes)",
      "Line Runner PASS (fan memberships)",
      "Voice Print Builder (Gemini)",
      "STUDIO Business Dashboard",
      "Top-up blocks from $5 anytime",
      "Priority support",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages)",
      "One act (up to 40 pages)",
      "Three acts (up to 120 pages)",
    ],
    maxCharacters: 25,
    maxMinutes: 400,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 400,
      includedVoices: 25,
      overagePerMin: 0.30,    // best block rate
      creditBlocks: CREDIT_BLOCKS,
    },
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
      amount: Math.round(plan.price * 100),
      currency: "usd",
      description: `Line Runner - ${plan.name}`,
      customer_email: customerEmail,
      customer_name: customerName,
      metadata: { plan_id: plan.id, plan_period: plan.period },
    }),
  });

  if (!response.ok) throw new Error("Payment creation failed");
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
      interval: "month",
      amount: Math.round(plan.price * 100),
      currency: "usd",
    }),
  });

  if (!response.ok) throw new Error("Subscription creation failed");
  return response.json();
}
