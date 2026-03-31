import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";
import { z } from "zod";

const saveResultSchema = z.object({
  copyText: z.string().min(1),
  targetSeconds: z.number().min(1),
  actualSeconds: z.number().min(0),
  wordCount: z.number().int().min(0),
  wpmTarget: z.number().min(0),
  wpmActual: z.number().min(0),
  accuracy: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sql = getDb();
  const id = nanoid();
  const { copyText, targetSeconds, actualSeconds, wordCount, wpmTarget, wpmActual, accuracy } = parsed.data;

  await sql`INSERT INTO rate_history (id, user_id, job_type, usage_scope, quoted_amount, outcome, client_name, notes)
    VALUES (${id}, ${session.user.id}, 'copy-timing', 'practice', ${Math.round(accuracy)}, 'accepted', ${`${targetSeconds}s target`}, ${JSON.stringify({ copyText: copyText.slice(0, 200), targetSeconds, actualSeconds, wordCount, wpmTarget, wpmActual })})`;

  return NextResponse.json({ id, accuracy }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`SELECT * FROM rate_history WHERE user_id = ${session.user.id} AND job_type = 'copy-timing' ORDER BY created_at DESC LIMIT 20`;

  const results = rows.map((r: any) => {
    const notes = JSON.parse(r.notes || "{}");
    return {
      id: r.id,
      targetSeconds: notes.targetSeconds,
      actualSeconds: notes.actualSeconds,
      wordCount: notes.wordCount,
      wpmTarget: notes.wpmTarget,
      wpmActual: notes.wpmActual,
      accuracy: r.quoted_amount,
      createdAt: r.created_at,
    };
  });

  return NextResponse.json(results);
}
