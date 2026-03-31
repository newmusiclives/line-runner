import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";
import type { VOGenre, CurriculumLevel } from "@/types";

const VALID_GENRES: VOGenre[] = ["commercial", "audiobook", "e-learning", "character", "medical", "promo", "podcast"];
const VALID_LEVELS: CurriculumLevel[] = [1, 2, 3, 4, 5];

const BADGE_NAMES: Record<CurriculumLevel, string> = {
  1: "Foundational",
  2: "Developing",
  3: "Intermediate",
  4: "Advanced",
  5: "Professional",
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");

  let rows;
  if (genre && VALID_GENRES.includes(genre as VOGenre)) {
    rows = await sql`
      SELECT * FROM curriculum_progress
      WHERE user_id = ${userId} AND genre = ${genre}
    `;
  } else {
    rows = await sql`
      SELECT * FROM curriculum_progress
      WHERE user_id = ${userId}
    `;
  }

  const progress = (rows as any[]).map((r) => ({
    userId: r.user_id,
    genre: r.genre as VOGenre,
    currentLevel: r.current_level as CurriculumLevel,
    completedScripts: JSON.parse(r.completed_scripts || "[]"),
    certificationBadge: r.certification_badge,
  }));

  return NextResponse.json(progress);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { genre, scriptId, level } = body;

  if (!genre || !VALID_GENRES.includes(genre)) {
    return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
  }
  if (!scriptId || typeof scriptId !== "string") {
    return NextResponse.json({ error: "scriptId required" }, { status: 400 });
  }
  if (!level || !VALID_LEVELS.includes(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  // Get or create progress row
  const existing = await sql`
    SELECT * FROM curriculum_progress
    WHERE user_id = ${userId} AND genre = ${genre}
  `;

  let completedScripts: string[];
  let currentLevel: CurriculumLevel;
  let certificationBadge: string | null;

  if (existing[0]) {
    const row = existing[0] as any;
    completedScripts = JSON.parse(row.completed_scripts || "[]");
    currentLevel = row.current_level;
    certificationBadge = row.certification_badge;
  } else {
    completedScripts = [];
    currentLevel = 1;
    certificationBadge = null;
  }

  // Add script to completed list if not already there
  if (!completedScripts.includes(scriptId)) {
    completedScripts.push(scriptId);
  }

  // Count completed scripts at the given level
  // Script IDs follow a pattern like "com-1-1" where the middle number is level
  const scriptsAtLevel = completedScripts.filter((s) => {
    const parts = s.split("-");
    return parts.length >= 3 && parseInt(parts[1]) === level;
  });

  // If all 3 scripts at this level are done, unlock next level and award badge
  if (scriptsAtLevel.length >= 3 && currentLevel === level) {
    certificationBadge = `${genre}-level-${level}-${BADGE_NAMES[level as CurriculumLevel]}`;
    if (level < 5) {
      currentLevel = (level + 1) as CurriculumLevel;
    }
  }

  const completedJson = JSON.stringify(completedScripts);

  if (existing[0]) {
    await sql`
      UPDATE curriculum_progress
      SET completed_scripts = ${completedJson},
          current_level = ${currentLevel},
          certification_badge = ${certificationBadge},
          updated_at = NOW()
      WHERE user_id = ${userId} AND genre = ${genre}
    `;
  } else {
    const id = nanoid();
    await sql`
      INSERT INTO curriculum_progress (id, user_id, genre, current_level, completed_scripts, certification_badge)
      VALUES (${id}, ${userId}, ${genre}, ${currentLevel}, ${completedJson}, ${certificationBadge})
    `;
  }

  return NextResponse.json({
    userId,
    genre,
    currentLevel,
    completedScripts,
    certificationBadge,
  });
}
