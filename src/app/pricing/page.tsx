"use client";

import { useState } from "react";
import Link from "next/link";
import type { PricingPlan } from "@/types";
import { PRICING_PLANS, CREDIT_BLOCKS } from "@/lib/manifest-financial";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

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
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">You&apos;re all set!</h1>
        <p className="text-muted mb-2">Payment processed by <span className="text-foreground font-medium">Manifest Financial</span></p>
        <p className="text-muted mb-8">Your <strong>{selectedPlan?.name}</strong> plan is now active.</p>
        <Link href="/upload" className="inline-block bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors">Start Rehearsing</Link>
      </div>
    );
  }

  if (showCheckout && selectedPlan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <button onClick={() => { setShowCheckout(false); setSelectedPlan(null); }} className="text-sm text-muted hover:text-foreground mb-6 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to plans
        </button>
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-4 text-center">Checkout</h1>
          <div className="bg-surface-light rounded-xl p-4 space-y-2 text-sm mb-8">
            <div className="flex justify-between"><span className="text-muted">Plan</span><span className="font-medium">{selectedPlan.name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Credits</span><span>{selectedPlan.costBreakdown.includedMinutes * 1000}/month</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total</span><span>${selectedPlan.price}/month</span>
            </div>
          </div>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="text-sm text-muted block mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-muted/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-muted/50" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Card Number</label>
              <input type="text" placeholder="4242 4242 4242 4242" required className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-muted/50 font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted block mb-1.5">Expiry</label>
                <input type="text" placeholder="MM / YY" required className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-muted/50 font-mono" />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1.5">CVC</label>
                <input type="text" placeholder="123" required className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-muted/50 font-mono" />
              </div>
            </div>
            <button type="submit" disabled={processing} className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all mt-4 flex items-center justify-center gap-2">
              {processing ? (<><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Processing...</>) : (<>Subscribe — ${selectedPlan.price}/month</>)}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted mt-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
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
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-muted text-xl max-w-2xl mx-auto mb-2">
          Every plan is based on credits. 1 credit = 1 character of AI-generated dialogue. ~1,000 credits = ~1 minute of audio.
        </p>
        <p className="text-muted text-lg">Start free. Upgrade when you&apos;re ready. Cancel anytime.</p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-16">
        {/* Free */}
        <div className="bg-surface border border-border rounded-2xl p-7 flex flex-col">
          <h3 className="text-2xl font-bold mb-1">Free</h3>
          <p className="text-sm text-muted mb-5">Try Line Runner — no credit card required</p>
          <div className="text-4xl font-bold mb-1">$0</div>
          <div className="text-sm text-muted mb-6">forever</div>

          <div className="bg-surface-light rounded-xl p-3 mb-5 text-center">
            <div className="text-lg font-bold text-foreground">1 scene</div>
            <div className="text-xs text-muted">per month · 2,500 credits</div>
          </div>

          <ul className="space-y-2.5 mb-8 flex-1">
            {["1 scene run per month", "2,500 credits (~2.5 min AI audio)", "3 basic AI voices", "Standard rehearsal mode", "Script analysis on upload", "Line Memory Tracker", "Teleprompter mode", "Bookmarks"].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted">
                <svg className="w-4 h-4 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {f}
              </li>
            ))}
          </ul>
          <Link href="/auth/register" className="w-full py-3 rounded-xl text-center font-semibold transition-all bg-surface-light hover:bg-border text-foreground block">Get Started Free</Link>
        </div>

        {/* Pro */}
        <div className="bg-surface border-2 border-accent rounded-2xl p-7 flex flex-col relative shadow-lg shadow-accent/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
          <h3 className="text-2xl font-bold mb-1">Pro</h3>
          <p className="text-sm text-muted mb-5">For working actors who rehearse regularly</p>
          <div className="text-4xl font-bold mb-1">$20</div>
          <div className="text-sm text-muted mb-6">per month</div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-5 text-center">
            <div className="text-lg font-bold text-accent-light">40,000 credits</div>
            <div className="text-xs text-muted">~40 minutes of AI audio/month</div>
          </div>

          <ul className="space-y-2.5 mb-8 flex-1">
            {[
              "40,000 credits/month",
              "Unlimited scene runs",
              "All 10 rehearsal modes",
              "10 AI voices, full customisation",
              "AI Performance Coach",
              "Subtext, Wildcard, Cold Read",
              "Emotional Arc + Relationship Dynamics",
              "Annotations (8 types + voice memos)",
              "Self-Tape Studio with 1080p export",
              "Audition Vault + Scene Exchange",
              "Credit blocks from $8 when you need more",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted">
                <svg className="w-4 h-4 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {f}
              </li>
            ))}
          </ul>
          <button onClick={() => { setSelectedPlan(PRICING_PLANS[1]); setShowCheckout(true); }} className="w-full py-3 rounded-xl font-semibold transition-all bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/25">Start Free Trial</button>
        </div>

        {/* Studio */}
        <div className="bg-surface border border-border rounded-2xl p-7 flex flex-col">
          <h3 className="text-2xl font-bold mb-1">Studio</h3>
          <p className="text-sm text-muted mb-5">For professional actors and voice artists</p>
          <div className="text-4xl font-bold mb-1">$70</div>
          <div className="text-sm text-muted mb-6">per month</div>

          <div className="bg-success/10 border border-success/20 rounded-xl p-3 mb-5 text-center">
            <div className="text-lg font-bold text-success">75,000 credits</div>
            <div className="text-xs text-muted">~75 minutes of AI audio/month</div>
          </div>

          <ul className="space-y-2.5 mb-8 flex-1">
            {[
              "75,000 credits/month",
              "Everything in Pro + 25 voices",
              "VO Professional Suite (10 tools)",
              "Demo Reel Producer (7 genres)",
              "Client Delivery Portal",
              "Rate Calculator & Negotiation Coach",
              "VO Genre Training (105 scripts)",
              "Monologue Masterclass (sell & earn)",
              "PASS fan memberships (earn)",
              "Voice Print Builder (Gemini)",
              "STUDIO Business Dashboard",
              "Credit blocks at best rates",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span className={f.startsWith("Everything") ? "font-medium text-foreground" : "text-muted"}>{f}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => { setSelectedPlan(PRICING_PLANS[2]); setShowCheckout(true); }} className="w-full py-3 rounded-xl font-semibold transition-all bg-surface-light hover:bg-border text-foreground">Get Studio</button>
        </div>

        {/* Enterprise */}
        <div className="bg-surface border border-border rounded-2xl p-7 flex flex-col bg-gradient-to-b from-warning/5 to-transparent">
          <h3 className="text-2xl font-bold mb-1">Enterprise</h3>
          <p className="text-sm text-muted mb-5">For stage schools, theatre companies, and organisations</p>
          <div className="text-4xl font-bold mb-1">Custom</div>
          <div className="text-sm text-muted mb-6">tailored to your needs</div>

          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-5 text-center">
            <div className="text-lg font-bold text-warning">Unlimited credits</div>
            <div className="text-xs text-muted">volume pricing available</div>
          </div>

          <ul className="space-y-2.5 mb-8 flex-1">
            {[
              "Everything in Studio",
              "Unlimited credits (volume pricing)",
              "Multi-seat admin dashboard",
              "Student & faculty accounts",
              "Director's Cut for teacher notes",
              "Bulk script upload & management",
              "Custom VO Curriculum modules",
              "Co-branded platform option",
              "Dedicated account manager",
              "SSO / institutional login",
              "Annual invoicing available",
              "SLA & priority support",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span className={f.startsWith("Everything") ? "font-medium text-foreground" : "text-muted"}>{f}</span>
              </li>
            ))}
          </ul>
          <a href="mailto:enterprise@linerunner.app" className="w-full py-3 rounded-xl font-semibold transition-all bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 block text-center">Contact Sales</a>
        </div>
      </div>

      {/* Credit Blocks */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Need more credits?</h2>
          <p className="text-muted">Pro and Studio subscribers can buy credit blocks anytime. No expiry — use them at your own pace.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_BLOCKS.map((block) => (
            <div key={block.id} className={`bg-surface border rounded-2xl p-5 text-center relative ${block.savings === "Best value" ? "border-success shadow-lg shadow-success/10" : "border-border"}`}>
              {block.savings && (
                <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full ${block.savings === "Best value" ? "bg-success text-white" : "bg-accent/15 text-accent-light"}`}>
                  {block.savings}
                </div>
              )}
              <div className="text-2xl font-bold mt-1">{block.minutes} min</div>
              <div className="text-xs text-muted mb-3">{block.credits.toLocaleString()} credits</div>
              <div className="text-3xl font-bold text-accent-light">${block.price}</div>
              <div className="text-xs text-muted mt-1">${block.perMinute.toFixed(2)}/min</div>
            </div>
          ))}
        </div>
      </div>

      {/* Credits Explainer */}
      <div className="max-w-3xl mx-auto bg-surface border border-border rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-center mb-6">How credits work</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-center mb-6">
          <div>
            <div className="text-3xl font-bold text-accent-light mb-1">1 credit</div>
            <div className="text-sm text-muted">= 1 character of AI dialogue</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-light mb-1">~1,000</div>
            <div className="text-sm text-muted">credits = ~1 minute of audio</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent-light mb-1">~1 page</div>
            <div className="text-sm text-muted">of script = ~1,000 credits</div>
          </div>
        </div>
        <p className="text-sm text-muted text-center">Only the AI characters&apos; lines consume credits — your lines are spoken live, so they&apos;re free. A typical 15-page short episode uses ~8,000-12,000 credits per full run-through (since only the AI&apos;s half of the dialogue is generated).</p>
      </div>

      {/* Feature Comparison */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Compare plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-muted font-medium w-24">Free</th>
                <th className="text-center py-3 px-4 font-medium w-24 text-accent-light">Pro</th>
                <th className="text-center py-3 px-4 text-muted font-medium w-24">Studio</th>
                <th className="text-center py-3 px-4 text-muted font-medium w-24">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Monthly credits", free: "2,500", pro: "40,000", studio: "75,000", enterprise: "Unlimited" },
                { feature: "Credit blocks", free: "—", pro: "From $8", studio: "From $8", enterprise: "Volume" },
                { feature: "Scene runs", free: "1/month", pro: "Unlimited", studio: "Unlimited", enterprise: "Unlimited" },
                { feature: "AI voices per script", free: "3", pro: "10", studio: "25", enterprise: "25+" },
                { feature: "Rehearsal modes", free: "Standard", pro: "All 10", studio: "All 10", enterprise: "All 10" },
                { feature: "Script analysis", free: true, pro: true, studio: true, enterprise: true },
                { feature: "Line Memory Tracker", free: true, pro: true, studio: true, enterprise: true },
                { feature: "Bookmarks", free: true, pro: true, studio: true, enterprise: true },
                { feature: "Teleprompter", free: true, pro: true, studio: true, enterprise: true },
                { feature: "AI Performance Coach", free: false, pro: true, studio: true, enterprise: true },
                { feature: "Subtext, Wildcard, Cold Read", free: false, pro: true, studio: true, enterprise: true },
                { feature: "Annotations (8 types + voice)", free: false, pro: true, studio: true, enterprise: true },
                { feature: "Self-Tape Studio + 1080p export", free: false, pro: true, studio: true, enterprise: true },
                { feature: "Audition Vault", free: false, pro: true, studio: true, enterprise: true },
                { feature: "Scene Exchange", free: false, pro: true, studio: true, enterprise: true },
                { feature: "Emotional Arc + Dynamics", free: false, pro: true, studio: true, enterprise: true },
                { feature: "VO Professional Suite (10 tools)", free: false, pro: false, studio: true, enterprise: true },
                { feature: "Income tools (Masterclass, PASS)", free: false, pro: false, studio: true, enterprise: true },
                { feature: "STUDIO Dashboard", free: false, pro: false, studio: true, enterprise: true },
                { feature: "Voice Print Builder", free: false, pro: false, studio: true, enterprise: true },
                { feature: "Multi-seat admin + SSO", free: false, pro: false, studio: false, enterprise: true },
              ].map((row) => (
                <tr key={row.feature} className="border-b border-border/50">
                  <td className="py-3 px-4">{row.feature}</td>
                  {(["free", "pro", "studio", "enterprise"] as const).map((tier) => {
                    const val = row[tier];
                    return (
                      <td key={tier} className="py-3 px-4 text-center">
                        {typeof val === "boolean" ? (
                          val ? <svg className="w-5 h-5 text-success mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <span className="text-muted">—</span>
                        ) : (
                          <span className={tier === "pro" ? "font-medium text-accent-light" : tier === "enterprise" ? "font-medium text-warning" : "text-muted"}>{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise CTA */}
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-warning/5 to-accent/5 border border-border rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 mb-16">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">Stage schools & theatre companies</h2>
          <p className="text-muted">Volume pricing, multi-seat admin, student accounts, Director&apos;s Cut for teacher-student collaboration, custom VO curriculum, and co-branded options. Annual invoicing available.</p>
        </div>
        <a href="mailto:enterprise@linerunner.app" className="shrink-0 bg-warning/10 hover:bg-warning/20 text-warning font-semibold px-8 py-3.5 rounded-xl transition-colors border border-warning/20 whitespace-nowrap">
          Contact Sales
        </a>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            { q: "What are credits?", a: "1 credit = 1 character of AI-generated dialogue. A typical script page contains about 1,000 characters of dialogue, which equals roughly 1 minute of AI audio. Only the AI characters' lines consume credits — your lines are spoken live and cost nothing." },
            { q: "What happens if I run out of credits?", a: "On the Free plan, you'll need to wait until next month. On Pro and Studio, you can instantly buy credit blocks starting at $8 for 10 minutes. Credits never expire — use them whenever you need them." },
            { q: "What are credit blocks?", a: "Credit blocks are one-time purchases of extra credits for Pro and Studio subscribers. They come in 4 sizes: 10 min ($8), 30 min ($20), 60 min ($35), and 120 min ($60). Larger blocks offer a better per-minute rate. Credits from blocks never expire." },
            { q: "Is the Free plan really free?", a: "Yes. No credit card required. You get 1 complete scene run per month with 2,500 credits, basic AI voices, and script analysis. Upgrade anytime." },
            { q: "What's the difference between Pro and Studio?", a: "Pro gives you everything for rehearsal — all 10 modes, AI coaching, self-tape studio, and 40,000 credits with 10 AI voices. Studio nearly doubles your credits to 75,000 with 25 voices, and adds the entire Voice Actor Professional Suite (10 tools), income features (Masterclass marketplace, PASS memberships, Voice Print Builder), business tools (client delivery, rate calculator), and the STUDIO earnings dashboard." },
            { q: "What about stage schools and theatre companies?", a: "Enterprise plans include unlimited credits, multi-seat admin, student & faculty accounts, Director's Cut for teacher collaboration, custom curriculum, SSO, and annual invoicing. Contact enterprise@linerunner.app for a custom quote." },
            { q: "Can I cancel anytime?", a: "Yes. Pro and Studio are monthly subscriptions with no lock-in. Cancel anytime and keep access through the end of your billing period. Unused credit blocks carry over." },
            { q: "How do income features work?", a: "Studio subscribers can sell Monologue Masterclasses (you keep 85%), set up PASS fan memberships ($3/$9/$19 tiers, you keep 85%), build Gemini voice prints, and use the Client Delivery Portal (3% transaction fee). All earnings are visible in the STUDIO dashboard with monthly payouts." },
            { q: "Who processes payments?", a: "All payments are securely processed by Manifest Financial. We never store your card details." },
          ].map((faq) => (
            <details key={faq.q} className="group bg-surface border border-border rounded-xl">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                {faq.q}
                <svg className="w-5 h-5 text-muted group-open:rotate-180 transition-transform shrink-0 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Trust */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center gap-8 text-sm text-muted flex-wrap">
          <div className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>Secure payments</div>
          <div className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>Manifest Financial</div>
          <div className="flex items-center gap-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>Cancel anytime</div>
        </div>
      </div>
    </div>
  );
}
