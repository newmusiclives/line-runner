import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getUserById } from "@/lib/db/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { password_hash, ...profile } = user;
  return NextResponse.json(profile);
}
