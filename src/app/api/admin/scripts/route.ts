import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listAllScripts, updateScriptStatus } from "@/lib/db/scripts";
import { addAuditLog } from "@/lib/db/admin";
import { z } from "zod";

const patchSchema = z.object({
  scriptId: z.string().min(1),
  status: z.enum(["flagged", "removed", "active"]),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const result = listAllScripts(page, limit);
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

  const { scriptId, status } = parsed.data;
  updateScriptStatus(scriptId, status);
  addAuditLog(session.user.id, `script-${status}`, "script", scriptId);

  return NextResponse.json({ success: true });
}
