"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VoiceChatProps {
  roomId: string;
  userId: string;
  partnerId: string | null;
  disabled?: boolean;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type ConnectionState = "disconnected" | "connecting" | "connected" | "failed";

async function sendSignal(
  roomId: string,
  type: string,
  payload: any,
  toUser?: string
) {
  await fetch(`/api/scene-exchange/${roomId}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload),
      toUser,
    }),
  });
}

async function pollSignals(
  roomId: string
): Promise<
  { id: string; from_user: string; type: string; payload: string }[]
> {
  try {
    const res = await fetch(`/api/scene-exchange/${roomId}/signal`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.signals || [];
  } catch {
    return [];
  }
}

export default function VoiceChat({
  roomId,
  userId,
  partnerId,
  disabled,
}: VoiceChatProps) {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [muted, setMuted] = useState(false);
  const [audioActive, setAudioActive] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isInitiator = partnerId ? userId < partnerId : false;

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioActive(false);
    setState("disconnected");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleSignal = useCallback(
    async (signal: {
      from_user: string;
      type: string;
      payload: string;
    }) => {
      const pc = pcRef.current;
      if (!pc) return;

      let data: any;
      try {
        data = JSON.parse(signal.payload);
      } catch {
        data = signal.payload;
      }

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(roomId, "answer", answer, signal.from_user);
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (signal.type === "ice-candidate") {
        if (data) {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        }
      } else if (signal.type === "hangup") {
        cleanup();
      }
    },
    [roomId, cleanup]
  );

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      const signals = await pollSignals(roomId);
      for (const sig of signals) {
        await handleSignal(sig);
      }
    }, 2000);
  }, [roomId, handleSignal]);

  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg =
          dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        setAudioActive(avg > 10);
        animFrameRef.current = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    } catch {
      // AudioContext may not be available
    }
  }, []);

  const connect = useCallback(async () => {
    if (!partnerId) return;

    setState("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote audio
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          setupAudioAnalyser(event.streams[0]);
        }
      };

      // ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(
            roomId,
            "ice-candidate",
            event.candidate.toJSON(),
            partnerId
          );
        }
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setState("connected");
        } else if (s === "failed" || s === "closed") {
          setState(s === "failed" ? "failed" : "disconnected");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected") {
          setState("connected");
        }
      };

      // Start polling before creating offer/answer so we catch the response
      startPolling();

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(roomId, "offer", offer, partnerId);
      }
      // Non-initiator will receive offer via polling and respond with answer
    } catch (err: any) {
      console.error("VoiceChat connect error:", err);
      setState("failed");
      cleanup();
    }
  }, [
    partnerId,
    roomId,
    isInitiator,
    startPolling,
    setupAudioAnalyser,
    cleanup,
  ]);

  const disconnect = useCallback(async () => {
    if (partnerId) {
      await sendSignal(roomId, "hangup", "bye", partnerId).catch(() => {});
    }
    cleanup();
  }, [roomId, partnerId, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const statusColor =
    state === "connected"
      ? "bg-green-500"
      : state === "connecting"
        ? "bg-yellow-500"
        : state === "failed"
          ? "bg-red-500"
          : "bg-gray-500";

  const statusLabel =
    state === "connected"
      ? "Connected"
      : state === "connecting"
        ? "Connecting..."
        : state === "failed"
          ? "Failed"
          : "Disconnected";

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${statusColor} ${
              state === "connecting" ? "animate-pulse" : ""
            } ${audioActive && state === "connected" ? "animate-pulse" : ""}`}
          />
          <span className="text-sm font-medium">{statusLabel}</span>
        </div>

        {state !== "disconnected" && state !== "failed" && (
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg transition-colors ${
              muted
                ? "bg-red-500/15 text-red-400"
                : "bg-surface-light text-foreground hover:bg-border"
            }`}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 19L17.591 17.591L5.409 5.409L4 4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 01-5.834-4.547M19.5 10.5V12a7.432 7.432 0 01-.38 2.364M15 9.354V4.5a3 3 0 00-5.68-1.337M6.75 8.386v.164a3 3 0 003.902 2.87"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {state === "disconnected" || state === "failed" ? (
          <button
            onClick={connect}
            disabled={disabled || !partnerId}
            className="flex-1 bg-accent hover:bg-accent-dark text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!partnerId ? "Waiting for partner..." : "Connect Voice"}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="flex-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {state === "failed" && (
        <p className="text-xs text-red-400 mt-2">
          Connection failed. Check your microphone permissions and try again.
        </p>
      )}

      {/* Hidden audio element for remote playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
}
