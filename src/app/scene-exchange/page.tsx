"use client";

import { useState } from "react";

interface ExchangeRoom {
  id: string;
  scriptTitle: string;
  hostName: string;
  hostCharacter: string;
  guestCharacter: string;
  status: "waiting" | "active" | "completed";
  createdAt: string;
}

const MOCK_ROOMS: ExchangeRoom[] = [
  { id: "ex-1", scriptTitle: "Romeo and Juliet — Balcony Scene", hostName: "Sarah J.", hostCharacter: "JULIET", guestCharacter: "ROMEO", status: "waiting", createdAt: "2026-03-30T10:00:00" },
  { id: "ex-2", scriptTitle: "A Streetcar Named Desire — Scene 3", hostName: "Marcus C.", hostCharacter: "STANLEY", guestCharacter: "BLANCHE", status: "waiting", createdAt: "2026-03-30T09:30:00" },
  { id: "ex-3", scriptTitle: "Hamlet — Act 3, Scene 1", hostName: "Olivia W.", hostCharacter: "HAMLET", guestCharacter: "OPHELIA", status: "active", createdAt: "2026-03-30T08:00:00" },
];

export default function SceneExchangePage() {
  const [tab, setTab] = useState<"find" | "host">("find");
  const [scriptTitle, setScriptTitle] = useState("");
  const [myCharacter, setMyCharacter] = useState("");
  const [partnerCharacter, setPartnerCharacter] = useState("");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Scene Exchange</h1>
      <p className="text-muted mb-8">Rehearse with a real human partner through the app. Same timing controls, different devices, any time zone.</p>

      {/* Tabs */}
      <div className="flex bg-surface border border-border rounded-xl p-1 mb-8">
        <button onClick={() => setTab("find")} className={`flex-1 py-3 rounded-lg font-medium transition-colors ${tab === "find" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
          Find a Partner
        </button>
        <button onClick={() => setTab("host")} className={`flex-1 py-3 rounded-lg font-medium transition-colors ${tab === "host" ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}>
          Host a Session
        </button>
      </div>

      {tab === "find" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Open Rooms</h2>
          {MOCK_ROOMS.length === 0 ? (
            <div className="text-center py-12 text-muted">No rooms available. Be the first to host a session.</div>
          ) : (
            <div className="space-y-3">
              {MOCK_ROOMS.map((room) => (
                <div key={room.id} className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between hover:border-accent/30 transition-colors">
                  <div>
                    <h3 className="font-semibold">{room.scriptTitle}</h3>
                    <div className="flex gap-4 text-sm text-muted mt-1">
                      <span>Host: {room.hostName} as {room.hostCharacter}</span>
                      <span>Looking for: <span className="text-accent-light font-medium">{room.guestCharacter}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${room.status === "waiting" ? "bg-warning/15 text-warning" : room.status === "active" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>
                      {room.status === "waiting" ? "Waiting" : room.status === "active" ? "In Progress" : "Completed"}
                    </span>
                    {room.status === "waiting" && (
                      <button className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "host" && (
        <div className="max-w-lg mx-auto">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Create a Session</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted block mb-1.5">Script Title</label>
                <input type="text" value={scriptTitle} onChange={(e) => setScriptTitle(e.target.value)} placeholder="e.g., Romeo and Juliet — Act 2, Scene 2" className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1.5">Your Character</label>
                <input type="text" value={myCharacter} onChange={(e) => setMyCharacter(e.target.value)} placeholder="e.g., JULIET" className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1.5">Partner&apos;s Character</label>
                <input type="text" value={partnerCharacter} onChange={(e) => setPartnerCharacter(e.target.value)} placeholder="e.g., ROMEO" className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
              </div>
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-muted">
                Once created, your session will appear in the &quot;Find a Partner&quot; tab. When someone joins, you&apos;ll both hear each other&apos;s voice in real time with Line Runner&apos;s timing controls.
              </div>
              <button className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors">
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
