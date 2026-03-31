"use client";

import { useState } from "react";

type DeliveryStatus = "draft" | "sent" | "viewed" | "approved" | "paid";

interface Delivery {
  id: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  audioFileName: string;
  hoursWorked: number;
  hourlyRate: number;
  usageRights: string;
  usageDuration: string;
  status: DeliveryStatus;
  createdAt: string;
  link: string;
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
  draft: "bg-surface-light text-muted border-border",
  sent: "bg-accent/15 text-accent-light border-accent/30",
  viewed: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  paid: "bg-success/20 text-success border-success/40",
};

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "d1",
    projectTitle: "Meridian Solutions Corporate Video",
    clientName: "Sarah Chen",
    clientEmail: "sarah@meridian.com",
    audioFileName: "meridian_final_v2.wav",
    hoursWorked: 2.5,
    hourlyRate: 250,
    usageRights: "Internal / Corporate Use Only",
    usageDuration: "perpetuity",
    status: "paid",
    createdAt: "2026-03-22",
    link: "https://linerunner.app/deliver/abc123",
  },
  {
    id: "d2",
    projectTitle: "HealthFirst Radio Spot",
    clientName: "Mike Johnson",
    clientEmail: "mike@healthfirst.com",
    audioFileName: "healthfirst_30s_radio.wav",
    hoursWorked: 1,
    hourlyRate: 350,
    usageRights: "National Broadcast - 13 Weeks",
    usageDuration: "13 weeks",
    status: "approved",
    createdAt: "2026-03-25",
    link: "https://linerunner.app/deliver/def456",
  },
  {
    id: "d3",
    projectTitle: "TechVault Explainer Series",
    clientName: "Lisa Park",
    clientEmail: "lisa@techvault.io",
    audioFileName: "techvault_ep3_master.mp3",
    hoursWorked: 4,
    hourlyRate: 200,
    usageRights: "Digital Only - 1 Year",
    usageDuration: "1 year",
    status: "viewed",
    createdAt: "2026-03-28",
    link: "https://linerunner.app/deliver/ghi789",
  },
];

export default function ClientDeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [showForm, setShowForm] = useState(false);

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

  const invoiceTotal = hoursWorked * hourlyRate;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAudioFileName(e.target.files[0].name);
    }
  };

  const handleGenerateLink = () => {
    if (!projectTitle.trim() || !clientName.trim() || !clientEmail.trim()) {
      alert("Please fill in project title, client name, and email.");
      return;
    }
    const id = `d-${Date.now()}`;
    const link = `https://linerunner.app/deliver/${id}`;
    const newDelivery: Delivery = {
      id,
      projectTitle,
      clientName,
      clientEmail,
      audioFileName: audioFileName || "audio_file.wav",
      hoursWorked,
      hourlyRate,
      usageRights,
      usageDuration: usageDuration === "perpetuity" ? "perpetuity" : limitedDuration,
      status: "sent",
      createdAt: new Date().toISOString().split("T")[0],
      link,
    };
    setDeliveries((prev) => [newDelivery, ...prev]);
    setGeneratedLink(link);
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
                <button
                  onClick={resetForm}
                  className="bg-surface-light hover:bg-border text-foreground font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                >
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
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g., Corporate Explainer Video"
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1.5">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Jane Smith"
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1.5">Client Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g., jane@company.com"
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted block mb-1.5">Audio File</label>
                  <div className="relative">
                    <input type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" id="audio-upload" />
                    <label
                      htmlFor="audio-upload"
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/30 transition-colors block"
                    >
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
                    <input
                      type="number"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                      min={0.25}
                      step={0.25}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted block mb-1.5">Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      min={0}
                      step={25}
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Invoice Preview */}
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                  <div className="text-sm text-muted mb-1">Invoice Total</div>
                  <div className="text-3xl font-bold text-accent-light">
                    ${invoiceTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted mt-1">{hoursWorked}h x ${hourlyRate}/hr</div>
                </div>

                <div>
                  <label className="text-sm text-muted block mb-1.5">Usage Rights</label>
                  <select
                    value={usageRights}
                    onChange={(e) => setUsageRights(e.target.value)}
                    className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent"
                  >
                    {USAGE_RIGHTS.map((right) => (
                      <option key={right} value={right}>{right}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted block mb-1.5">Usage Duration</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setUsageDuration("perpetuity")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        usageDuration === "perpetuity" ? "bg-accent text-white" : "bg-surface-light text-muted hover:text-foreground"
                      }`}
                    >
                      In Perpetuity
                    </button>
                    <button
                      onClick={() => setUsageDuration("limited")}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        usageDuration === "limited" ? "bg-accent text-white" : "bg-surface-light text-muted hover:text-foreground"
                      }`}
                    >
                      Time-Limited
                    </button>
                  </div>
                  {usageDuration === "limited" && (
                    <input
                      type="text"
                      value={limitedDuration}
                      onChange={(e) => setLimitedDuration(e.target.value)}
                      placeholder="e.g., 1 year, 13 weeks"
                      className="w-full bg-surface-light border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    />
                  )}
                </div>
              </div>

              {/* Generate Button - full width */}
              <div className="md:col-span-2">
                <button
                  onClick={handleGenerateLink}
                  className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-xl transition-colors text-lg"
                >
                  Generate Delivery Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Deliveries */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Past Deliveries</h2>
        {deliveries.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>No deliveries yet. Create your first delivery above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-surface-light rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium truncate">{delivery.projectTitle}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${STATUS_BADGES[delivery.status]}`}>
                      {delivery.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted">
                    <span>{delivery.clientName}</span>
                    <span>${(delivery.hoursWorked * delivery.hourlyRate).toLocaleString()}</span>
                    <span>{delivery.usageRights}</span>
                    <span>{delivery.createdAt}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(delivery.link)}
                  className="text-sm text-accent-light hover:text-accent transition-colors shrink-0"
                >
                  Copy Link
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
