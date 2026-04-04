import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ensureTable, getSetting } from "@/lib/db/integrations";
import { checkVoiceCredits } from "@/lib/subscription-guard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has voice credits remaining
  const creditCheck = await checkVoiceCredits(session.user.id, 0.1);

  await ensureTable();
  const apiKey = await getSetting("elevenlabs_api_key");

  return NextResponse.json({
    engine: apiKey ? "elevenlabs" : "browser",
    apiKey: apiKey || null,
    credits: {
      minutesRemaining: creditCheck.minutesRemaining,
      hasCredits: creditCheck.allowed,
    },
  });
}
