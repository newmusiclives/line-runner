import { NextResponse } from "next/server";
import { z } from "zod";
import { getControlCommandSince, setControlCommand } from "@/lib/db/rehearsal-control";

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

  try {
    const entry = await getControlCommandSince(id, since);
    if (entry) {
      return NextResponse.json(entry);
    }
  } catch {
    // DB unavailable — degrade to "no command" rather than 500 so the poller
    // (which fires every second) doesn't spam errors.
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

  const timestamp = Date.now();
  try {
    await setControlCommand(id, parsed.data.command, timestamp);
  } catch {
    return NextResponse.json({ error: "Could not store command" }, { status: 503 });
  }

  return NextResponse.json({ success: true, command: parsed.data.command, timestamp });
}
