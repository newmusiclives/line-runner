"use client";

import { useState } from "react";

interface ActorCard {
  id: string;
  name: string;
  bio: string;
  genre: string;
  subscribers: number;
  tier1: number;
  tier2: number;
  tier3: number;
  rating: number;
}

const MOCK_ACTORS: ActorCard[] = [
  { id: "a1", name: "Sarah Jones", bio: "Stage & screen actor. Shakespeare specialist. 15 years professional experience. Royal Academy graduate.", genre: "Classical Drama", subscribers: 234, tier1: 3, tier2: 9, tier3: 19, rating: 4.9 },
  { id: "a2", name: "Marcus Chen", bio: "Commercial VO artist and audiobook narrator. 500+ projects completed. SAG-AFTRA member.", genre: "Voice Acting", subscribers: 567, tier1: 3, tier2: 9, tier3: 19, rating: 4.8 },
  { id: "a3", name: "Olivia Williams", bio: "Method actor and acting coach. Trained at Juilliard. Currently teaching at NYU Tisch.", genre: "Contemporary Drama", subscribers: 189, tier1: 3, tier2: 9, tier3: 19, rating: 5.0 },
  { id: "a4", name: "James Taylor", bio: "Character voice specialist. Animation and video game credits include major studio titles.", genre: "Character & Animation", subscribers: 412, tier1: 3, tier2: 9, tier3: 19, rating: 4.7 },
  { id: "a5", name: "Emma Garcia", bio: "Bilingual actor and VO artist. Specialising in medical narration and e-learning content.", genre: "Medical VO", subscribers: 156, tier1: 3, tier2: 9, tier3: 19, rating: 4.8 },
];

export default function PassPage() {
  const [search, setSearch] = useState("");
  const [selectedActor, setSelectedActor] = useState<ActorCard | null>(null);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(1);

  const filtered = MOCK_ACTORS.filter((a) => {
    if (!search) return true;
    return a.name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Line Runner PASS</h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Subscribe to your favourite actors. Access their takes, coaching, and exclusive content. Support the craft directly.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="relative">
          <svg className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" placeholder="Search actors by name or genre..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent" />
        </div>
      </div>

      {/* Actor Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((actor) => (
          <div key={actor.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-lg font-bold text-accent-light">
                {actor.name[0]}
              </div>
              <div>
                <h3 className="font-semibold">{actor.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="text-warning">{"★".repeat(Math.floor(actor.rating))} {actor.rating}</span>
                  <span>{actor.subscribers} subscribers</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted mb-3 flex-1">{actor.bio}</p>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-surface-light px-2 py-0.5 rounded">{actor.genre}</span>
            </div>

            {/* Tier Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center bg-surface-light rounded-lg p-2">
                <div className="text-xs text-muted">Tier 1</div>
                <div className="font-semibold text-sm">${actor.tier1}/mo</div>
              </div>
              <div className="text-center bg-accent/10 border border-accent/20 rounded-lg p-2">
                <div className="text-xs text-accent-light">Tier 2</div>
                <div className="font-semibold text-sm">${actor.tier2}/mo</div>
              </div>
              <div className="text-center bg-surface-light rounded-lg p-2">
                <div className="text-xs text-muted">Tier 3</div>
                <div className="font-semibold text-sm">${actor.tier3}/mo</div>
              </div>
            </div>

            <button onClick={() => { setSelectedActor(actor); setSelectedTier(2); }} className="w-full bg-accent hover:bg-accent-dark text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              Subscribe
            </button>
          </div>
        ))}
      </div>

      {/* Subscribe Modal */}
      {selectedActor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setSelectedActor(null)}>
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Subscribe to {selectedActor.name}</h2>

            <div className="space-y-3 mb-6">
              {([1, 2, 3] as const).map((tier) => {
                const price = tier === 1 ? selectedActor.tier1 : tier === 2 ? selectedActor.tier2 : selectedActor.tier3;
                const features = tier === 1 ? ["Access to public takes", "Script library"] : tier === 2 ? ["All Tier 1 features", "Coaching schedule", "Exclusive scene readings"] : ["All Tier 2 features", "Direct messaging", "Priority coaching access"];
                return (
                  <button key={tier} onClick={() => setSelectedTier(tier)} className={`w-full p-4 rounded-xl text-left transition-colors ${selectedTier === tier ? "bg-accent/10 border-2 border-accent" : "bg-surface-light border-2 border-transparent hover:border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Tier {tier}</span>
                      <span className="text-lg font-bold text-accent-light">${price}/mo</span>
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

            <div className="flex gap-3">
              <button onClick={() => setSelectedActor(null)} className="flex-1 bg-surface-light hover:bg-border text-foreground py-3 rounded-xl transition-colors">Cancel</button>
              <button className="flex-1 bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors">
                Subscribe — ${selectedTier === 1 ? selectedActor.tier1 : selectedTier === 2 ? selectedActor.tier2 : selectedActor.tier3}/mo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
