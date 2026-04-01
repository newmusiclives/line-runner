import { PricingPlan } from "@/types";

// ── ElevenLabs cost model ──────────────────────────────────────────
// 1 credit = 1 character of text-to-speech
// ~1,000 credits = ~1 minute of generated audio
// ElevenLabs plans: $22/mo = 100K credits, $99/mo = 500K credits
// Cost per 1K credits on $99 plan: $0.198
// ────────────────────────────────────────────────────────────────────

const COST_PER_1K_CREDITS = 0.198;

export function estimateCreditCost(credits: number): number {
  return (credits / 1000) * COST_PER_1K_CREDITS;
}

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
      includedMinutes: 2.5,
      includedVoices: 3,
      overagePerMin: 0,
    },
  },
  {
    id: "monthly",
    name: "Pro",
    price: 20,
    period: "monthly",
    description: "50,000 credits/month — unlimited rehearsals with full voice customisation, all modes, AI coaching, and recording tools",
    features: [
      "50,000 credits per month (~50 min of AI audio)",
      "Unlimited scene runs",
      "All 10 rehearsal modes",
      "Full voice customisation (age, accent, gender, pitch, speed)",
      "Up to 25 AI voices per script",
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
      "All script lengths supported",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages)",
      "One act (up to 40 pages)",
      "Three acts (up to 120 pages)",
    ],
    maxCharacters: 25,
    maxMinutes: 50,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 50,
      includedVoices: 25,
      overagePerMin: 0.20,
    },
    highlighted: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 90,
    period: "monthly",
    description: "150,000 credits/month — the complete professional platform with VO tools, income streams, and business dashboard",
    features: [
      "150,000 credits per month (~150 min of AI audio)",
      "Everything in Pro",
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
      "Voice Print Builder (ElevenLabs)",
      "STUDIO Business Dashboard",
      "Priority support",
    ],
    scriptLengths: [
      "Short episode (up to 15 pages)",
      "One act (up to 40 pages)",
      "Three acts (up to 120 pages)",
    ],
    maxCharacters: 25,
    maxMinutes: 150,
    costBreakdown: {
      voiceCostPerMin: COST_PER_1K_CREDITS,
      includedMinutes: 150,
      includedVoices: 25,
      overagePerMin: 0.15,
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
