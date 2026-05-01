import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { markUserOnboarded } from "@/lib/db/users";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markUserOnboarded(session.user.id);
  return NextResponse.json({ success: true });
}
