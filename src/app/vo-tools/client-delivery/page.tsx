"use client";

import { useState, useEffect, useCallback } from "react";

type DeliveryStatus = "pending" | "approved" | "paid";

interface Delivery {
  id: string;
  project_title: string;
  client_name: string;
  client_email: string;
  audio_file_name: string;
  hours_worked: number;
  hourly_rate: number;
  invoice_amount: number;
  usage_rights: string;
  usage_duration: string;
  status: DeliveryStatus;
  delivery_link: string;
  created_at: string;
}

const USAGE_RIGHTS = [
  "All Media in Perpetuity",
  "Broadcast (TV/Radio) - 1 Year",
  "Digital Only - 1 Year",
  "Social Media Only - 6 Months",
  "Internal / Corporate Use Only",
  "Regional Broadcast - 13 Weeks",
  "National Broadcast - 13 Weeks",
  "Non-Broadcast / Industrial",
];

const STATUS_BADGES: Record<DeliveryStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  paid: "bg-success/20 text-success border-success/40",
};

export default function ClientDeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | "all">("all");

  // Form state
  const [projectTitle, setProjectTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [hoursWorked, setHoursWorked] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(250);
  const [usageRights, setUsageRights] = useState(USAGE_RIGHTS[0]);
  const [usageDuration, setUsageDuration] = useState<"perpetuity" | "limited">("perpetuity");
  const [limitedDuration, setLimitedDuration] = useState("1 year");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const invoiceTotal = hoursWorked * hourlyRate;

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch("/api/vo-tools/client-delivery");
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFileName(e.target.files[0].name);
    }
  };

  const handleGenerateLink = async () => {
    if (!projectTitle.trim() || !clientName.trim() || !clientEmail.trim()) {
      alert("Please fill in project title, client name, and email.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/vo-tools/client-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_title: projectTitle,
          client_name: clientName,
          client_email: clientEmail,
          audio_file_name: audioFileName || "audio_file.wav",
          hours_worked: hoursWorked,
          hourly_rate: hourlyRate,
          usage_rights: usageRights,
          usage_duration: usageDuration === "perpetuity" ? "perpetuity" : limitedDuration,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const fullLink = `${window.location.origin}${data.delivery_link}`;
        setGeneratedLink(fullLink);
        // Refresh list
        fetchDeliveries();
      } else {
        alert("Failed to create delivery.");
      }
    } catch {
      alert("Failed to create delivery.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: DeliveryStatus) => {
    try {
      await fetch("/api/vo-tools/client-delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, status: newStatus } : d));
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this delivery?")) return;
    try {
      await fetch(`/api/vo-tools/client-delivery?id=${id}`, { method: "DELETE" });
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };

  const resetForm = () => {
    setProjectTitle("");
    setClientName("");
    setClientEmail("");
    setAudioFileName("");
    setHoursWorked(1);
    setHourlyRate(250);
    setUsageRights(USAGE_RIGHTS[0]);
    setUsageDuration("perpetuity");
    setLimitedDuration("1 year");
    setGeneratedLink(null);
    setShowForm(false);
  };

  const filteredDeliveries = filterStatus === "all"
    ? deliveries
    : deliveries.filter((d) => d.status === filterStatus);

  const totalRevenue = deliveries.reduce((sum, d) => sum + (d.invoice_amount || 0), 0);
  const pendingCount = deliveries.filter((d) => d.status === "pending").length;
  const paidTotal = deliveries.filter((d) => d.status === "paid").reduce((sum, d) => sum + (d.invoice_amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Client Delivery Portal</h1>
          <p className="text-muted">Send files, invoice, usage rights, and get sign-off in one link.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {showForm ? "Cancel" : "New Delivery"}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent-light">{deliveries.length}</div>
          <div className="text-xs text-muted">Total Deliveries</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-warning">{pendingCount}</div>
          <div className="text-xs text-muted">Pending</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-success">${paidTotal.toLocaleString()}</div>
          <div className="text-xs text-muted">Paid Revenue</div>
        </div>
      </div>

      {/* New Delivery Form */}
      {showForm && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Create Delivery</h2>

          {generatedLink ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Delivery Link Generated</h3>
              <div className="bg-surface-light rounded-xl px-4 py-3 font-mono text-sm text-accent-light mb-4 max-w-md mx-auto break-all">
                {generatedLink}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                  className="bg-accent hover:bg-accent-dark text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                >
                  Copy Link
                </button>
                <button onClick={resetForm} className="bg-surface-light hover:bg-border text-foreground font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted block mb-1.5">Project Title</label>
                  <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g., Corporate Explainer Video"
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1.5">Client Name</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Jane Smith"
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1.5">Client Email</label>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g., jane@company.com"
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1.5">Audio File</label>
                  <div className="relative">
                    <input type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" id="audio-upload" />
                    <label htmlFor="audio-upload"
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/30 transition-colors block">
                      {audioFileName ? (
                        <span className="text-sm text-foreground">{audioFileName}</span>
                      ) : (
                        <span className="text-sm text-muted">Click to upload audio (WAV, MP3)</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted block mb-1.5">Hours Worked</label>
                    <input type="number" value={hoursWorked} onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                      min={0.25} step={0.25}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="text-sm text-muted block mb-1.5">Hourly Rate ($)</label>
                    <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      min={0} step={25}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent" />
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                  <div className="text-sm text-muted mb-1">Invoice Total</div>
                  <div className="text-3xl font-bold text-accent-light">
                    ${invoiceTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted mt-1">{hoursWorked}h x ${hourlyRate}/hr</div>
                </div>

                <div>
                  <label className="text-sm text-muted block mb-1.5">Usage Rights</label>
                  <select value={usageRights} onChange={(e) => setUsageRights(e.target.value)}
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent">
                    {USAGE_RIGHTS.map((right) => (
                      <option key={right} value={right}>{right}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted block mb-1.5">Usage Duration</label>
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setUsageDuration("perpetuity")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${usageDuration === "perpetuity" ? "bg-accent text-white" : "bg-surface-light text-muted hover:text-foreground"}`}>
                      In Perpetuity
                    </button>
                    <button onClick={() => setUsageDuration("limited")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${usageDuration === "limited" ? "bg-accent text-white" : "bg-surface-light text-muted hover:text-foreground"}`}>
                      Time-Limited
                    </button>
                  </div>
                  {usageDuration === "limited" && (
                    <input type="text" value={limitedDuration} onChange={(e) => setLimitedDuration(e.target.value)}
                      placeholder="e.g., 1 year, 13 weeks"
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <button onClick={handleGenerateLink} disabled={saving}
                  className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-xl transition-colors text-lg disabled:opacity-50">
                  {saving ? "Creating..." : "Generate Delivery Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "approved", "paid"] as const).map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filterStatus === status ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:text-foreground"
            }`}>
            {status} {status !== "all" && `(${deliveries.filter((d) => d.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Deliveries</h2>
        {loading ? (
          <div className="text-center py-12 text-muted text-sm">Loading deliveries...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>{filterStatus === "all" ? "No deliveries yet. Create your first delivery above." : `No ${filterStatus} deliveries.`}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-surface-light rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <h3 className="font-medium truncate">{delivery.project_title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize shrink-0 ${STATUS_BADGES[delivery.status as DeliveryStatus] || STATUS_BADGES.pending}`}>
                      {delivery.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {delivery.status === "pending" && (
                      <button onClick={() => handleUpdateStatus(delivery.id, "approved")}
                        className="text-xs bg-success/15 text-success hover:bg-success/25 px-2.5 py-1 rounded-lg border border-success/30">
                        Mark Approved
                      </button>
                    )}
                    {delivery.status === "approved" && (
                      <button onClick={() => handleUpdateStatus(delivery.id, "paid")}
                        className="text-xs bg-success/15 text-success hover:bg-success/25 px-2.5 py-1 rounded-lg border border-success/30">
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${delivery.delivery_link}`)}
                      className="text-xs text-accent-light hover:text-accent transition-colors px-2 py-1">
                      Copy Link
                    </button>
                    <button onClick={() => handleDelete(delivery.id)}
                      className="text-xs text-muted hover:text-danger transition-colors px-2 py-1">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-muted">
                  <span>{delivery.client_name}</span>
                  <span>{delivery.client_email}</span>
                  <span className="font-semibold">${(delivery.invoice_amount || 0).toLocaleString()}</span>
                  <span>{delivery.usage_rights}</span>
                  <span>{delivery.created_at?.split("T")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
