"use client";

import { useState, useEffect, useCallback } from "react";

interface Audition {
  id: string;
  project_name: string;
  role_name: string;
  casting_director: string;
  agency: string;
  audition_type: string;
  audition_date: string;
  status: string;
  notes: string;
  pay_rate: string;
  union_status: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  submitted: number;
  callback: number;
  booked: number;
  passed: number;
  bookingRate: number;
}

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  callback: "bg-warning/15 text-warning border border-warning/30",
  booked: "bg-success/15 text-success border border-success/30",
  passed: "bg-surface-light text-muted border border-border",
};

const TYPE_LABELS: Record<string, string> = {
  "in-person": "In-Person",
  "self-tape": "Self-Tape",
  virtual: "Virtual",
};

const FILTER_TABS = ["all", "submitted", "callback", "booked", "passed"] as const;

const emptyForm = {
  project_name: "",
  role_name: "",
  casting_director: "",
  agency: "",
  audition_type: "in-person",
  audition_date: "",
  pay_rate: "",
  union_status: "non-union",
  notes: "",
};

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, callback: 0, booked: 0, passed: 0, bookingRate: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchAuditions = useCallback(async () => {
    try {
      const res = await fetch("/api/auditions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAuditions(data.auditions);
      setStats(data.stats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditions();
  }, [fetchAuditions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        await fetchAuditions();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Audition>) => {
    try {
      const res = await fetch("/api/auditions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        await fetchAuditions();
        if (editingId === id) setEditingId(null);
      }
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/auditions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        await fetchAuditions();
      }
    } catch {
      // silent
    }
  };

  const handleEditSave = async (id: string) => {
    await handleUpdate(id, editForm);
  };

  const startEdit = (a: Audition) => {
    setEditingId(a.id);
    setEditForm({
      project_name: a.project_name || "",
      role_name: a.role_name || "",
      casting_director: a.casting_director || "",
      agency: a.agency || "",
      audition_type: a.audition_type || "in-person",
      audition_date: a.audition_date || "",
      pay_rate: a.pay_rate || "",
      union_status: a.union_status || "non-union",
      notes: a.notes || "",
    });
  };

  const filtered = filter === "all" ? auditions : auditions.filter((a) => a.status === filter);

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Audition Tracker</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Audition"}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Auditions", value: stats.total, color: "text-foreground" },
          { label: "Callbacks", value: stats.callback, color: "text-warning" },
          { label: "Booked", value: stats.booked, color: "text-success" },
          { label: "Booking Rate", value: `${stats.bookingRate}%`, color: "text-accent-light" },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl p-4">
            <div className="text-sm text-muted mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add Audition Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">New Audition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Name *"
              value={form.project_name}
              onChange={(e) => setForm({ ...form, project_name: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              required
            />
            <input
              type="text"
              placeholder="Role Name"
              value={form.role_name}
              onChange={(e) => setForm({ ...form, role_name: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Casting Director"
              value={form.casting_director}
              onChange={(e) => setForm({ ...form, casting_director: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Agency"
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <select
              value={form.audition_type}
              onChange={(e) => setForm({ ...form, audition_type: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
            >
              <option value="in-person">In-Person</option>
              <option value="self-tape">Self-Tape</option>
              <option value="virtual">Virtual</option>
            </select>
            <input
              type="date"
              value={form.audition_date}
              onChange={(e) => setForm({ ...form, audition_date: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Pay Rate"
              value={form.pay_rate}
              onChange={(e) => setForm({ ...form, pay_rate: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <select
              value={form.union_status}
              onChange={(e) => setForm({ ...form, union_status: e.target.value })}
              className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
            >
              <option value="non-union">Non-Union</option>
              <option value="SAG-AFTRA">SAG-AFTRA</option>
              <option value="AEA">AEA</option>
            </select>
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Audition"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? "bg-accent/15 text-accent-light border border-accent/30"
                : "bg-surface-light text-muted border border-border hover:text-foreground"
            }`}
          >
            {tab === "all" ? `All (${stats.total})` : `${tab} (${stats[tab as keyof Stats]})`}
          </button>
        ))}
      </div>

      {/* Audition List */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <svg className="w-12 h-12 text-muted mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 0a1.125 1.125 0 011.125-1.125h17.25a1.125 1.125 0 011.125 1.125m-19.5 0v1.5c0 .621.504 1.125 1.125 1.125m17.25 0h1.5m0 0a1.125 1.125 0 011.125 1.125M21.75 9v1.5" />
          </svg>
          <p className="text-muted text-lg mb-1">No auditions yet</p>
          <p className="text-muted text-sm">Click &quot;+ Add Audition&quot; to start tracking your auditions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="bg-surface border border-border rounded-2xl p-5">
              {editingId === a.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={editForm.project_name}
                      onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Role Name"
                      value={editForm.role_name}
                      onChange={(e) => setEditForm({ ...editForm, role_name: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Casting Director"
                      value={editForm.casting_director}
                      onChange={(e) => setEditForm({ ...editForm, casting_director: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Agency"
                      value={editForm.agency}
                      onChange={(e) => setEditForm({ ...editForm, agency: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    <select
                      value={editForm.audition_type}
                      onChange={(e) => setEditForm({ ...editForm, audition_type: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="in-person">In-Person</option>
                      <option value="self-tape">Self-Tape</option>
                      <option value="virtual">Virtual</option>
                    </select>
                    <input
                      type="date"
                      value={editForm.audition_date}
                      onChange={(e) => setEditForm({ ...editForm, audition_date: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      placeholder="Pay Rate"
                      value={editForm.pay_rate}
                      onChange={(e) => setEditForm({ ...editForm, pay_rate: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                    />
                    <select
                      value={editForm.union_status}
                      onChange={(e) => setEditForm({ ...editForm, union_status: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="non-union">Non-Union</option>
                      <option value="SAG-AFTRA">SAG-AFTRA</option>
                      <option value="AEA">AEA</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-1.5 bg-surface-light text-muted border border-border rounded-lg text-sm hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSave(a.id)}
                      className="px-4 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-lg">{a.project_name}</span>
                        {a.role_name && (
                          <span className="text-muted">as {a.role_name}</span>
                        )}
                      </div>
                      {(a.casting_director || a.agency) && (
                        <p className="text-sm text-muted mt-1">
                          {a.casting_director && <>CD: {a.casting_director}</>}
                          {a.casting_director && a.agency && <> &middot; </>}
                          {a.agency && <>Agency: {a.agency}</>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[a.status] || STATUS_STYLES.submitted}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {a.audition_date && (
                      <span className="text-sm text-muted">
                        {new Date(a.audition_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    {a.audition_type && (
                      <span className="px-2 py-0.5 bg-surface-light border border-border rounded text-xs text-muted">
                        {TYPE_LABELS[a.audition_type] || a.audition_type}
                      </span>
                    )}
                    {a.union_status && a.union_status !== "non-union" && (
                      <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-xs text-accent-light">
                        {a.union_status}
                      </span>
                    )}
                    {a.pay_rate && (
                      <span className="text-sm text-muted">{a.pay_rate}</span>
                    )}
                  </div>

                  {a.notes && (
                    <p className="text-sm text-muted mt-2 line-clamp-2">{a.notes}</p>
                  )}

                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {/* Quick status actions */}
                    {a.status === "submitted" && (
                      <button
                        onClick={() => handleUpdate(a.id, { status: "callback" })}
                        className="px-3 py-1 bg-warning/15 text-warning border border-warning/30 rounded-lg text-xs font-medium hover:bg-warning/25 transition-colors"
                      >
                        Got Callback
                      </button>
                    )}
                    {a.status === "callback" && (
                      <>
                        <button
                          onClick={() => handleUpdate(a.id, { status: "booked" })}
                          className="px-3 py-1 bg-success/15 text-success border border-success/30 rounded-lg text-xs font-medium hover:bg-success/25 transition-colors"
                        >
                          Booked!
                        </button>
                        <button
                          onClick={() => handleUpdate(a.id, { status: "passed" })}
                          className="px-3 py-1 bg-surface-light text-muted border border-border rounded-lg text-xs font-medium hover:text-foreground transition-colors"
                        >
                          Passed
                        </button>
                      </>
                    )}

                    <div className="flex-1" />

                    <button
                      onClick={() => startEdit(a)}
                      className="px-3 py-1 text-muted hover:text-foreground text-xs transition-colors"
                    >
                      Edit
                    </button>

                    {deleteConfirm === a.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted mr-1">Delete?</span>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="px-2 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded text-xs font-medium hover:bg-red-500/25 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-surface-light text-muted border border-border rounded text-xs hover:text-foreground transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(a.id)}
                        className="px-3 py-1 text-muted hover:text-red-400 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
