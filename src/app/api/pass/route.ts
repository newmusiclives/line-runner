import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  listActorProfiles,
  getActorProfileByUserId,
  createPassSubscription,
  getActiveSubscription,
} from "@/lib/db/pass";
import { createPassSubscriptionSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;

  const actors = await listActorProfiles(search);
  return NextResponse.json(actors);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPassSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { actorUserId, tier } = parsed.data;

  if (actorUserId === session.user.id) {
    return NextResponse.json({ error: "Cannot subscribe to yourself" }, { status: 400 });
  }

  // Check if already subscribed
  const existing = await getActiveSubscription(session.user.id, actorUserId);
  if (existing) {
    return NextResponse.json({ error: "Already subscribed to this actor" }, { status: 400 });
  }

  // Get actor profile for pricing
  const actorProfile = await getActorProfileByUserId(actorUserId);
  if (!actorProfile) {
    return NextResponse.json({ error: "Actor profile not found" }, { status: 404 });
  }

  const monthlyPrice =
    tier === 1
      ? actorProfile.tier1_price
      : tier === 2
        ? actorProfile.tier2_price
        : actorProfile.tier3_price;

  const subscription = await createPassSubscription(
    session.user.id,
    actorUserId,
    tier,
    monthlyPrice
  );

  return NextResponse.json({ success: true, subscription }, { status: 201 });
}
