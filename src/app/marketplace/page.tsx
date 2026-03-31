"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  script_title: string;
  description: string;
  price_cents: number;
  rating: number;
  review_count: number;
  purchase_count: number;
  annotation_notes: string | null;
  created_at: string;
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchListings = useCallback(async () => {
    try {
      const url = debouncedSearch
        ? `/api/marketplace?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/marketplace";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load listings");
      const data = await res.json();
      setListings(data);
    } catch {
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  async function handlePurchase(listingId: string) {
    setError(null);
    setSuccessMessage(null);
    setPurchasing(listingId);

    try {
      const res = await fetch(`/api/marketplace/${listingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purchase" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Purchase failed");
      }

      setSuccessMessage("Purchase successful! You now have access to this masterclass.");
      fetchListings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Monologue Masterclass</h1>
          <p className="text-muted mt-1">Learn from the best takes. Buy and sell teaching content.</p>
        </div>
        <Link href="/marketplace/sell" className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
          Sell Your Take
        </Link>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 mb-4 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl p-3 mb-4 text-sm">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search masterclasses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading masterclasses...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-muted">No masterclasses found. Be the first to sell your take!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-sm font-bold text-accent-light">
                  {listing.seller_name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{listing.seller_name}</div>
                  <div className="flex items-center gap-1 text-xs text-warning">
                    {"★".repeat(Math.max(1, Math.floor(listing.rating)))} <span className="text-muted">{listing.rating > 0 ? listing.rating.toFixed(1) : "New"}</span>
                  </div>
                </div>
              </div>

              <h3 className="font-semibold mb-1">{listing.script_title}</h3>
              <p className="text-sm text-muted mb-3 flex-1 line-clamp-2">{listing.description}</p>

              <div className="flex items-center gap-3 text-xs text-muted mb-4">
                <span>{listing.purchase_count} purchased</span>
                <span>{listing.review_count} reviews</span>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-bold text-accent-light">${(listing.price_cents / 100).toFixed(0)}</span>
                <button
                  onClick={() => handlePurchase(listing.id)}
                  disabled={purchasing === listing.id}
                  className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {purchasing === listing.id ? "Buying..." : "Buy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
