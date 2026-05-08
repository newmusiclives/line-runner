import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAudioFromDb } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const audio = await getAudioFromDb(id);

  if (!audio) {
    return new Response("Not found", { status: 404 });
  }

  if (audio.userId && audio.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(audio.data, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": audio.contentType || "audio/webm",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "private, max-age=86400",
    },
  });
}
