import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { checkSubscription, checkFeatureAccess, checkVoiceCredits } from "@/lib/subscription-guard";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const feature = searchParams.get("feature");
  const minutes = searchParams.get("minutes");

  // Check specific feature access
  if (feature) {
    const result = await checkFeatureAccess(session.user.id, feature);
    return NextResponse.json(result);
  }

  // Check voice credit availability
  if (minutes) {
    const result = await checkVoiceCredits(session.user.id, parseFloat(minutes));
    return NextResponse.json(result);
  }

  // General subscription check
  const sub = await checkSubscription(session.user.id);
  return NextResponse.json(sub);
}
