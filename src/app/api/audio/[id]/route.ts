import { getAudioFromDb } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const audio = await getAudioFromDb(id);

  if (!audio) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = Buffer.from(audio.data, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": audio.contentType || "audio/webm",
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
