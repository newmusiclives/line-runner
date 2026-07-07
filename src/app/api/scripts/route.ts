import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listUserScripts, createScript } from "@/lib/db/scripts";
import { getActiveSubscription } from "@/lib/db/subscriptions";
import { createScriptSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scripts = await listUserScripts(session.user.id);
  const result = scripts.map((s) => ({
    ...s,
    parsed_data: JSON.parse(s.parsed_data),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 30 uploads/hour cap — generous, but stops scripted upload bombs.
  const rl = await checkRateLimit(`script-upload:${session.user.id}`, 30, 3_600_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.resetIn / 1000).toString() } }
    );
  }

  // Free tier is capped at 1 personal script upload. Pro/Studio are unlimited.
  const sub = await getActiveSubscription(session.user.id);
  const isPaid = sub && sub.plan_id !== "free";
  if (!isPaid) {
    const existing = await listUserScripts(session.user.id);
    if (existing.length >= 1) {
      return NextResponse.json(
        {
          error: "Free plan is limited to 1 script upload. Subscribe to Pro for unlimited uploads, or buy a credit block.",
          code: "FREE_UPLOAD_LIMIT",
        },
        { status: 402 }
      );
    }
  }

  const body = await request.json();
  const parsed = createScriptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, fileName, rawText, parsedData } = parsed.data;
  const script = await createScript(session.user.id, title, fileName, rawText, parsedData);

  return NextResponse.json(script, { status: 201 });
}
