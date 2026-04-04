"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface DeliveryData {
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
  status: string;
  delivery_link: string;
  created_at: string;
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Approval", color: "text-warning", bg: "bg-warning/15 border-warning/30" },
  approved: { label: "Approved", color: "text-success", bg: "bg-success/15 border-success/30" },
  paid: { label: "Paid", color: "text-success", bg: "bg-success/20 border-success/40" },
};

export default function DeliveryPublicPage() {
  const params = useParams();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  const fetchDelivery = useCallback(async () => {
    try {
      const res = await fetch(`/api/vo-tools/client-delivery?id=${deliveryId}`);
      if (res.ok) {
        const data = await res.json();
        setDelivery(data.delivery);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    if (deliveryId) fetchDelivery();
  }, [deliveryId, fetchDelivery]);

  const handleApprove = async () => {
    if (!delivery) return;
    setApproving(true);
    try {
      const res = await fetch("/api/vo-tools/client-delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: delivery.id, status: "approved" }),
      });
      if (res.ok) {
        setApproved(true);
        setDelivery((prev) => prev ? { ...prev, status: "approved" } : prev);
      }
    } catch {
      alert("Failed to approve. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading delivery...</div>
      </div>
    );
  }

  if (notFound || !delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl font-bold text-muted mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Delivery Not Found</h1>
          <p className="text-muted">This delivery link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_DISPLAY[delivery.status] || STATUS_DISPLAY.pending;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs text-muted uppercase tracking-wider mb-2">Voice-Over Delivery</div>
          <h1 className="text-3xl font-bold mb-2">{delivery.project_title}</h1>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${statusInfo.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusInfo.color.replace("text-", "bg-")}`} />
            <span className={statusInfo.color}>{statusInfo.label}</span>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Delivery Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">Client</div>
              <div className="font-medium">{delivery.client_name}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Email</div>
              <div className="font-medium">{delivery.client_email}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Audio File</div>
              <div className="font-medium">{delivery.audio_file_name || "audio_file.wav"}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Delivered</div>
              <div className="font-medium">{delivery.created_at?.split("T")[0] || "--"}</div>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Invoice</h2>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Hours Worked</span>
              <span>{delivery.hours_worked}h</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Hourly Rate</span>
              <span>${delivery.hourly_rate}/hr</span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-semibold">Total Due</span>
              <span className="text-2xl font-bold text-accent-light">
                ${(delivery.invoice_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Rights */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Usage Rights</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted mb-1">Rights Granted</div>
              <div className="font-medium">{delivery.usage_rights || "Not specified"}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Duration</div>
              <div className="font-medium capitalize">{delivery.usage_duration || "Not specified"}</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted bg-surface-light rounded-lg p-3">
            By approving this delivery, you acknowledge the usage rights and terms described above. All rights not explicitly granted are reserved by the voice talent.
          </div>
        </div>

        {/* Download Invoice */}
        <button
          onClick={() => {
            const invoiceHtml = `<!DOCTYPE html>
<html><head><title>Invoice - ${delivery.project_title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 24px; font-weight: 700; }
  .logo small { font-size: 12px; font-weight: 400; color: #666; display: block; }
  .badge { background: ${delivery.status === 'paid' ? '#dcfce7' : delivery.status === 'approved' ? '#dbeafe' : '#fef3c7'}; color: ${delivery.status === 'paid' ? '#166534' : delivery.status === 'approved' ? '#1e40af' : '#92400e'}; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase; }
  .section { margin-bottom: 32px; }
  .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field-label { font-size: 12px; color: #888; margin-bottom: 2px; }
  .field-value { font-size: 15px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; color: #666; padding: 8px 0; border-bottom: 2px solid #e5e5e5; }
  td { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .total-row td { border-top: 2px solid #1a1a1a; border-bottom: none; font-weight: 700; font-size: 18px; padding-top: 16px; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888; text-align: center; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="header">
  <div class="logo">Line Runner<small>Voice Actor Professional Suite</small></div>
  <span class="badge">${delivery.status}</span>
</div>
<div class="section">
  <h2>Invoice Details</h2>
  <div class="grid">
    <div><div class="field-label">Project</div><div class="field-value">${delivery.project_title}</div></div>
    <div><div class="field-label">Date</div><div class="field-value">${delivery.created_at?.split('T')[0] || '--'}</div></div>
    <div><div class="field-label">Client</div><div class="field-value">${delivery.client_name}</div></div>
    <div><div class="field-label">Email</div><div class="field-value">${delivery.client_email}</div></div>
  </div>
</div>
<div class="section">
  <h2>Services</h2>
  <table>
    <tr><th>Description</th><th>Hours</th><th>Rate</th><th style="text-align:right">Amount</th></tr>
    <tr><td>Voice-over recording & production</td><td>${delivery.hours_worked}h</td><td>$${delivery.hourly_rate}/hr</td><td style="text-align:right">$${(delivery.invoice_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
    <tr class="total-row"><td colspan="3">Total Due</td><td style="text-align:right">$${(delivery.invoice_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
  </table>
</div>
<div class="section">
  <h2>Usage Rights</h2>
  <div class="grid">
    <div><div class="field-label">Rights Granted</div><div class="field-value">${delivery.usage_rights || 'Not specified'}</div></div>
    <div><div class="field-label">Duration</div><div class="field-value">${delivery.usage_duration || 'Not specified'}</div></div>
  </div>
  <p style="font-size: 12px; color: #888; margin-top: 12px;">All rights not explicitly granted above are reserved by the voice talent.</p>
</div>
<div class="footer">Generated by Line Runner &mdash; rehearse-perform-earn.netlify.app</div>
</body></html>`;
            const w = window.open('', '_blank');
            if (w) { w.document.write(invoiceHtml); w.document.close(); }
          }}
          className="w-full mb-8 bg-surface-light hover:bg-border text-foreground font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Download Invoice (PDF)
        </button>

        {/* Approval Button */}
        {delivery.status === "pending" && (
          <div className="text-center">
            {approved ? (
              <div className="bg-success/15 border border-success/30 rounded-xl p-6 text-center">
                <svg className="w-12 h-12 mx-auto text-success mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-lg font-semibold text-success mb-1">Delivery Approved</div>
                <p className="text-sm text-muted">Thank you for your approval. The voice talent has been notified.</p>
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="bg-success hover:bg-success/80 text-white font-semibold px-12 py-4 rounded-xl transition-colors text-lg disabled:opacity-50"
              >
                {approving ? "Approving..." : "Approve Delivery"}
              </button>
            )}
          </div>
        )}

        {delivery.status === "approved" && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center">
            <svg className="w-10 h-10 mx-auto text-success mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-success font-semibold">This delivery has been approved</div>
          </div>
        )}

        {delivery.status === "paid" && (
          <div className="bg-success/15 border border-success/30 rounded-xl p-6 text-center">
            <svg className="w-10 h-10 mx-auto text-success mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-success font-semibold">This delivery has been approved and paid</div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-xs text-muted">
          Powered by Line Runner -- Voice Actor Professional Suite
        </div>
      </div>
    </div>
  );
}
