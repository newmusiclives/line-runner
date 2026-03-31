import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { getSession, getSessionMetrics } from "@/lib/db/rehearsals";
import { generatePerformanceNotes, buildStumbleHeatmap } from "@/lib/ai/performance-coach";
import type { ScriptLine, LineMetric } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const rehearsal = await getSession(id);
  if (!rehearsal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (rehearsal.user_id !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sql = getDb();

  // Fetch session metrics from line_metrics table
  const rawMetrics = await getSessionMetrics(id);
  const metrics: LineMetric[] = rawMetrics.map((m: any) => ({
    lineId: m.line_id,
    lineIndex: m.line_index,
    characterName: m.character_name,
    timingMs: m.timing_ms,
    skipped: Boolean(m.skipped),
    replayed: Boolean(m.replayed),
  }));

  // Fetch script data for the rehearsal
  const scriptRows = await sql`SELECT parsed_data FROM scripts WHERE id = ${rehearsal.script_id}`;
  if (!scriptRows[0]) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  const parsed = JSON.parse((scriptRows[0] as any).parsed_data);
  const lines: ScriptLine[] = parsed.lines || [];

  // Build emotions map (simple empty map - emotions are computed client-side)
  const emotions = new Map<string, any>();

  // Generate performance notes
  const notes = generatePerformanceNotes(
    lines,
    metrics,
    emotions,
    rehearsal.my_character,
    id
  );

  // Build stumble heatmap from stumble_events table
  const stumbleRows = await sql`
    SELECT line_id, line_index, COUNT(*) as count
    FROM stumble_events
    WHERE session_id = ${id}
    GROUP BY line_id, line_index
  `;

  const stumbleEvents = (stumbleRows as any[]).map((r) => ({
    lineId: r.line_id,
    lineIndex: r.line_index,
    count: Number(r.count),
  }));

  const heatmapMap = buildStumbleHeatmap(stumbleEvents);
  const heatmap: Record<string, { severity: string; count: number }> = {};
  for (const [lineId, data] of heatmapMap.entries()) {
    heatmap[lineId] = data;
  }

  return NextResponse.json({ notes, heatmap });
}
