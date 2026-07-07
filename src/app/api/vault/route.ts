import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([], { status: 200 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json([]);

  const sql = getDb();

  const scripts = await sql`
    SELECT
      s.id as "scriptId",
      s.title as "scriptTitle",
      s.genre,
      s.created_at as "createdAt",
      COUNT(DISTINCT rs.id) as "sessionCount",
      MAX(rs.started_at) as "lastAccessed",
      (SELECT rs2.my_character FROM rehearsal_sessions rs2
        WHERE rs2.script_id = s.id AND rs2.user_id = ${userId}
        ORDER BY rs2.started_at DESC LIMIT 1) as "characterName",
      (SELECT COUNT(*) FROM self_tape_takes st WHERE st.script_id = s.id AND st.is_keeper = true) as "keeperTakes"
    FROM scripts s
    LEFT JOIN rehearsal_sessions rs ON rs.script_id = s.id AND rs.user_id = ${userId}
    WHERE s.user_id = ${userId} AND s.status = 'active'
    GROUP BY s.id, s.title, s.genre, s.created_at
    ORDER BY MAX(rs.started_at) DESC NULLS LAST, s.created_at DESC
  `;

  const items = scripts.map((s: any, i: number) => ({
    id: `vault-${i}`,
    scriptId: s.scriptId,
    scriptTitle: s.scriptTitle,
    characterName: s.characterName || "Lead",
    genre: s.genre,
    voiceConfig: null,
    lastAccessed: s.lastAccessed || s.createdAt,
    createdAt: s.createdAt,
    sessionCount: Number(s.sessionCount),
    keeperTakes: Number(s.keeperTakes),
  }));

  return NextResponse.json(items);
}
