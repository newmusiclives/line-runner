import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

async function ensureTable() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS auditions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    role_name TEXT,
    casting_director TEXT,
    agency TEXT,
    audition_type TEXT DEFAULT 'in-person',
    audition_date TEXT,
    callback_date TEXT,
    status TEXT DEFAULT 'submitted',
    notes TEXT,
    script_id TEXT,
    self_tape_url TEXT,
    pay_rate TEXT,
    union_status TEXT DEFAULT 'non-union',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTable();
  const sql = getDb();
  const rows = await sql`SELECT * FROM auditions WHERE user_id = ${session.user.id} ORDER BY created_at DESC`;

  const stats = {
    total: rows.length,
    submitted: rows.filter((r: any) => r.status === "submitted").length,
    callback: rows.filter((r: any) => r.status === "callback").length,
    booked: rows.filter((r: any) => r.status === "booked").length,
    passed: rows.filter((r: any) => r.status === "passed").length,
    bookingRate:
      rows.length > 0
        ? Math.round(
            (rows.filter((r: any) => r.status === "booked").length /
              rows.length) *
              100
          )
        : 0,
  };

  return NextResponse.json({ auditions: rows, stats });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTable();
  const body = await request.json();
  const sql = getDb();
  const id = nanoid();

  await sql`INSERT INTO auditions (id, user_id, project_name, role_name, casting_director, agency, audition_type, audition_date, status, notes, pay_rate, union_status)
    VALUES (${id}, ${session.user.id}, ${body.project_name || ""}, ${body.role_name || ""}, ${body.casting_director || ""}, ${body.agency || ""}, ${body.audition_type || "in-person"}, ${body.audition_date || null}, ${body.status || "submitted"}, ${body.notes || ""}, ${body.pay_rate || ""}, ${body.union_status || "non-union"})`;

  return NextResponse.json({ id });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const sql = getDb();
  await sql`UPDATE auditions SET
    project_name = COALESCE(${body.project_name}, project_name),
    role_name = COALESCE(${body.role_name}, role_name),
    casting_director = COALESCE(${body.casting_director}, casting_director),
    agency = COALESCE(${body.agency}, agency),
    audition_type = COALESCE(${body.audition_type}, audition_type),
    audition_date = COALESCE(${body.audition_date}, audition_date),
    callback_date = COALESCE(${body.callback_date}, callback_date),
    status = COALESCE(${body.status}, status),
    notes = COALESCE(${body.notes}, notes),
    pay_rate = COALESCE(${body.pay_rate}, pay_rate),
    union_status = COALESCE(${body.union_status}, union_status),
    updated_at = NOW()
    WHERE id = ${body.id} AND user_id = ${session.user.id}`;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id required" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM auditions WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ success: true });
}
