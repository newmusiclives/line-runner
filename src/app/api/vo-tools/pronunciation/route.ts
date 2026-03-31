import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const rows = await sql`
    SELECT id, word, ipa, notes, tags, created_at
    FROM pronunciation_dictionary
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return Response.json({ words: rows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const body = await request.json();
  const { word, ipa, notes, tags } = body;

  if (!word || !ipa) {
    return Response.json({ error: "word and ipa are required" }, { status: 400 });
  }

  const id = nanoid();
  await sql`
    INSERT INTO pronunciation_dictionary (id, user_id, word, ipa, notes, tags, created_at)
    VALUES (${id}, ${userId}, ${word}, ${ipa}, ${notes || ""}, ${tags || ""}, NOW())
  `;

  return Response.json({ id, word, ipa, notes: notes || "", tags: tags || "" });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  await sql`
    DELETE FROM pronunciation_dictionary
    WHERE id = ${id} AND user_id = ${userId}
  `;

  return Response.json({ success: true });
}
