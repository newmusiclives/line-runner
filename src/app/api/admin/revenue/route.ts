import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getRevenueByDay, getPlanDistribution } from "@/lib/db/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [daily, distribution] = await Promise.all([
    getRevenueByDay(),
    getPlanDistribution(),
  ]);

  return NextResponse.json({ daily, distribution });
}
