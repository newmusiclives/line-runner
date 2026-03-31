import { NextResponse } from "next/server";
import { z } from "zod";

// In-memory store for control commands (per session)
// In production, this would use Redis or DB
const controlStore = new Map<string, { command: string; timestamp: number }>();

const commandSchema = z.object({
  command: z.enum(["play", "pause", "resume", "stop", "restart", "next", "prev"]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const since = parseInt(url.searchParams.get("since") || "0", 10);

  const entry = controlStore.get(id);
  if (entry && entry.timestamp > since) {
    return NextResponse.json({ command: entry.command, timestamp: entry.timestamp });
  }

  return NextResponse.json({ command: null, timestamp: since });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();
  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = { command: parsed.data.command, timestamp: Date.now() };
  controlStore.set(id, entry);

  // Clean up old entries after 5 minutes
  setTimeout(() => {
    const current = controlStore.get(id);
    if (current && current.timestamp === entry.timestamp) {
      controlStore.delete(id);
    }
  }, 5 * 60 * 1000);

  return NextResponse.json({ success: true, ...entry });
}
