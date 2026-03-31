"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface VaultItem {
  id: string;
  scriptId: string;
  scriptTitle: string;
  characterName: string;
  genre: string | null;
  voiceConfig: string | null;
  lastAccessed: string;
  createdAt: string;
  sessionCount: number;
  keeperTakes: number;
}

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recent" | "favorites">("all");

  const fetchVault = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault");
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVault(); }, [fetchVault]);

  const filtered = items.filter((item) => {
    const matchesSearch = !search || item.scriptTitle.toLowerCase().includes(search.toLowerCase()) || item.characterName.toLowerCase().includes(search.toLowerCase()) || (item.genre || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (filter === "recent") return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Audition Vault</h1>
          <p className="text-muted mt-1">Every script, voice config, and take — always accessible</p>
        </div>
        <Link href="/upload" className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Script
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text" placeholder="Search by title, character, or genre..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex bg-surface border border-border rounded-xl p-1">
          {(["all", "recent"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
              {f === "all" ? "All" : "Recent"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">{search ? "No matches found" : "Vault is empty"}</h2>
          <p className="text-muted mb-6">{search ? "Try a different search term" : "Upload scripts and run rehearsals to build your vault"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg leading-tight line-clamp-2">{item.scriptTitle}</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted mb-3">
                <span className="bg-surface-light px-2 py-0.5 rounded-full">{item.characterName}</span>
                {item.genre && <span className="bg-surface-light px-2 py-0.5 rounded-full capitalize">{item.genre}</span>}
              </div>
              <div className="flex gap-4 text-sm text-muted mb-4">
                <span>{item.sessionCount} session{item.sessionCount !== 1 ? "s" : ""}</span>
                <span>{item.keeperTakes} keeper{item.keeperTakes !== 1 ? "s" : ""}</span>
              </div>
              <div className="text-xs text-muted mb-4">
                Last accessed {new Date(item.lastAccessed).toLocaleDateString()}
              </div>
              <div className="mt-auto flex gap-2">
                <Link href={`/upload?scriptId=${item.scriptId}`} className="flex-1 bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2 rounded-lg transition-colors text-center">
                  Rehearse
                </Link>
                <button className="p-2 text-muted hover:text-accent-light transition-colors rounded-lg hover:bg-surface-light" title="Export">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
