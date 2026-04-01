import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getFeatureFlags, setFeatureFlag, setFeatureTier } from "@/lib/db/admin";
import { z } from "zod";

const putSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean().optional(),
  min_tier: z.enum(["free", "pro", "studio"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const flags = await getFeatureFlags();
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

  const { key, enabled, min_tier } = parsed.data;

  if (enabled !== undefined) {
    await setFeatureFlag(key, enabled, min_tier);
  } else if (min_tier) {
    await setFeatureTier(key, min_tier);
  }

  return NextResponse.json({ success: true });
}
