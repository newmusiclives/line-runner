"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellMasterclassPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(15);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Masterclass Listed!</h1>
        <p className="text-muted mb-2">Your masterclass &quot;{title}&quot; is now live on the marketplace.</p>
        <p className="text-muted mb-8">You&apos;ll earn 85% of each sale (${(price * 0.85).toFixed(2)}) with Line Runner taking a 15% platform commission.</p>
        <button onClick={() => router.push("/marketplace")} className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          View Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => router.push("/marketplace")} className="text-sm text-muted hover:text-foreground mb-6 flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back to Marketplace
      </button>

      <h1 className="text-3xl font-bold mb-2">Sell a Masterclass</h1>
      <p className="text-muted mb-8">Package your best take as a paid teaching resource. You set the price, we handle everything else.</p>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-sm text-muted block mb-1.5">Script / Monologue Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Lady Macbeth — Sleepwalking Scene" className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent" />
        </div>

        <div>
          <label className="text-sm text-muted block mb-1.5">Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe your approach, what buyers will learn, and what makes this take special..." className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent resize-none" />
        </div>

        <div>
          <label className="text-sm text-muted block mb-1.5">Annotation Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Performance notes, beat breakdown, approach explanation..." className="w-full bg-surface-light border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent resize-none" />
        </div>

        <div>
          <label className="text-sm text-muted block mb-1.5">Audio Commentary (optional)</label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted hover:border-accent/30 transition-colors cursor-pointer">
            <svg className="w-8 h-8 mx-auto mb-2 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
            <p className="text-sm">Click to record a short audio commentary about your approach</p>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted block mb-1.5">Price (${price})</label>
          <input type="range" min={5} max={50} value={price} onChange={(e) => setPrice(parseInt(e.target.value))} className="w-full accent-accent" />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>$5</span><span>$25</span><span>$50</span>
          </div>
        </div>

        <div className="bg-surface-light rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Sale price</span>
            <span className="font-medium">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted">Platform fee (15%)</span>
            <span className="text-muted">-${(price * 0.15).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
            <span>You earn per sale</span>
            <span className="text-success">${(price * 0.85).toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-xl transition-colors">
          List Masterclass for ${price}
        </button>
      </form>
    </div>
  );
}
