import { PricingPlan, CreditBlock } from "@/types";

// ── Gemini TTS cost model ─────────────────────────────────────────
// Gemini TTS is billed per character via Google AI API
// ~1,000 credits = ~1 minute of generated audio
// Cost per 1K credits: $0.198 (estimated usage-based)
// ────────────────────────────────────────────────────────────────────

const COST_PER_1K_CREDITS = 0.198;

export function estimateCreditCost(credits: number): number {
  return (credits / 1000) * COST_PER_1K_CREDITS;
}

// ── Credit Blocks (available to Pro & Studio) ─────────────────────
// All blocks are profitable at 60-75% margin
export const CREDIT_BLOCKS: CreditBlock[] = [
  {
    id: "block_10",
    credits: 10_000,
    minutes: 10,
    price: 8,          // cost $1.98 → margin $6.02 (75%)
    perMinute: 0.80,
    savings: "",
  },
  {
    id: "block_30",
    credits: 30_000,
    minutes: 30,
    price: 20,         // cost $5.94 → margin $14.06 (70%)
    perMinute: 0.67,
    savings: "Save 17%",
  },
  {
    id: "block_60",
    credits: 60_000,
    minutes: 60,
    price: 35,         // cost $11.88 → margin $23.12 (66%)
    perMinute: 0.58,
    savings: "Save 27%",
  },
  {
    id: "block_120",
    credits: 120_000,
    minutes: 120,
    price: 60,         // cost $23.76 → margin $36.24 (60%)
    perMinute: 0.50,
    savings: "Best value",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "monthly",
    description: "Try Line Runner — no credit card required",
    features: [
      "1 complete scene run per month",
      "2,500 credits (~2.5 min of AI audio)",
      "Basic AI voice options (3 voices)",
      "Script analysis on upload",
      "Standard rehearsal mode",
      "Line Memory Tracker",
    ],
    scriptLengths: ["Short episode (up to 15 pages)"],
    maxCharacters: 3,
    maxMinutes: 2.5,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 2.5,   // cost: $0.50
      includedVoices: 3,
      overagePerMin: 0,       // no overage on free
    },
  },
  {
    id: "monthly",
    name: "Pro",
    price: 20,
    period: "monthly",
    // 40K credits: cost 40 × $0.198 = $7.92 → margin: $12.08 (60%)
    description: "40,000 credits/month — all rehearsal modes, AI coaching, and recording tools",
    features: [
      "40,000 credits per month (~40 min of AI audio)",
      "Unlimited scene runs",
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
    maxMinutes: 40,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 40,
      includedVoices: 10,
      overagePerMin: 0.80,    // block rate (per-min on smallest block)
      creditBlocks: CREDIT_BLOCKS,
    },
    highlighted: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 70,
    period: "monthly",
    // 75K credits: cost 75 × $0.198 = $14.85 → margin: $55.15 (78.8%)
    description: "75,000 credits/month — the complete professional platform with VO tools, income streams, and business dashboard",
    features: [
      "75,000 credits per month (~75 min of AI audio)",
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
      "Buy credit blocks at a discount",
      "Priority support",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages)",
      "One act (up to 40 pages)",
      "Three acts (up to 120 pages)",
    ],
    maxCharacters: 25,
    maxMinutes: 75,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 75,
      includedVoices: 25,
      overagePerMin: 0.50,    // block rate (per-min on largest block — Studio gets best rate)
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
