import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getFeatureFlags, setFeatureFlag } from "@/lib/db/admin";
import { z } from "zod";

const putSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const flags = getFeatureFlags();
  return NextResponse.json(flags);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { key, enabled } = parsed.data;
  setFeatureFlag(key, enabled);

  return NextResponse.json({ success: true });
}
