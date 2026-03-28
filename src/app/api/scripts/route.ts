import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listUserScripts, createScript } from "@/lib/db/scripts";
import { createScriptSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scripts = listUserScripts(session.user.id);
  const result = scripts.map((s) => ({
    ...s,
    parsed_data: JSON.parse(s.parsed_data),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createScriptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, fileName, rawText, parsedData } = parsed.data;
  const script = createScript(session.user.id, title, fileName, rawText, parsedData);

  return NextResponse.json(script, { status: 201 });
}
