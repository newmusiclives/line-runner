import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listUsers, updateUser } from "@/lib/db/users";
import { addAuditLog } from "@/lib/db/admin";
import { z } from "zod";

const patchSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["suspend", "unsuspend", "make-admin"]),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const result = await listUsers(page, limit);
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, action } = parsed.data;

  switch (action) {
    case "suspend":
      await updateUser(userId, { suspended_at: new Date().toISOString() });
      break;
    case "unsuspend":
      await updateUser(userId, { suspended_at: null as any });
      break;
    case "make-admin":
      await updateUser(userId, { role: "admin" });
      break;
  }

  await addAuditLog(session.user.id, action, "user", userId);
  return NextResponse.json({ success: true });
}
