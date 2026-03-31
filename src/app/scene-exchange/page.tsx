"use client";

import { useState, useEffect, useCallback } from "react";

interface ExchangeRoom {
  id: string;
  script_id: string;
  script_title: string;
  host_user_id: string;
  host_name: string;
  host_character: string;
  guest_character: string | null;
  guest_user_id: string | null;
  guest_name: string | null;
  status: "waiting" | "active" | "completed";
  created_at: string;
}

interface UserScript {
  id: string;
  title: string;
}

export default function SceneExchangePage() {
  const [tab, setTab] = useState<"find" | "host">("find");
  const [rooms, setRooms] = useState<ExchangeRoom[]>([]);
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [myCharacter, setMyCharacter] = useState("");
  const [partnerCharacter, setPartnerCharacter] = useState("");

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/scene-exchange");
      if (!res.ok) throw new Error("Failed to load rooms");
      const data = await res.json();
      setRooms(data);
    } catch {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScripts = useCallback(async () => {
    try {
      const res = await fetch("/api/scripts");
      if (!res.ok) return;
      const data = await res.json();
      setScripts(data.map((s: any) => ({ id: s.id, title: s.title })));
    } catch {
      // scripts loading is best-effort
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchScripts();
  }, [fetchRooms, fetchScripts]);

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setCreating(true);

    try {
      const res = await fetch("/api/scene-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: selectedScriptId,
          hostCharacter: myCharacter.trim(),
          guestCharacter: partnerCharacter.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Failed to create room");
      }

      setSuccessMessage("Room created! Switch to 'Find a Partner' to see it.");
      setSelectedScriptId("");
      setMyCharacter("");
      setPartnerCharacter("");
      fetchRooms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom(roomId: string) {
    setError(null);
    setJoining(roomId);

    try {
      const res = await fetch(`/api/scene-exchange/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Failed to join room");
      }

      fetchRooms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(null);
    }
  }

  async function handleLeaveRoom(roomId: string) {
    setError(null);

    try {
      const res = await fetch(`/api/scene-exchange/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Failed to leave room");
      }

      fetchRooms();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Scene Exchange</h1>
      <p className="text-muted mb-8">Rehearse with a real human partner through the app. Same timing controls, different devices, any time zone.</p>

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
          {loading ? (
            <div className="text-center py-12 text-muted">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-muted">No rooms available. Be the first to host a session.</div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div key={room.id} className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between hover:border-accent/30 transition-colors">
                  <div>
                    <h3 className="font-semibold">{room.script_title}</h3>
                    <div className="flex gap-4 text-sm text-muted mt-1">
                      <span>Host: {room.host_name} as {room.host_character}</span>
                      <span>Looking for: <span className="text-accent-light font-medium">{room.guest_character}</span></span>
                      {room.guest_name && (
                        <span>Guest: {room.guest_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${room.status === "waiting" ? "bg-warning/15 text-warning" : room.status === "active" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>
                      {room.status === "waiting" ? "Waiting" : room.status === "active" ? "In Progress" : "Completed"}
                    </span>
                    {room.status === "waiting" && (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={joining === room.id}
                        className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {joining === room.id ? "Joining..." : "Join"}
                      </button>
                    )}
                    {room.status === "active" && (
                      <button
                        onClick={() => handleLeaveRoom(room.id)}
                        className="bg-surface-light hover:bg-border text-foreground font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                      >
                        Leave
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
          <form onSubmit={handleCreateRoom} className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Create a Session</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted block mb-1.5">Script</label>
                {scripts.length > 0 ? (
                  <select
                    value={selectedScriptId}
                    onChange={(e) => setSelectedScriptId(e.target.value)}
                    required
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  >
                    <option value="">Select a script...</option>
                    {scripts.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted bg-surface-light rounded-lg p-3">
                    Upload a script first to create a scene exchange session.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted block mb-1.5">Your Character</label>
                <input
                  type="text"
                  value={myCharacter}
                  onChange={(e) => setMyCharacter(e.target.value)}
                  placeholder="e.g., JULIET"
                  required
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm text-muted block mb-1.5">Partner&apos;s Character</label>
                <input
                  type="text"
                  value={partnerCharacter}
                  onChange={(e) => setPartnerCharacter(e.target.value)}
                  placeholder="e.g., ROMEO"
                  required
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-muted">
                Once created, your session will appear in the &quot;Find a Partner&quot; tab. When someone joins, you&apos;ll both hear each other&apos;s voice in real time with Line Runner&apos;s timing controls.
              </div>
              <button
                type="submit"
                disabled={creating || !selectedScriptId}
                className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
