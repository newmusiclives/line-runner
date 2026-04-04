"use client";

import { useState, useMemo } from "react";

// ── Constants from manifest-financial ────────────────────────────────
const COST_PER_1K_CREDITS = 0.198;

const PLANS = [
  { name: "Free", price: 0, credits: 2_500, minutes: 2.5, cost: 0.5 },
  { name: "Pro", price: 20, credits: 40_000, minutes: 40, cost: 7.92 },
  { name: "Studio", price: 90, credits: 75_000, minutes: 75, cost: 14.85 },
] as const;

const CREDIT_BLOCKS = [
  { label: "10K", credits: 10_000, price: 8, cost: 1.98 },
  { label: "30K", credits: 30_000, price: 20, cost: 5.94 },
  { label: "60K", credits: 60_000, price: 35, cost: 11.88 },
  { label: "120K", credits: 120_000, price: 60, cost: 23.76 },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number) => `${Math.round(n)}%`;

function marginColor(marginPct: number) {
  if (marginPct > 60) return "text-green-400";
  if (marginPct >= 40) return "text-yellow-400";
  return "text-red-400";
}

function marginBg(marginPct: number) {
  if (marginPct > 60) return "bg-green-400/10 border-green-400/20";
  if (marginPct >= 40) return "bg-yellow-400/10 border-yellow-400/20";
  return "bg-red-400/10 border-red-400/20";
}

// ── Component ────────────────────────────────────────────────────────
export default function CalculatorPage() {
  // Section 3: Revenue Projections
  const [freeUsers, setFreeUsers] = useState(100);
  const [proSubs, setProSubs] = useState(20);
  const [studioSubs, setStudioSubs] = useState(5);
  const [blocksPerMonth, setBlocksPerMonth] = useState(10);
  const [blockSize, setBlockSize] = useState("30K");

  // Section 4: Fixed costs
  const [elevenLabsCost, setElevenLabsCost] = useState(99);
  const [netlifyCost, setNetlifyCost] = useState(0);
  const [neonCost, setNeonCost] = useState(0);
  const [domainMisc, setDomainMisc] = useState(15);

  // Section 5: Pricing simulator
  const [simProPrice, setSimProPrice] = useState(20);
  const [simStudioPrice, setSimStudioPrice] = useState(90);

  // ── Derived: Section 3 ──────────────────────────────────────────
  const selectedBlock = CREDIT_BLOCKS.find((b) => b.label === blockSize)!;

  const projections = useMemo(() => {
    // Revenue
    const subRevenue = proSubs * 20 + studioSubs * 90;
    const blockRevenue = blocksPerMonth * selectedBlock.price;
    const totalRevenue = subRevenue + blockRevenue;

    // ElevenLabs cost (usage-based)
    const freeCreditUsage = freeUsers * 2_500 * 0.5;
    const proCreditUsage = proSubs * 40_000 * 0.6;
    const studioCreditUsage = studioSubs * 75_000 * 0.7;
    const blockCreditUsage = blocksPerMonth * selectedBlock.credits;
    const totalCreditsUsed = freeCreditUsage + proCreditUsage + studioCreditUsage + blockCreditUsage;
    const elevenLabsUsageCost = (totalCreditsUsed / 1000) * COST_PER_1K_CREDITS;

    // Claude API cost
    const activeProStudio = proSubs + studioSubs;
    const tokensPerUser = 500 * 10; // 500 tokens per call, 10 calls/mo
    const claudeCost = activeProStudio * tokensPerUser * (0.25 / 1000);

    const monthlyProfit = totalRevenue - elevenLabsUsageCost - claudeCost;

    return {
      subRevenue,
      blockRevenue,
      totalRevenue,
      elevenLabsUsageCost,
      claudeCost,
      monthlyProfit,
      annualProfit: monthlyProfit * 12,
    };
  }, [freeUsers, proSubs, studioSubs, blocksPerMonth, selectedBlock]);

  // ── Derived: Section 4 ──────────────────────────────────────────
  const breakEven = useMemo(() => {
    const totalFixed = elevenLabsCost + netlifyCost + neonCost + projections.claudeCost + domainMisc;
    const proMarginPerSub = 20 - 7.92; // $12.08
    const breakEvenSubs = Math.ceil(totalFixed / proMarginPerSub);
    const netProfit = projections.totalRevenue - projections.elevenLabsUsageCost - projections.claudeCost - totalFixed;

    return { totalFixed, breakEvenSubs, netProfit };
  }, [elevenLabsCost, netlifyCost, neonCost, domainMisc, projections]);

  // ── Derived: Section 5 ──────────────────────────────────────────
  const simulator = useMemo(() => {
    const proCost = 7.92;
    const studioCost = 14.85;
    const proMargin = simProPrice - proCost;
    const studioMargin = simStudioPrice - studioCost;
    const proMarginPct = simProPrice > 0 ? (proMargin / simProPrice) * 100 : 0;
    const studioMarginPct = simStudioPrice > 0 ? (studioMargin / simStudioPrice) * 100 : 0;

    let recommendation = "";
    if (proMarginPct < 40) recommendation = "Pro price is too low -- margins below 40% are unsustainable.";
    else if (proMarginPct < 60) recommendation = "Pro margins are acceptable but could be improved.";
    else recommendation = "Pro margins are healthy.";

    if (studioMarginPct < 40) recommendation += " Studio price is dangerously low.";
    else if (studioMarginPct < 60) recommendation += " Studio margins could be higher.";
    else recommendation += " Studio margins are excellent.";

    return { proMargin, studioMargin, proMarginPct, studioMarginPct, recommendation };
  }, [simProPrice, simStudioPrice]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cost vs Revenue Calculator</h1>
        <p className="text-muted">
          Financial modeling for Line Runner plans, credit blocks, and projections.
        </p>
      </div>

      {/* ── Section 1: Plan Economics ─────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Plan Economics</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const margin = plan.price - plan.cost;
            const marginPctVal = plan.price > 0 ? (margin / plan.price) * 100 : 0;
            return (
              <div
                key={plan.name}
                className="bg-surface border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <span className="text-2xl font-bold text-accent-light">
                    ${plan.price}
                    <span className="text-sm text-muted font-normal">/mo</span>
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Credits included</span>
                    <span>{plan.credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Audio minutes</span>
                    <span>{plan.minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">ElevenLabs cost</span>
                    <span className="text-red-400">${fmt(plan.cost)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-medium">
                    <span className="text-muted">Gross margin</span>
                    <span className={plan.price > 0 ? marginColor(marginPctVal) : "text-muted"}>
                      ${fmt(margin)}{" "}
                      {plan.price > 0 && (
                        <span className="text-xs">({pct(marginPctVal)})</span>
                      )}
                      {plan.price === 0 && <span className="text-xs">(loss leader)</span>}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 2: Credit Block Economics ─────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Credit Block Economics</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-left">
                <th className="px-5 py-3 font-medium">Block</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
                <th className="px-5 py-3 font-medium text-right">EL Cost</th>
                <th className="px-5 py-3 font-medium text-right">Margin</th>
                <th className="px-5 py-3 font-medium text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {CREDIT_BLOCKS.map((block) => {
                const margin = block.price - block.cost;
                const marginPctVal = (margin / block.price) * 100;
                return (
                  <tr key={block.label} className="border-b border-border/50 last:border-0">
                    <td className="px-5 py-3 font-medium">{block.label} credits</td>
                    <td className="px-5 py-3 text-right">${block.price}</td>
                    <td className="px-5 py-3 text-right text-red-400">${fmt(block.cost)}</td>
                    <td className="px-5 py-3 text-right text-green-400">${fmt(margin)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${marginBg(marginPctVal)} ${marginColor(marginPctVal)}`}>
                        {pct(marginPctVal)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 3: Revenue Projections ────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Revenue Projections Calculator</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-muted uppercase text-xs tracking-wider">Inputs</h3>
            <InputRow label="Free users" value={freeUsers} onChange={setFreeUsers} />
            <InputRow label="Pro subscribers" value={proSubs} onChange={setProSubs} />
            <InputRow label="Studio subscribers" value={studioSubs} onChange={setStudioSubs} />
            <InputRow label="Credit blocks sold / mo" value={blocksPerMonth} onChange={setBlocksPerMonth} />
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted">Average block size</label>
              <select
                value={blockSize}
                onChange={(e) => setBlockSize(e.target.value)}
                className="bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                {CREDIT_BLOCKS.map((b) => (
                  <option key={b.label} value={b.label}>
                    {b.label} (${b.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <h3 className="font-medium text-muted uppercase text-xs tracking-wider">Projections</h3>
            <ResultRow label="Subscription revenue" value={`$${fmt(projections.subRevenue)}`} />
            <ResultRow label="Credit block revenue" value={`$${fmt(projections.blockRevenue)}`} />
            <ResultRow label="Total monthly revenue" value={`$${fmt(projections.totalRevenue)}`} bold accent />
            <div className="border-t border-border pt-3" />
            <ResultRow label="ElevenLabs cost (usage)" value={`-$${fmt(projections.elevenLabsUsageCost)}`} red />
            <ResultRow label="Claude API cost (est.)" value={`-$${fmt(projections.claudeCost)}`} red />
            <div className="border-t border-border pt-3" />
            <ResultRow
              label="Net monthly profit"
              value={`${projections.monthlyProfit >= 0 ? "" : "-"}$${fmt(Math.abs(projections.monthlyProfit))}`}
              bold
              color={projections.monthlyProfit >= 0 ? "text-green-400" : "text-red-400"}
            />
            <ResultRow
              label="Annual projected profit"
              value={`${projections.annualProfit >= 0 ? "" : "-"}$${fmt(Math.abs(projections.annualProfit))}`}
              color={projections.annualProfit >= 0 ? "text-green-400" : "text-red-400"}
            />
          </div>
        </div>
      </section>

      {/* ── Section 4: Break-Even Analysis ────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Break-Even Analysis</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Fixed costs inputs */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-muted uppercase text-xs tracking-wider">Fixed Costs</h3>
            <InputRow label="ElevenLabs subscription" value={elevenLabsCost} onChange={setElevenLabsCost} prefix="$" />
            <InputRow label="Netlify hosting" value={netlifyCost} onChange={setNetlifyCost} prefix="$" />
            <InputRow label="Neon Postgres" value={neonCost} onChange={setNeonCost} prefix="$" />
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted">Claude API (from projections)</label>
              <span className="text-sm text-foreground">${fmt(projections.claudeCost)}</span>
            </div>
            <InputRow label="Domain & misc" value={domainMisc} onChange={setDomainMisc} prefix="$" />
            <div className="border-t border-border pt-3 flex items-center justify-between font-medium">
              <span className="text-sm">Total fixed costs</span>
              <span className="text-red-400">${fmt(breakEven.totalFixed)}/mo</span>
            </div>
          </div>

          {/* Break-even results */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-muted uppercase text-xs tracking-wider">Break-Even</h3>
            <div className="space-y-3">
              <ResultRow label="Pro margin per subscriber" value={`$${fmt(20 - 7.92)}`} />
              <ResultRow label="Break-even subscribers (at Pro rate)" value={`${breakEven.breakEvenSubs} subscribers`} bold />
              <div className="border-t border-border pt-3" />
              <ResultRow label="Revenue (from projections)" value={`$${fmt(projections.totalRevenue)}`} />
              <ResultRow label="Variable costs" value={`-$${fmt(projections.elevenLabsUsageCost + projections.claudeCost)}`} red />
              <ResultRow label="Fixed costs" value={`-$${fmt(breakEven.totalFixed)}`} red />
              <div className="border-t border-border pt-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current status</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                    breakEven.netProfit >= 0
                      ? "bg-green-400/10 text-green-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {breakEven.netProfit >= 0 ? "PROFIT" : "LOSS"}: ${fmt(Math.abs(breakEven.netProfit))}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Pricing Simulator ──────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pricing Simulator</h2>
        <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
          {/* Sliders */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted">Pro price</label>
                <span className="text-lg font-bold text-accent-light">${simProPrice}</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={1}
                value={simProPrice}
                onChange={(e) => setSimProPrice(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>$10</span>
                <span>$50</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted">Studio price</label>
                <span className="text-lg font-bold text-accent-light">${simStudioPrice}</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={simStudioPrice}
                onChange={(e) => setSimStudioPrice(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>$50</span>
                <span>$200</span>
              </div>
            </div>
          </div>

          {/* Margin results */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`border rounded-lg p-4 ${marginBg(simulator.proMarginPct)}`}>
              <div className="text-sm text-muted mb-1">Pro Margin</div>
              <div className={`text-2xl font-bold ${marginColor(simulator.proMarginPct)}`}>
                ${fmt(simulator.proMargin)}{" "}
                <span className="text-base">({pct(simulator.proMarginPct)})</span>
              </div>
              <div className="text-xs text-muted mt-1">EL cost: $7.92 / subscriber</div>
            </div>
            <div className={`border rounded-lg p-4 ${marginBg(simulator.studioMarginPct)}`}>
              <div className="text-sm text-muted mb-1">Studio Margin</div>
              <div className={`text-2xl font-bold ${marginColor(simulator.studioMarginPct)}`}>
                ${fmt(simulator.studioMargin)}{" "}
                <span className="text-base">({pct(simulator.studioMarginPct)})</span>
              </div>
              <div className="text-xs text-muted mt-1">EL cost: $14.85 / subscriber</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-surface-light border border-border rounded-lg p-4">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">Recommendation</div>
            <p className="text-sm text-foreground">{simulator.recommendation}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────────────────

function InputRow({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-muted">{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-24 bg-surface-light border border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-right"
        />
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  bold,
  accent,
  red,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  red?: boolean;
  color?: string;
}) {
  const valueClass = color
    ? color
    : accent
      ? "text-accent-light"
      : red
        ? "text-red-400"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-medium" : "text-muted"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-base" : ""} ${valueClass}`}>{value}</span>
    </div>
  );
}
