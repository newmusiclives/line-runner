"use client";

import { useState, useEffect, useCallback } from "react";

interface ActorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  tier1_price: number;
  tier2_price: number;
  tier3_price: number;
  subscriber_count: number;
  total_earnings: number;
  created_at: string;
}

export default function PassPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actors, setActors] = useState<ActorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActor, setSelectedActor] = useState<ActorProfile | null>(null);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(2);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchActors = useCallback(async () => {
    try {
      const url = debouncedSearch
        ? `/api/pass?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/pass";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load actors");
      const data = await res.json();
      setActors(data);
    } catch {
      setError("Failed to load actors");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchActors();
  }, [fetchActors]);

  function getPriceForTier(actor: ActorProfile, tier: 1 | 2 | 3): number {
    return tier === 1 ? actor.tier1_price : tier === 2 ? actor.tier2_price : actor.tier3_price;
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(0)}`;
  }

  async function handleSubscribe() {
    if (!selectedActor) return;
    setError(null);
    setSuccessMessage(null);
    setSubscribing(true);

    try {
      const res = await fetch("/api/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId: selectedActor.user_id,
          tier: selectedTier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Subscription failed");
      }

      setSuccessMessage(`Subscribed to ${selectedActor.display_name} at Tier ${selectedTier}!`);
      setSelectedActor(null);
      fetchActors();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Line Runner PASS</h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Subscribe to your favourite actors. Access their takes, coaching, and exclusive content. Support the craft directly.
        </p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 mb-4 text-sm max-w-lg mx-auto">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl p-3 mb-4 text-sm max-w-lg mx-auto">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="relative">
          <svg className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search actors by name or bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Actor Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted">Loading actors...</div>
      ) : actors.length === 0 ? (
        <div className="text-center py-12 text-muted">No actors found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actors.map((actor) => (
            <div key={actor.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-lg font-bold text-accent-light">
                  {actor.display_name[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{actor.display_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{actor.subscriber_count} subscribers</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted mb-3 flex-1">{actor.bio || "No bio yet."}</p>

              {/* Tier Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center bg-surface-light rounded-lg p-2">
                  <div className="text-xs text-muted">Tier 1</div>
                  <div className="font-semibold text-sm">{formatPrice(actor.tier1_price)}/mo</div>
                </div>
                <div className="text-center bg-accent/10 border border-accent/20 rounded-lg p-2">
                  <div className="text-xs text-accent-light">Tier 2</div>
                  <div className="font-semibold text-sm">{formatPrice(actor.tier2_price)}/mo</div>
                </div>
                <div className="text-center bg-surface-light rounded-lg p-2">
                  <div className="text-xs text-muted">Tier 3</div>
                  <div className="font-semibold text-sm">{formatPrice(actor.tier3_price)}/mo</div>
                </div>
              </div>

              <button
                onClick={() => { setSelectedActor(actor); setSelectedTier(2); }}
                className="w-full bg-accent hover:bg-accent-dark text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Subscribe Modal */}
      {selectedActor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setSelectedActor(null)}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Subscribe to {selectedActor.display_name}</h2>

            <div className="space-y-3 mb-6">
              {([1, 2, 3] as const).map((tier) => {
                const priceCents = getPriceForTier(selectedActor, tier);
                const features = tier === 1
                  ? ["Access to public takes", "Script library"]
                  : tier === 2
                    ? ["All Tier 1 features", "Coaching schedule", "Exclusive scene readings"]
                    : ["All Tier 2 features", "Direct messaging", "Priority coaching access"];
                return (
                  <button key={tier} onClick={() => setSelectedTier(tier)} className={`w-full p-4 rounded-xl text-left transition-colors ${selectedTier === tier ? "bg-accent/10 border-2 border-accent" : "bg-surface-light border-2 border-transparent hover:border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Tier {tier}</span>
                      <span className="text-lg font-bold text-accent-light">{formatPrice(priceCents)}/mo</span>
                    </div>
                    <ul className="space-y-1">
                      {features.map((f) => (
                        <li key={f} className="text-sm text-muted flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setSelectedActor(null)} className="flex-1 bg-surface-light hover:bg-border text-foreground py-3 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="flex-1 bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {subscribing ? "Processing..." : `Subscribe -- ${formatPrice(getPriceForTier(selectedActor, selectedTier))}/mo`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
