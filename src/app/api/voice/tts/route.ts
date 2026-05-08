import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ensureTable, getSetting } from "@/lib/db/integrations";
import { checkVoiceCredits } from "@/lib/subscription-guard";
import { ensureActiveSubscription, incrementMinutesUsed } from "@/lib/db/subscriptions";
import { checkRateLimit } from "@/lib/rate-limit";

const CHARS_PER_MINUTE = 800;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 60 calls/min per user — generous for natural rehearsal, hard stop for scripted abuse.
  // In-memory limiter is best-effort on Netlify cold starts; back with Upstash for real protection.
  const rl = checkRateLimit(`tts:${session.user.id}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many TTS requests. Please slow down.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.resetIn / 1000).toString() } }
    );
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : null;
  const voiceId = typeof body?.voiceId === "string" ? body.voiceId : null;
  if (!text || !voiceId) {
    return NextResponse.json({ error: "Missing text or voiceId" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  const estimatedMinutes = Math.max(0.05, text.length / CHARS_PER_MINUTE);
  const credits = await checkVoiceCredits(session.user.id, estimatedMinutes);
  if (!credits.allowed) {
    return NextResponse.json(
      { error: credits.reason || "Out of voice credits", code: "OUT_OF_CREDITS", minutesRemaining: credits.minutesRemaining },
      { status: 402 }
    );
  }

  await ensureTable();
  const apiKey = (await getSetting("gemini_api_key")) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS not configured", code: "NOT_CONFIGURED" }, { status: 503 });
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } },
          },
        },
      }),
    }
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream TTS error: ${upstream.status}`, code: "UPSTREAM_ERROR" },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  const audioBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) {
    return NextResponse.json({ error: "No audio in response", code: "UPSTREAM_ERROR" }, { status: 502 });
  }

  const sub = await ensureActiveSubscription(session.user.id);
  await incrementMinutesUsed(sub.id, estimatedMinutes);

  return NextResponse.json({ audioBase64, sampleRate: 24000, format: "pcm-l16" });
}
