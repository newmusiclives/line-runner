"use client";

import { useState, useEffect, useCallback } from "react";

interface RemoteControlPanelProps {
  sessionId: string;
  onClose: () => void;
}

/**
 * Shows a link and QR code to open the remote control on a phone.
 * Also listens for BroadcastChannel messages for same-browser control.
 */
export default function RemoteControlPanel({ sessionId, onClose }: RemoteControlPanelProps) {
  const [remoteUrl, setRemoteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/remote/${sessionId}`;
    setRemoteUrl(url);
  }, [sessionId]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = remoteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [remoteUrl]);

  // Simple QR code as SVG (using a basic encoding approach)
  // For a real QR code we would use a library, but we can render a link-based approach
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(remoteUrl)}&bgcolor=1a1a24&color=e8e6e3`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Remote Control</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white rounded-xl p-3">
              {remoteUrl && (
                <img
                  src={qrUrl}
                  alt="QR code for remote control"
                  width={200}
                  height={200}
                  className="w-[200px] h-[200px]"
                />
              )}
            </div>
          </div>

          <p className="text-sm text-muted text-center">
            Scan this QR code with your phone to open the remote control. Both devices must be on the same network.
          </p>

          {/* Link */}
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={remoteUrl}
              className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono truncate"
            />
            <button
              onClick={copyLink}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? "bg-success/20 text-success"
                  : "bg-accent/20 text-accent-light hover:bg-accent/30"
              }`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-surface-light rounded-xl p-4 space-y-2">
            <p className="text-sm text-foreground font-medium">How it works:</p>
            <ul className="text-sm text-muted space-y-1">
              <li>1. Open the link on your phone</li>
              <li>2. Use the large buttons to control playback</li>
              <li>3. Same browser: instant via BroadcastChannel</li>
              <li>4. Different device: syncs via polling API</li>
            </ul>
          </div>

          <p className="text-xs text-muted text-center">
            Add to Home Screen on your phone for a full-screen PWA experience.
          </p>
        </div>
      </div>
    </div>
  );
}
