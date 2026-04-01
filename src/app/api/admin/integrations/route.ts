import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  ensureTable,
  getAllSettings,
  upsertSetting,
  deleteSetting,
  isValidKey,
  type IntegrationKey,
} from "@/lib/db/integrations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTable();
  const settings = await getAllSettings();

  // Mask secret values — only show last 4 chars
  const masked = settings.map((s) => ({
    key: s.key,
    value: maskValue(s.key, s.value),
    hasValue: !!s.value,
    updated_at: s.updated_at,
  }));

  return NextResponse.json(masked);
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTable();
  const body = await request.json();
  const { key, value } = body as { key: string; value: string };

  if (!key || !isValidKey(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  if (!value || value.trim() === "") {
    await deleteSetting(key as IntegrationKey);
    return NextResponse.json({ success: true, action: "deleted" });
  }

  await upsertSetting(key as IntegrationKey, value.trim());
  return NextResponse.json({ success: true, action: "saved" });
}

function maskValue(key: string, value: string): string {
  if (!value) return "";
  // Don't mask URLs
  if (key.includes("url") || key.includes("location_id")) return value;
  if (value.length <= 8) return "****" + value.slice(-2);
  return "****" + value.slice(-4);
}
