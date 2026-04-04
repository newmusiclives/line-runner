"use client";

import { useState, useEffect } from "react";

interface ReferralData {
  code: string;
  referralLink: string;
  stats: {
    total: number;
    pending: number;
    completed: number;
    creditsEarned: number;
  };
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch("/api/referrals");
        if (res.ok) setData(await res.json());
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  async function copyToClipboard(text: string, type: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
    }
  }

  function shareViaEmail() {
    if (!data) return;
    const subject = encodeURIComponent("Join me on Line Runner!");
    const body = encodeURIComponent(
      `Hey! I've been using Line Runner to rehearse scripts with AI scene partners and it's amazing. Use my referral link to sign up and we both get bonus voice minutes:\n\n${data.referralLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function shareViaTwitter() {
    if (!data) return;
    const text = encodeURIComponent(
      `I've been rehearsing scripts with AI scene partners on @LineRunner and it's a game-changer. Sign up with my link and we both get bonus voice minutes! ${data.referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <svg className="w-8 h-8 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-2">Referrals</h1>
        <p className="text-muted">Unable to load referral data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Refer a Friend</h1>
        <p className="text-muted mt-1">Share Line Runner and earn bonus voice minutes</p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-surface border border-border rounded-2xl p-8 mb-6 text-center">
        <div className="text-sm text-muted uppercase tracking-wider font-medium mb-3">Your Referral Code</div>
        <div className="text-4xl font-bold tracking-widest text-accent-light mb-4">{data.code}</div>
        <button
          onClick={() => copyToClipboard(data.code, "code")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent/10 text-accent-light hover:bg-accent/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {copied === "code" ? "Copied!" : "Copy Code"}
        </button>
      </div>

      {/* Referral Link */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="text-sm font-medium mb-2">Referral Link</div>
        <div className="flex gap-2">
          <div className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-muted truncate">
            {data.referralLink}
          </div>
          <button
            onClick={() => copyToClipboard(data.referralLink, "link")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-dark transition-colors shrink-0"
          >
            {copied === "link" ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => copyToClipboard(data.referralLink, "link")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-surface-light text-foreground hover:bg-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.061a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
            </svg>
            Copy Link
          </button>
          <button
            onClick={shareViaEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-surface-light text-foreground hover:bg-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Email
          </button>
          <button
            onClick={shareViaTwitter}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-surface-light text-foreground hover:bg-border transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Referred", value: data.stats.total, color: "text-accent-light" },
          { label: "Pending", value: data.stats.pending, color: "text-amber-400" },
          { label: "Completed", value: data.stats.completed, color: "text-success" },
          { label: "Minutes Earned", value: data.stats.creditsEarned, color: "text-accent-light" },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="text-sm text-muted mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Share Your Link",
              description: "Send your unique referral link or code to friends who would love Line Runner.",
            },
            {
              step: "2",
              title: "They Sign Up",
              description: "When your friend creates an account using your link, the referral is tracked automatically.",
            },
            {
              step: "3",
              title: "You Both Win",
              description: "When they upgrade to a paid plan, you earn 10 bonus voice minutes added to your account.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/15 text-accent-light flex items-center justify-center font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
