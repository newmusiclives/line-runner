"use client";

import { useState } from "react";
import Link from "next/link";

interface MockListing {
  id: string;
  sellerName: string;
  scriptTitle: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  genre: string;
}

const MOCK_LISTINGS: MockListing[] = [
  { id: "mc-1", sellerName: "Sarah Jones", scriptTitle: "Lady Macbeth — Sleepwalking Scene", description: "A masterclass in building from whisper to confession. Includes annotated beat breakdown and three progressive takes showing my approach.", price: 15, rating: 4.8, reviewCount: 23, purchaseCount: 67, genre: "Classical Drama" },
  { id: "mc-2", sellerName: "Marcus Chen", scriptTitle: "Willy Loman — Requiem", description: "Death of a Salesman's final moments. I break down the transition from defiance to defeat, with notes on breath control during the emotional peak.", price: 20, rating: 4.9, reviewCount: 15, purchaseCount: 42, genre: "American Drama" },
  { id: "mc-3", sellerName: "Olivia Williams", scriptTitle: "Blanche DuBois — Final Exit", description: "The famous 'kindness of strangers' sequence with full emotional arc analysis. Before-and-after takes across 5 sessions.", price: 25, rating: 5.0, reviewCount: 31, purchaseCount: 89, genre: "American Drama" },
  { id: "mc-4", sellerName: "James Taylor", scriptTitle: "Hamlet — To Be Or Not To Be", description: "Fresh take on the most famous monologue in English. I treat it as a genuine decision, not a performance piece. Session notes included.", price: 10, rating: 4.6, reviewCount: 8, purchaseCount: 34, genre: "Classical Drama" },
  { id: "mc-5", sellerName: "Emma Garcia", scriptTitle: "Nina — The Seagull", description: "Chekhov requires stillness. My approach to Nina's final monologue focuses on restraint and the power of what's unsaid.", price: 18, rating: 4.7, reviewCount: 12, purchaseCount: 28, genre: "Classical Drama" },
  { id: "mc-6", sellerName: "Sarah Jones", scriptTitle: "Commercial VO — Warm Authority", description: "How to find the balance between approachable and authoritative for insurance, financial, and healthcare reads.", price: 12, rating: 4.9, reviewCount: 45, purchaseCount: 156, genre: "Voice Acting" },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");

  const genres = ["all", ...new Set(MOCK_LISTINGS.map((l) => l.genre))];
  const filtered = MOCK_LISTINGS.filter((l) => {
    const matchesSearch = !search || l.scriptTitle.toLowerCase().includes(search.toLowerCase()) || l.sellerName.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genreFilter === "all" || l.genre === genreFilter;
    return matchesSearch && matchesGenre;
  });

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

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" placeholder="Search masterclasses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent" />
        </div>
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent">
          {genres.map((g) => <option key={g} value={g}>{g === "all" ? "All Genres" : g}</option>)}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((listing) => (
          <div key={listing.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-sm font-bold text-accent-light">
                {listing.sellerName[0]}
              </div>
              <div>
                <div className="text-sm font-medium">{listing.sellerName}</div>
                <div className="flex items-center gap-1 text-xs text-warning">
                  {"★".repeat(Math.floor(listing.rating))} <span className="text-muted">{listing.rating}</span>
                </div>
              </div>
            </div>

            <h3 className="font-semibold mb-1">{listing.scriptTitle}</h3>
            <p className="text-sm text-muted mb-3 flex-1 line-clamp-2">{listing.description}</p>

            <div className="flex items-center gap-3 text-xs text-muted mb-4">
              <span className="bg-surface-light px-2 py-0.5 rounded">{listing.genre}</span>
              <span>{listing.purchaseCount} purchased</span>
              <span>{listing.reviewCount} reviews</span>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl font-bold text-accent-light">${listing.price}</span>
              <button className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
