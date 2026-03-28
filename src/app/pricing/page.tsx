"use client";

import { useState } from "react";
import Link from "next/link";
import { PRICING_PLANS } from "@/lib/manifest-financial";
import type { PricingPlan } from "@/types";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"one-time" | "subscription">(
    "one-time"
  );
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredPlans =
    billingCycle === "one-time"
      ? PRICING_PLANS.filter((p) => p.period === "one-time")
      : PRICING_PLANS.filter(
          (p) => p.period === "monthly" || p.period === "annual"
        );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessing(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">You&apos;re all set!</h1>
        <p className="text-muted mb-2">
          Payment processed by{" "}
          <span className="text-foreground font-medium">
            Manifest Financial
          </span>
        </p>
        <p className="text-muted mb-8">
          Your <strong>{selectedPlan?.name}</strong> plan is now active.
        </p>
        <Link
          href="/upload"
          className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Upload Your Script
        </Link>
      </div>
    );
  }

  if (showCheckout && selectedPlan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <button
          onClick={() => {
            setShowCheckout(false);
            setSelectedPlan(null);
          }}
          className="text-base text-muted hover:text-foreground mb-6 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to plans
        </button>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {/* Order Summary */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4 text-center">Checkout</h1>
            <div className="bg-surface-light rounded-xl p-4 space-y-2 text-base">
              <div className="flex justify-between">
                <span className="text-muted">Plan</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">AI dialogue included</span>
                <span>{selectedPlan.costBreakdown.includedMinutes} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">AI voices included</span>
                <span>{selectedPlan.costBreakdown.includedVoices} voices</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Overage rate</span>
                <span>
                  ${selectedPlan.costBreakdown.overagePerMin.toFixed(2)}/min
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  ${selectedPlan.price.toFixed(2)}
                  {selectedPlan.period !== "one-time" &&
                    ` / ${selectedPlan.period === "annual" ? "year" : "month"}`}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="text-base text-muted block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-accent placeholder:text-muted/50"
              />
            </div>
            <div>
              <label className="text-base text-muted block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@example.com"
                className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-accent placeholder:text-muted/50"
              />
            </div>
            <div>
              <label className="text-base text-muted block mb-1.5">
                Card Number
              </label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                required
                className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-accent placeholder:text-muted/50 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-base text-muted block mb-1.5">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  required
                  className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-accent placeholder:text-muted/50 font-mono"
                />
              </div>
              <div>
                <label className="text-base text-muted block mb-1.5">
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  required
                  className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-accent placeholder:text-muted/50 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all mt-4 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Pay ${selectedPlan.price.toFixed(2)}
                  {selectedPlan.period !== "one-time" &&
                    ` / ${selectedPlan.period === "annual" ? "year" : "month"}`}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted mt-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Secured by Manifest Financial
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Pricing based on what you use
        </h1>
        <p className="text-muted text-xl max-w-2xl mx-auto mb-3">
          Every plan is priced on AI voice minutes and number of characters.
          Powered by premium ElevenLabs voices at{" "}
          <span className="text-foreground font-medium">$0.24/min</span>{" "}
          wholesale — we bundle it so you don&apos;t need your own API key.
        </p>
        <p className="text-muted text-lg max-w-xl mx-auto mb-8">
          ~1,000 characters of dialogue = ~1 minute of AI audio. A typical
          script page = ~1 minute.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setBillingCycle("one-time")}
            className={`px-6 py-2 rounded-lg text-lg font-medium transition-colors ${
              billingCycle === "one-time"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            One-Time
          </button>
          <button
            onClick={() => setBillingCycle("subscription")}
            className={`px-6 py-2 rounded-lg text-lg font-medium transition-colors relative ${
              billingCycle === "subscription"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Subscription
            <span className="absolute -top-2 -right-2 bg-success text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              SAVE
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div
        className={`grid gap-6 max-w-5xl mx-auto ${
          filteredPlans.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {filteredPlans.map((plan) => {
          const effectivePerMin =
            plan.period === "one-time"
              ? plan.price / plan.costBreakdown.includedMinutes
              : plan.period === "annual"
                ? plan.price / 12 / plan.costBreakdown.includedMinutes
                : plan.price / plan.costBreakdown.includedMinutes;
          const perVoice =
            plan.price / plan.costBreakdown.includedVoices;

          return (
            <div
              key={plan.id}
              className={`relative bg-surface border rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "border-accent shadow-lg shadow-accent/10"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-sm font-bold px-4 py-1 rounded-full">
                  {plan.period === "one-time" ? "BEST FOR FULL PLAYS" : "BEST VALUE"}
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                <p className="text-lg text-muted">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="text-5xl font-bold">
                  ${plan.price.toFixed(2)}
                </span>
                {plan.period !== "one-time" && (
                  <span className="text-muted text-lg">
                    /{plan.period === "annual" ? "year" : "month"}
                  </span>
                )}
                {plan.period === "annual" && (
                  <div className="text-lg text-success mt-1">
                    Save $240/year vs monthly ($80/mo effective)
                  </div>
                )}
              </div>

              {/* Usage Breakdown — the key new section */}
              <div className="bg-surface-light/50 border border-border rounded-xl p-4 mb-5">
                <div className="text-base uppercase tracking-wider text-muted font-medium mb-3">
                  What&apos;s Included
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent-light">
                      {plan.costBreakdown.includedMinutes}
                    </div>
                    <div className="text-sm text-muted">
                      min of AI audio
                      {plan.period === "monthly" && "/mo"}
                      {plan.period === "annual" && "/mo"}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-2xl font-bold text-accent-light">
                      {plan.costBreakdown.includedVoices}
                    </div>
                    <div className="text-base text-muted">AI voices</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      ${effectivePerMin.toFixed(2)}
                    </div>
                    <div className="text-base text-muted">effective /min</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-lg font-bold text-foreground">
                      ${perVoice.toFixed(2)}
                    </div>
                    <div className="text-base text-muted">per voice</div>
                  </div>
                </div>
                <div className="mt-3 text-base text-muted text-center">
                  Overage: ${plan.costBreakdown.overagePerMin.toFixed(2)}/min
                  beyond included minutes
                </div>
              </div>

              {/* Script lengths */}
              <div className="mb-5">
                <div className="text-base uppercase tracking-wider text-muted font-medium mb-2">
                  Script Lengths
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.scriptLengths.map((sl) => (
                    <span
                      key={sl}
                      className="text-base bg-surface-light px-2.5 py-1 rounded-full text-muted"
                    >
                      {sl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-lg"
                  >
                    <svg className="w-5 h-5 text-success shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowCheckout(true);
                }}
                className={`w-full py-3.5 rounded-xl text-lg font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/25"
                    : "bg-surface-light hover:bg-border text-foreground"
                }`}
              >
                {plan.period === "one-time" ? "Buy Now" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Cost Comparison Table */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">
          Cost at a glance
        </h2>
        <p className="text-muted text-center text-lg mb-8">
          Based on ElevenLabs Pro-tier voice generation ($0.24/min wholesale)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-lg">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">
                  Script Type
                </th>
                <th className="text-center py-3 px-4 text-muted font-medium">
                  Duration
                </th>
                <th className="text-center py-3 px-4 text-muted font-medium">
                  Typical Voices
                </th>
                <th className="text-center py-3 px-4 text-muted font-medium">
                  AI Voice Cost
                </th>
                <th className="text-center py-3 px-4 text-muted font-medium">
                  Our Price
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">Short Episode</td>
                <td className="py-3 px-4 text-center text-muted">
                  ~15 min
                </td>
                <td className="py-3 px-4 text-center text-muted">
                  2-5 voices
                </td>
                <td className="py-3 px-4 text-center text-muted font-mono">
                  ~$5
                </td>
                <td className="py-3 px-4 text-center font-semibold text-accent-light">
                  $10
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">One Act</td>
                <td className="py-3 px-4 text-center text-muted">
                  ~40 min
                </td>
                <td className="py-3 px-4 text-center text-muted">
                  4-10 voices
                </td>
                <td className="py-3 px-4 text-center text-muted font-mono">
                  ~$15
                </td>
                <td className="py-3 px-4 text-center font-semibold text-accent-light">
                  $20
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">Three Acts</td>
                <td className="py-3 px-4 text-center text-muted">
                  ~120 min
                </td>
                <td className="py-3 px-4 text-center text-muted">
                  8-20 voices
                </td>
                <td className="py-3 px-4 text-center text-muted font-mono">
                  ~$30
                </td>
                <td className="py-3 px-4 text-center font-semibold text-accent-light">
                  $60
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  Unlimited (Monthly)
                </td>
                <td className="py-3 px-4 text-center text-muted">
                  500 min/mo
                </td>
                <td className="py-3 px-4 text-center text-muted">
                  Up to 25
                </td>
                <td className="py-3 px-4 text-center text-muted font-mono">
                  ~$150 /mo
                </td>
                <td className="py-3 px-4 text-center font-semibold text-accent-light">
                  $100/mo
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-base text-muted text-center mt-4">
          AI voice cost = minutes x $0.24/min (ElevenLabs) + voices x
          $0.10/voice overhead. Our pricing bundles everything so you never
          need your own ElevenLabs account.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center gap-8 text-lg text-muted flex-wrap">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Secure payments
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Manifest Financial
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No ElevenLabs account needed
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "How are AI voice minutes calculated?",
              a: "Roughly 1,000 characters of dialogue equals 1 minute of AI-generated audio. A typical script page with dialogue runs about 1 minute. Only the AI characters' lines count — your lines aren't generated since you speak them live.",
            },
            {
              q: "Why does the number of voices affect pricing?",
              a: "Each unique AI voice requires its own ElevenLabs voice processing slot. More characters in your script means more distinct voices to generate, which increases the underlying cost. Our plans bundle generous voice counts so you're covered.",
            },
            {
              q: "What happens if I go over my included minutes?",
              a: "One-time plans are capped at their included minutes. Subscription plans allow overages at a discounted per-minute rate ($0.30-$0.35/min) billed at the end of your cycle.",
            },
            {
              q: "What's the wholesale voice cost you mention?",
              a: "We use ElevenLabs Pro-tier API pricing at $0.24 per 1,000 characters (~1 minute of audio), plus $0.10 per unique voice for processing overhead. Our plans bundle this so you never need your own ElevenLabs API key.",
            },
            {
              q: "Can I customize the AI voices?",
              a: "Yes! Each AI character voice can be adjusted for gender, age range (child, young adult, adult, elderly), accent (12+ options including British RP, Cockney, Australian, Southern US, and more), pitch, and speed.",
            },
            {
              q: "What script formats do you support?",
              a: "PDF and plain text (.txt) files. Our parser automatically detects character names, dialogue, acts, scenes, and stage directions from standard script formatting.",
            },
            {
              q: "Who processes payments?",
              a: "All payments are securely processed by Manifest Financial. We never store your card details on our servers.",
            },
            {
              q: "Can I cancel my subscription?",
              a: "Absolutely. Monthly and annual subscriptions can be cancelled anytime. You keep access through the end of your billing period.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group bg-surface border border-border rounded-xl"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer text-lg font-medium">
                {faq.q}
                <svg
                  className="w-5 h-5 text-muted group-open:rotate-180 transition-transform shrink-0 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-lg text-muted leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
