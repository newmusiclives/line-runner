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

  const db = getDb();

  // Get all scripts with their rehearsal stats
  const scripts = db.prepare(`
    SELECT
      s.id as scriptId,
      s.title as scriptTitle,
      s.genre,
      s.created_at as createdAt,
      COUNT(DISTINCT rs.id) as sessionCount,
      MAX(rs.started_at) as lastAccessed,
      (SELECT COUNT(*) FROM self_tape_takes st WHERE st.script_id = s.id AND st.is_keeper = 1) as keeperTakes
    FROM scripts s
    LEFT JOIN rehearsal_sessions rs ON rs.script_id = s.id AND rs.user_id = ?
    WHERE s.user_id = ? AND s.status = 'active'
    GROUP BY s.id
    ORDER BY MAX(rs.started_at) DESC, s.created_at DESC
  `).all(userId, userId) as Array<{
    scriptId: string; scriptTitle: string; genre: string | null;
    createdAt: string; sessionCount: number; lastAccessed: string | null; keeperTakes: number;
  }>;

  const items = scripts.map((s, i) => ({
    id: `vault-${i}`,
    scriptId: s.scriptId,
    scriptTitle: s.scriptTitle,
    characterName: "Lead",
    genre: s.genre,
    voiceConfig: null,
    lastAccessed: s.lastAccessed || s.createdAt,
    createdAt: s.createdAt,
    sessionCount: s.sessionCount,
    keeperTakes: s.keeperTakes,
  }));

  return NextResponse.json(items);
}
