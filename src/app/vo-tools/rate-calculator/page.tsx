"use client";

import { useState } from "react";
import { calculateRate, JOB_TYPE_LABELS, USAGE_SCOPE_LABELS, NEGOTIATION_SCRIPTS } from "@/lib/vo/rate-calculator";
import type { VOJobType, UsageScope, RateQuote, NegotiationScript } from "@/types";

export default function RateCalculatorPage() {
  const [jobType, setJobType] = useState<VOJobType>("commercial-digital");
  const [usageScope, setUsageScope] = useState<UsageScope>("national");
  const [quote, setQuote] = useState<RateQuote | null>(null);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [selectedScript, setSelectedScript] = useState<NegotiationScript | null>(null);

  const handleCalculate = () => {
    setQuote(calculateRate(jobType, usageScope));
  };

  const formatCents = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Rate Calculator</h1>
      <p className="text-muted mb-8">Know your worth before you quote. GVAA-based rate guidelines.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Job Specification</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted block mb-1.5">Job Type</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value as VOJobType)} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent">
                {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Usage Scope</label>
              <select value={usageScope} onChange={(e) => setUsageScope(e.target.value as UsageScope)} className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent">
                {Object.entries(USAGE_SCOPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <button onClick={handleCalculate} className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors">
              Calculate Rate
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Your Quote</h2>
          {quote ? (
            <div className="space-y-4">
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 text-center">
                <div className="text-sm text-muted mb-1">Suggested Quote</div>
                <div className="text-4xl font-bold text-accent-light">{formatCents(quote.suggestedQuote)}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-light rounded-lg p-3 text-center">
                  <div className="text-xs text-muted mb-1">GVAA Minimum</div>
                  <div className="font-semibold text-success">{formatCents(quote.gvaaMinimum)}</div>
                </div>
                <div className="bg-surface-light rounded-lg p-3 text-center">
                  <div className="text-xs text-muted mb-1">Market Midpoint</div>
                  <div className="font-semibold text-foreground">{formatCents(quote.marketMidpoint)}</div>
                </div>
                <div className="bg-surface-light rounded-lg p-3 text-center">
                  <div className="text-xs text-muted mb-1">Premium Rate</div>
                  <div className="font-semibold text-warning">{formatCents(quote.premiumRate)}</div>
                </div>
              </div>
              <div className="text-sm text-muted text-center">
                {JOB_TYPE_LABELS[quote.jobType]} / {USAGE_SCOPE_LABELS[quote.usageScope]}
              </div>
              <button onClick={() => setShowNegotiation(!showNegotiation)} className="w-full bg-surface-light hover:bg-border text-foreground font-medium py-2.5 rounded-xl text-sm transition-colors">
                {showNegotiation ? "Hide" : "Show"} Negotiation Coach
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              <p>Select a job type and usage scope, then calculate to see recommended rates.</p>
            </div>
          )}
        </div>
      </div>

      {/* Negotiation Coach */}
      {showNegotiation && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Negotiation Coach</h2>
          <p className="text-muted mb-6">Scripted responses to the five most common client pushback scenarios.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {NEGOTIATION_SCRIPTS.map((script, i) => (
              <button key={i} onClick={() => setSelectedScript(selectedScript?.scenario === script.scenario ? null : script)} className={`bg-surface border rounded-xl p-5 text-left transition-colors ${selectedScript?.scenario === script.scenario ? "border-accent" : "border-border hover:border-accent/30"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${script.strategy === "hold-firm" ? "bg-danger/15 text-danger" : script.strategy === "counter" ? "bg-warning/15 text-warning" : "bg-muted/15 text-muted"}`}>
                    {script.strategy.replace("-", " ")}
                  </span>
                </div>
                <h3 className="font-medium text-sm mb-1">&quot;{script.scenario}&quot;</h3>
              </button>
            ))}
          </div>
          {selectedScript && (
            <div className="mt-4 bg-surface border border-accent/20 rounded-xl p-6">
              <h3 className="font-semibold mb-1">When they say: &quot;{selectedScript.scenario}&quot;</h3>
              <p className="text-sm text-accent-light mb-3 uppercase">{selectedScript.strategy.replace("-", " ")} strategy</p>
              <p className="text-muted leading-relaxed">{selectedScript.response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
