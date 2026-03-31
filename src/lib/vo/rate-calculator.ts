import type { VOJobType, UsageScope, RateQuote, NegotiationScript } from "@/types";

/**
 * Feature 29: Rate Calculator and Negotiation Coach
 * GVAA-based rate guidelines for voice actors.
 */

// Rates in cents — GVAA 2024/2025 guidelines (approximate)
const RATE_TABLE: Record<VOJobType, Record<UsageScope, { min: number; mid: number; max: number }>> = {
  "broadcast-tv": {
    local: { min: 25000, mid: 40000, max: 75000 },
    regional: { min: 40000, mid: 65000, max: 100000 },
    national: { min: 75000, mid: 150000, max: 300000 },
    global: { min: 150000, mid: 250000, max: 500000 },
    "digital-only": { min: 30000, mid: 50000, max: 80000 },
    broadcast: { min: 75000, mid: 150000, max: 300000 },
  },
  "national-radio": {
    local: { min: 15000, mid: 25000, max: 40000 },
    regional: { min: 25000, mid: 40000, max: 65000 },
    national: { min: 40000, mid: 75000, max: 150000 },
    global: { min: 60000, mid: 100000, max: 200000 },
    "digital-only": { min: 15000, mid: 30000, max: 50000 },
    broadcast: { min: 40000, mid: 75000, max: 150000 },
  },
  "e-learning": {
    local: { min: 20000, mid: 30000, max: 50000 },
    regional: { min: 25000, mid: 40000, max: 60000 },
    national: { min: 30000, mid: 50000, max: 75000 },
    global: { min: 40000, mid: 65000, max: 100000 },
    "digital-only": { min: 20000, mid: 35000, max: 55000 },
    broadcast: { min: 30000, mid: 50000, max: 75000 },
  },
  audiobook: {
    local: { min: 15000, mid: 25000, max: 40000 },
    regional: { min: 15000, mid: 25000, max: 40000 },
    national: { min: 20000, mid: 35000, max: 50000 },
    global: { min: 25000, mid: 40000, max: 60000 },
    "digital-only": { min: 15000, mid: 25000, max: 40000 },
    broadcast: { min: 20000, mid: 35000, max: 50000 },
  },
  "video-game": {
    local: { min: 20000, mid: 35000, max: 50000 },
    regional: { min: 25000, mid: 40000, max: 65000 },
    national: { min: 35000, mid: 60000, max: 100000 },
    global: { min: 50000, mid: 85000, max: 150000 },
    "digital-only": { min: 25000, mid: 40000, max: 65000 },
    broadcast: { min: 35000, mid: 60000, max: 100000 },
  },
  "corporate-internal": {
    local: { min: 15000, mid: 25000, max: 35000 },
    regional: { min: 20000, mid: 30000, max: 45000 },
    national: { min: 25000, mid: 40000, max: 60000 },
    global: { min: 30000, mid: 50000, max: 75000 },
    "digital-only": { min: 15000, mid: 25000, max: 40000 },
    broadcast: { min: 25000, mid: 40000, max: 60000 },
  },
  "podcast-sponsorship": {
    local: { min: 10000, mid: 20000, max: 30000 },
    regional: { min: 15000, mid: 25000, max: 40000 },
    national: { min: 20000, mid: 35000, max: 55000 },
    global: { min: 25000, mid: 45000, max: 70000 },
    "digital-only": { min: 10000, mid: 20000, max: 35000 },
    broadcast: { min: 20000, mid: 35000, max: 55000 },
  },
  "commercial-digital": {
    local: { min: 15000, mid: 25000, max: 40000 },
    regional: { min: 25000, mid: 40000, max: 60000 },
    national: { min: 40000, mid: 65000, max: 100000 },
    global: { min: 60000, mid: 100000, max: 175000 },
    "digital-only": { min: 15000, mid: 25000, max: 40000 },
    broadcast: { min: 40000, mid: 65000, max: 100000 },
  },
  "promo-imaging": {
    local: { min: 20000, mid: 35000, max: 50000 },
    regional: { min: 30000, mid: 50000, max: 75000 },
    national: { min: 50000, mid: 80000, max: 125000 },
    global: { min: 70000, mid: 110000, max: 175000 },
    "digital-only": { min: 25000, mid: 40000, max: 60000 },
    broadcast: { min: 50000, mid: 80000, max: 125000 },
  },
  "medical-narration": {
    local: { min: 25000, mid: 40000, max: 60000 },
    regional: { min: 30000, mid: 50000, max: 75000 },
    national: { min: 40000, mid: 65000, max: 100000 },
    global: { min: 50000, mid: 85000, max: 130000 },
    "digital-only": { min: 25000, mid: 45000, max: 65000 },
    broadcast: { min: 40000, mid: 65000, max: 100000 },
  },
  animation: {
    local: { min: 20000, mid: 35000, max: 55000 },
    regional: { min: 30000, mid: 50000, max: 80000 },
    national: { min: 45000, mid: 75000, max: 125000 },
    global: { min: 65000, mid: 110000, max: 200000 },
    "digital-only": { min: 25000, mid: 40000, max: 65000 },
    broadcast: { min: 45000, mid: 75000, max: 125000 },
  },
  documentary: {
    local: { min: 15000, mid: 30000, max: 45000 },
    regional: { min: 25000, mid: 40000, max: 60000 },
    national: { min: 35000, mid: 60000, max: 90000 },
    global: { min: 50000, mid: 80000, max: 125000 },
    "digital-only": { min: 20000, mid: 35000, max: 55000 },
    broadcast: { min: 35000, mid: 60000, max: 90000 },
  },
};

export function calculateRate(jobType: VOJobType, usageScope: UsageScope): RateQuote {
  const rates = RATE_TABLE[jobType][usageScope];
  return {
    jobType,
    usageScope,
    gvaaMinimum: rates.min,
    marketMidpoint: rates.mid,
    premiumRate: rates.max,
    suggestedQuote: Math.round(rates.mid * 1.1), // Suggest slightly above midpoint
  };
}

export const JOB_TYPE_LABELS: Record<VOJobType, string> = {
  "broadcast-tv": "Broadcast TV Commercial",
  "national-radio": "National Radio",
  "e-learning": "E-Learning Module",
  audiobook: "Audiobook (per finished hour)",
  "video-game": "Video Game Character",
  "corporate-internal": "Corporate Internal",
  "podcast-sponsorship": "Podcast Sponsorship",
  "commercial-digital": "Commercial (Digital)",
  "promo-imaging": "Promo / Imaging",
  "medical-narration": "Medical / Pharmaceutical",
  animation: "Animation / Character",
  documentary: "Documentary Narration",
};

export const USAGE_SCOPE_LABELS: Record<UsageScope, string> = {
  local: "Local / Single Market",
  regional: "Regional",
  national: "National",
  global: "Global / Worldwide",
  "digital-only": "Digital Only",
  broadcast: "Broadcast (TV + Radio)",
};

export const NEGOTIATION_SCRIPTS: NegotiationScript[] = [
  {
    scenario: "That's over our budget",
    response: "I understand budget constraints. My rate reflects the quality and professionalism I bring to every project. I can offer a slightly adjusted rate of [suggested quote minus 10%] if we limit the usage to [narrower scope]. Would that work for your needs?",
    strategy: "counter",
  },
  {
    scenario: "We're a small company",
    response: "I appreciate you sharing that. Company size doesn't change the value the voiceover brings to your project — it still needs to sound professional and connect with your audience. I can offer [suggested quote minus 15%] for a time-limited license of one year, with renewal options.",
    strategy: "counter",
  },
  {
    scenario: "Can you do a buyout?",
    response: "Buyouts transfer all future usage rights permanently. For a full buyout, the rate would be [premium rate]. Alternatively, I can offer a 2-year license at [midpoint rate] which gives you extended use while keeping the investment manageable.",
    strategy: "hold-firm",
  },
  {
    scenario: "This is great exposure",
    response: "I appreciate the opportunity, but exposure doesn't cover studio time, equipment costs, or the years of training behind my performance. My rate of [suggested quote] reflects fair market value for professional voiceover. I'd love to work with you at a rate that respects both our businesses.",
    strategy: "hold-firm",
  },
  {
    scenario: "We just need a quick read",
    response: "Even a quick read requires preparation, studio setup, and professional delivery. My minimum session fee is [GVAA minimum] which covers the first hour. For a truly short script, I can often deliver within that session — so you're getting great value.",
    strategy: "hold-firm",
  },
];
